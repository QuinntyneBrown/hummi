import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PlayerOverlays, PlayerStore, SearchStore, TrackMenuState } from '@hummi/api';
import { ToastService, TrackMenuComponent } from '@hummi/components';

/**
 * The shell's track menu (L2-053) for PlayerOverlays.trackMenu(): Play next and Add to queue line the
 * track up and confirm with a toast (L2-016, L2-041); More from {artist} opens search for the artist;
 * Go to {genre} opens the genre. Save to library and Share close the menu until the library and sharing
 * journeys wire them.
 */
@Component({
  selector: 'hm-track-menu-host',
  imports: [TrackMenuComponent],
  template: `
    @if (overlays.trackMenu(); as menu) {
      <hm-track-menu
        [track]="menu.track"
        [anchor]="menu.anchor"
        (playNext)="playNext(menu)"
        (addToQueue)="addToQueue(menu)"
        (save)="overlays.closeTrackMenu()"
        (share)="overlays.closeTrackMenu()"
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

  goToGenre({ track }: TrackMenuState): void {
    this.overlays.closeTrackMenu(false);
    if (track.genreSlug) void this.router.navigate(['/genres', track.genreSlug]);
  }
}
