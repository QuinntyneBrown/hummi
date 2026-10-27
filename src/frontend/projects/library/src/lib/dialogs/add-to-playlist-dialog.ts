import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { PlaylistChoiceDto, PlaylistDialogs, PlaylistTrack, PlaylistsApi } from '@hummi/api';
import {
  AlertComponent,
  ButtonDirective,
  CheckboxComponent,
  DialogComponent,
  EmptyStateComponent,
  SpinnerComponent,
  ToastService,
} from '@hummi/components';

const ADDED_FAILED = 'The connection dropped before we could save. Nothing was added.';

/**
 * Add to playlist (L2-020), rendered by the shell for PlaylistDialogs. For one track the checkboxes show
 * the playlists already holding it, and Save sets exactly the checked ones in one change; Undo puts the
 * old set back. In append mode (a selection, an album) nothing is checked and Save appends them to
 * each checked playlist; a single track already there asks "Add it again?". A dropped connection closes
 * the dialog with the danger toast and Retry; any other failure keeps it open with "That didn’t work".
 */
@Component({
  selector: 'hm-add-to-playlist-dialog',
  imports: [AlertComponent, ButtonDirective, CheckboxComponent, DialogComponent, EmptyStateComponent, SpinnerComponent],
  template: `
    @if (choices() === null) {
      <hm-dialog [heading]="heading()" description="Pick one or more. You can change this later." (dismiss)="close()">
        <hm-spinner label="Loading playlists" />
        <button footer hmButton type="button" (click)="close()">Cancel</button>
      </hm-dialog>
    } @else if (!choices()!.length) {
      <hm-dialog heading="Add to playlist" description="You don’t have a playlist yet." (dismiss)="close()">
        <hm-empty-state icon="music" heading="No playlists" [text]="'Create one and ' + subject() + ' goes in it.'" />
        <button footer hmButton type="button" (click)="close()">Cancel</button>
        <button footer hmButton="primary" type="button" (click)="newPlaylist()">Create playlist</button>
      </hm-dialog>
    } @else {
      <hm-dialog [heading]="heading()" description="Pick one or more. You can change this later." (dismiss)="close()">
        @if (failed()) {
          <hm-alert tone="danger" heading="That didn’t work">
            We couldn’t save your changes. Nothing was added; try again.
          </hm-alert>
        }
        <fieldset [disabled]="busy()">
          <legend>Choose playlists</legend>
          @for (choice of choices(); track choice.id) {
            <hm-checkbox
              [label]="choice.name"
              [fieldId]="'pl-' + choice.id"
              [hint]="choice.trackCount + (choice.trackCount === 1 ? ' track' : ' tracks')"
              [disabled]="busy()"
              [checked]="checked().has(choice.id)"
              (checkedChange)="toggle(choice.id, $event)"
            />
          }
        </fieldset>
        <button hmButton="ghost" type="button" [disabled]="busy()" (click)="newPlaylist()">New playlist</button>
        <button footer hmButton type="button" [disabled]="busy()" (click)="close()">Cancel</button>
        <button footer hmButton="primary" type="button" [busy]="busy()" [disabled]="busy()" (click)="save()">
          @if (busy()) {
            <span class="spinner" aria-hidden="true"></span>Saving…
          } @else {
            Save
          }
        </button>
      </hm-dialog>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddToPlaylistDialogComponent implements OnInit {
  private readonly api = inject(PlaylistsApi);
  private readonly dialogs = inject(PlaylistDialogs);
  private readonly toasts = inject(ToastService);
  readonly tracks = input.required<PlaylistTrack[]>();
  /** Append to the checked playlists rather than set one track's membership. */
  readonly append = input(false);

  readonly choices = signal<PlaylistChoiceDto[] | null>(null);
  readonly checked = signal<ReadonlySet<string>>(new Set());
  readonly busy = signal(false);
  readonly failed = signal(false);
  private original: string[] = [];

  readonly single = computed(() => this.tracks().length === 1);
  /** One track from its own actions: the checkboxes are its membership (AC1, AC2). */
  readonly membership = computed(() => this.single() && !this.append());
  readonly subject = computed(() =>
    this.single() ? `“${this.tracks()[0].title}”` : `these ${this.tracks().length} tracks`,
  );
  readonly heading = computed(() =>
    this.single() ? `Add ${this.subject()} to a playlist` : `Add ${this.tracks().length} tracks to a playlist`,
  );

  async ngOnInit(): Promise<void> {
    const result = await this.api.mine(this.membership() ? this.tracks()[0].id : undefined);
    const choices = result.ok ? result.value : [];
    if (this.membership()) this.original = choices.filter((c) => c.containsTrack).map((c) => c.id);
    this.checked.set(new Set(this.original));
    this.choices.set(choices);
  }

  toggle(id: string, on: boolean): void {
    this.checked.update((set) => {
      const next = new Set(set);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  close(): void {
    if (!this.busy()) this.dialogs.close();
  }

  newPlaylist(): void {
    this.dialogs.newPlaylist(this.tracks());
  }

  async save(): Promise<void> {
    this.busy.set(true);
    this.failed.set(false);
    const ids = [...this.checked()];
    const done = this.membership() ? await this.saveMembership(ids) : await this.appendTo(ids);
    this.busy.set(false);
    if (done === 'failed') this.failed.set(true);
    else this.dialogs.close();
  }

  /** One track: the checked set becomes its membership (AC2); Undo restores the old one. */
  private async saveMembership(ids: string[]): Promise<'done' | 'failed'> {
    const track = this.tracks()[0];
    const original = this.original;
    const result = await this.api.setMembership(track.id, ids);
    if (!result.ok) {
      if (result.problem.status !== 0) return 'failed';
      this.retryToast(() => void this.retryMembership(track, ids, original));
      return 'done';
    }
    this.dialogs.changed();
    const added = result.value.added[0];
    if (added) {
      this.toasts.showCard({
        tone: 'success',
        title: `Added to ${added.name}`,
        text: `“${track.title}” is now track ${added.position}.`,
        action: { label: 'Undo', run: () => void this.undo(track.id, original) },
      });
    } else if (result.value.removed.length) {
      this.toasts.show(`Removed “${track.title}” from ${this.names(result.value.removed)}`, { track });
    }
    return 'done';
  }

  private async retryMembership(track: PlaylistTrack, ids: string[], original: string[]): Promise<void> {
    const result = await this.api.setMembership(track.id, ids);
    if (!result.ok) {
      this.retryToast(() => void this.retryMembership(track, ids, original));
      return;
    }
    this.dialogs.changed();
    const added = result.value.added[0];
    if (added) {
      this.toasts.showCard({
        tone: 'success',
        title: `Added to ${added.name}`,
        text: `“${track.title}” is now track ${added.position}.`,
        action: { label: 'Undo', run: () => void this.undo(track.id, original) },
      });
    }
  }

  private async undo(trackId: string, original: string[]): Promise<void> {
    const result = await this.api.setMembership(trackId, original);
    if (result.ok) this.dialogs.changed();
  }

  /** Several tracks: appended to each checked playlist; one track already there asks first (AC6). */
  private async appendTo(ids: string[]): Promise<'done' | 'failed'> {
    for (const id of ids) {
      const outcome = await this.appendOne(id, false);
      if (outcome !== 'done') return outcome;
    }
    return 'done';
  }

  private async appendOne(playlistId: string, allowDuplicates: boolean): Promise<'done' | 'failed'> {
    const tracks = this.tracks();
    const name = this.choices()?.find((c) => c.id === playlistId)?.name ?? '';
    const result = await this.api.addTracks(
      playlistId,
      tracks.map((t) => t.id),
      allowDuplicates,
    );
    if (result.ok) {
      this.dialogs.changed();
      this.toasts.showCard({
        tone: 'success',
        title: `Added to ${result.value.name}`,
        text:
          tracks.length === 1
            ? `“${tracks[0].title}” is now track ${result.value.position}.`
            : `${tracks.length} tracks added.`,
      });
      return 'done';
    }
    if (result.problem.status === 409) {
      this.toasts.showCard({
        tone: 'warning',
        title: 'Already in this playlist',
        text: `“${tracks[0].title}” is in ${name}. Add it again?`,
        action: { label: 'Add again', run: () => void this.appendOne(playlistId, true) },
      });
      return 'done';
    }
    if (result.problem.status === 0) {
      this.retryToast(() => void this.appendOne(playlistId, allowDuplicates));
      return 'done';
    }
    return 'failed';
  }

  /** The connection dropped (AC7): nothing was added; Retry sends the same change again. */
  private retryToast(retry: () => void): void {
    this.toasts.showDanger('Couldn’t add the track', ADDED_FAILED, { label: 'Retry', run: retry });
  }

  private names(ids: string[]): string {
    const names = ids.map((id) => this.choices()?.find((c) => c.id === id)?.name).filter(Boolean);
    return names.length === 1 ? names[0]! : `${ids.length} playlists`;
  }
}
