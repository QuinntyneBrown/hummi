import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LibraryStore,
  PlayerOverlays,
  PlayerStore,
  PlaylistDetailDto,
  PlaylistDialogs,
  PlaylistsApi,
  ShareDialogs,
  SignInGate,
  apiResource,
} from '@hummi/api';
import {
  AlertComponent,
  ButtonDirective,
  EmptyStateComponent,
  ErrorBlockComponent,
  ErrorPageComponent,
  IconComponent,
  NOT_FOUND,
  PageHeaderComponent,
  SkeletonComponent,
  ToastService,
  TrackListComponent,
  formatLength,
} from '@hummi/components';
import { map } from 'rxjs';

import { DeletePlaylistDialogComponent } from '../dialogs/delete-playlist-dialog';
import { PlaylistFormDialogComponent } from '../dialogs/playlist-form-dialog';

/**
 * A playlist page (`/playlists/{id}`, L2-023). The owner sees "{n} tracks · {length} · {private|public}",
 * Play, Share, Rename and Delete, and can select rows: the info bar offers Remove from playlist and Add to
 * another playlist. An empty playlist shows Nothing here yet with only Share. Someone else's playlist is
 * read-only: Play, Save to my library, Share and "This playlist belongs to {owner}" (L2-024). A private
 * playlist without its share link shows the Forbidden page (L2-045).
 */
@Component({
  selector: 'hm-playlist',
  imports: [
    RouterLink,
    AlertComponent,
    ButtonDirective,
    DeletePlaylistDialogComponent,
    EmptyStateComponent,
    ErrorBlockComponent,
    ErrorPageComponent,
    IconComponent,
    PageHeaderComponent,
    PlaylistFormDialogComponent,
    SkeletonComponent,
    TrackListComponent,
  ],
  templateUrl: './playlist.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaylistComponent {
  private readonly api = inject(PlaylistsApi);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  readonly dialogs = inject(PlaylistDialogs);
  readonly library = inject(LibraryStore);
  readonly player = inject(PlayerStore);
  readonly overlays = inject(PlayerOverlays);
  private readonly shares = inject(ShareDialogs);
  private readonly gate = inject(SignInGate);
  private readonly route = inject(ActivatedRoute);
  private readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), { initialValue: '' });
  /** The share link's code, which opens a private playlist (L2-024 AC4). */
  private readonly shareCode = toSignal(this.route.queryParamMap.pipe(map((p) => p.get('share'))), {
    initialValue: null,
  });

  readonly playlist = apiResource(() => this.api.get(untracked(this.id), untracked(this.shareCode)));
  /** Someone else's playlist is in the viewer's Library (L2-024 AC3); flipped at once on Save. */
  readonly saved = signal(false);
  readonly selected = signal<readonly number[]>([]);
  readonly renaming = signal(false);
  readonly deleting = signal(false);
  readonly removing = signal(false);
  readonly rows = [1, 2, 3, 4, 5, 6];
  /** A deleted or unknown playlist shows Not found (L2-044). */
  readonly notFound = NOT_FOUND;

  readonly returnUrl = computed(() => `/playlists/${this.id()}`);

  readonly tracks = computed(() => {
    const state = this.playlist.state();
    return state.status === 'ready' ? state.value.entries.map((e) => e.track) : [];
  });

  constructor() {
    // Read again when the id changes or a dialog saved a playlist change.
    effect(() => {
      const state = this.playlist.state();
      if (state.status === 'ready') untracked(() => this.saved.set(state.value.saved));
    });
    let seen = `${this.id()}|${this.dialogs.changes()}`;
    effect(() => {
      const now = `${this.id()}|${this.dialogs.changes()}`;
      if (now !== seen) {
        seen = now;
        untracked(() => {
          this.selected.set([]);
          this.playlist.reload();
        });
      }
    });
  }

  firstName(name: string): string {
    return name.split(' ')[0];
  }

  share(p: PlaylistDetailDto): void {
    this.shares.share({
      type: 'playlist',
      id: p.id,
      name: p.name,
      byline: `by ${p.ownerName}`,
      coverUrl: p.entries[0]?.track.coverUrl ?? null,
    });
  }

  /** Save to my library (L2-024 AC3); signed out, the sign-in prompt instead. */
  async toggleSaved(p: PlaylistDetailDto): Promise<void> {
    if (!this.gate.allow()) return;
    const saved = !this.saved();
    this.saved.set(saved);
    const result = await this.api.setSaved(p.id, saved, this.shareCode());
    if (!result.ok) {
      this.saved.set(!saved);
      this.toasts.showDanger('Couldn’t save the playlist', 'Check your connection and try again.');
      return;
    }
    this.dialogs.changed();
    this.toasts.show(saved ? `Saved “${p.name}” to your library` : `Removed “${p.name}” from your library`);
  }

  subtitle(p: PlaylistDetailDto): string {
    const count = `${p.trackCount} ${p.trackCount === 1 ? 'track' : 'tracks'}`;
    return p.isOwner
      ? `${count} · ${formatLength(p.durationSeconds)} · ${p.isPublic ? 'public' : 'private'}`
      : `${count} · by ${p.ownerName} · ${p.isPublic ? 'public' : 'private'}`;
  }

  toggle({ index, selected }: { index: number; selected: boolean }): void {
    this.selected.update((list) => (selected ? [...list, index] : list.filter((i) => i !== index)));
  }

  async removeSelected(p: PlaylistDetailDto): Promise<void> {
    const entryIds = this.selected().map((i) => p.entries[i].entryId);
    this.removing.set(true);
    const result = await this.api.removeEntries(p.id, entryIds);
    this.removing.set(false);
    if (!result.ok) {
      this.toasts.showDanger('Couldn’t remove the tracks', 'Nothing was removed. Try again in a moment.');
      return;
    }
    this.toasts.show(
      entryIds.length === 1
        ? `Removed “${p.entries[this.selected()[0]].track.title}”`
        : `Removed ${entryIds.length} tracks`,
    );
    this.selected.set([]);
    this.playlist.reload();
  }

  addSelected(p: PlaylistDetailDto): void {
    this.dialogs.addToPlaylist(
      this.selected().map((i) => p.entries[i].track),
      true,
    );
  }

  renameClosed(): void {
    this.renaming.set(false);
  }

  deleteClosed(reason: 'deleted' | 'cancelled'): void {
    this.deleting.set(false);
    if (reason === 'deleted') void this.router.navigateByUrl('/library');
  }
}
