import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  LibraryStore,
  PlayerOverlays,
  PlayerStore,
  SearchStore,
  ShareDialogs,
  SignInGate,
  TrackMenuState,
} from '@hummi/api';
import { ToastService, TrackMenuComponent } from '@hummi/components';

/**
 * The shell's track menu (L2-053) for PlayerOverlays.trackMenu(): Play next and Add to queue line the
 * track up and confirm with a toast (L2-016, L2-041); More from {artist} opens search for the artist;
 * Go to {genre} opens the genre. Save to library likes the track, or removes the like, with an Undo toast; signed out it asks
 * SignInGate first (L2-018, L2-032). Share opens the Share dialog (L2-025).
 */
@Component({
  selector: 'hm-track-menu-host',
  imports: [TrackMenuComponent],
  template: `
    @if (overlays.trackMenu(); as menu) {
      <hm-track-menu
        [track]="menuTrack() ?? menu.track"
        [anchor]="menu.anchor"
        (playNext)="playNext(menu)"
        (addToQueue)="addToQueue(menu)"
        (save)="save(menu)"
        (share)="share(menu)"
        (moreFromArtist)="moreFrom(menu)"
        (goToGenre)="goToGenre(menu)"
        (dismiss)="overlays.closeTrackMenu()"
      />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackMenuHostComponent {
  readonly overlays = inject(PlayerOverlays);
  private readonly player = inject(PlayerStore);
  private readonly search = inject(SearchStore);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);
  private readonly gate = inject(SignInGate);
  private readonly library = inject(LibraryStore);
  private readonly shares = inject(ShareDialogs);
  readonly menuTrack = computed(() => {
    const menu = this.overlays.trackMenu();
    return menu && this.library.withLikes([menu.track])[0];
  });

  playNext({ track }: TrackMenuState): void {
    this.player.playNext(track);
    this.overlays.closeTrackMenu();
    this.toasts.show(`“${track.title}” will play next`, { track });
  }

  addToQueue({ track }: TrackMenuState): void {
    this.player.addToQueue(track);
    this.overlays.closeTrackMenu();
    this.toasts.show(`Added “${track.title}” to your queue`, { track });
  }

  moreFrom({ track }: TrackMenuState): void {
    this.overlays.closeTrackMenu(false);
    this.search.openWith(track.artistName);
  }

  /** Save to library: signed out, the menu gives way to the Sign in to save this prompt (L2-032). */
  save({ track }: TrackMenuState): void {
    const allowed = this.gate.allow();
    this.overlays.closeTrackMenu(allowed);
    if (!allowed) return;
    const liked = this.library.isLiked(track.id);
    void this.library.toggleLike(track);
    this.toasts.show(liked ? `Removed “${track.title}” from your library` : `Saved “${track.title}” to your library`, {
      track,
      undo: () => void this.library.toggleLike(track),
    });
  }

  share({ track }: TrackMenuState): void {
    this.overlays.closeTrackMenu(false);
    this.shares.share({
      type: 'track',
      id: track.id,
      name: track.title,
      byline: track.artistName,
      coverUrl: track.coverUrl,
      slug: track.slug,
    });
  }

  goToGenre({ track }: TrackMenuState): void {
    this.overlays.closeTrackMenu(false);
    if (track.genreSlug) void this.router.navigate(['/genres', track.genreSlug]);
  }
}
