import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PlayerOverlays, PlayerStore, SignInGate } from '@hummi/api';
import { ButtonDirective, PlayerLayerComponent } from '@hummi/components';

/**
 * Now playing (`/now-playing`, L2-015): hm-player-layer over the page for the current track, or
 * "Nothing is playing" with Browse genres. Close and Escape go back to the page it was opened from (Home
 * when opened directly). Queue closes the layer and opens the queue drawer; More actions opens the track
 * menu. Save asks SignInGate first (L2-032); saving itself and Share come with the library and sharing journeys.
 */
@Component({
  selector: 'hm-now-playing',
  imports: [RouterLink, ButtonDirective, PlayerLayerComponent],
  template: `
    <hm-player-layer
      [track]="player.current()"
      [playing]="player.playing()"
      [position]="player.position()"
      [duration]="player.duration()"
      [shuffle]="player.shuffle()"
      [repeat]="player.repeat()"
      [upNext]="player.upNext()"
      [resumeFrom]="player.resumeFrom()"
      (dismiss)="close()"
      (togglePlay)="player.toggle()"
      (previous)="player.previous()"
      (next)="player.next()"
      (toggleShuffle)="player.toggleShuffle()"
      (toggleRepeat)="player.toggleRepeat()"
      (queue)="openQueue()"
      (more)="openMenu()"
      (save)="gate.allow()"
    >
      <a hmButton="primary" routerLink="/browse">Browse genres</a>
    </hm-player-layer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NowPlayingComponent {
  readonly player = inject(PlayerStore);
  readonly gate = inject(SignInGate);
  private readonly overlays = inject(PlayerOverlays);
  private readonly router = inject(Router);
  /** True when the app navigated here from another of its pages, so Back returns there. */
  private readonly cameFromApp = !!this.router.currentNavigation()?.previousNavigation;

  close(): void {
    if (this.cameFromApp) history.back();
    else void this.router.navigateByUrl('/');
  }

  openQueue(): void {
    this.close();
    this.overlays.openQueue();
  }

  openMenu(): void {
    const track = this.player.current();
    if (track) this.overlays.openTrackMenu(track);
  }
}
