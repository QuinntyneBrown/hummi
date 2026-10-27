import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LibraryStore, PlayerOverlays, PlayerStore, SAVED_TRACK_LIMIT, SavedAudioCache } from '@hummi/api';
import { ButtonDirective, EmptyStateComponent, PageHeaderComponent, TrackListComponent } from '@hummi/components';

/**
 * Saved on this device (`/saved`, L2-043 AC2): the recently played tracks whose audio is kept here, which
 * play without a connection. Opened from the Offline page's Open saved tracks.
 */
@Component({
  selector: 'hm-saved-tracks',
  imports: [RouterLink, ButtonDirective, EmptyStateComponent, PageHeaderComponent, TrackListComponent],
  template: `
    <hm-page-header heading="Saved on this device" [subtitle]="subtitle()" />
    @if (saved.tracks().length) {
      <hm-track-list
        [tracks]="library.withLikes(saved.tracks())"
        label="Saved on this device"
        [currentTrackId]="player.current()?.id ?? null"
        [playing]="player.playing()"
        (playTrack)="player.playFrom(saved.tracks(), $event)"
        (like)="library.toggleLike($event)"
        (more)="overlays.openTrackMenu($event)"
      />
    } @else {
      <hm-empty-state
        heading="Nothing saved yet"
        text="Tracks you play are kept on this device so they play offline too."
      >
        <a hmButton="primary" routerLink="/browse">Browse genres</a>
      </hm-empty-state>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedTracksComponent {
  readonly saved = inject(SavedAudioCache);
  readonly player = inject(PlayerStore);
  readonly overlays = inject(PlayerOverlays);
  readonly library = inject(LibraryStore);

  subtitle(): string {
    const n = this.saved.tracks().length;
    return `${n} ${n === 1 ? 'track' : 'tracks'} · the last ${SAVED_TRACK_LIMIT} you played`;
  }
}
