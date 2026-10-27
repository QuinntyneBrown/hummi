import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TrackRowComponent } from '../track-row/track-row';
import { TrackItem } from '../track/track-item';

/** An ordered, numbered list of track rows; marks the row whose id is currentTrackId. */
@Component({
  selector: 'hm-track-list',
  imports: [TrackRowComponent],
  template: `
    <ol class="track-list" [attr.aria-label]="label()">
      @for (track of tracks(); track track.id; let i = $index) {
        <hm-track-row
          [track]="track"
          [position]="i + 1"
          [current]="track.id === currentTrackId()"
          [playing]="playing()"
          (playTrack)="playTrack.emit(i)"
          (like)="like.emit(track)"
          (more)="more.emit(track)"
        />
      }
    </ol>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackListComponent {
  readonly tracks = input.required<readonly TrackItem[]>();
  readonly label = input.required<string>();
  readonly currentTrackId = input<string | null>(null);
  readonly playing = input(false);
  /** Emits the index of the row whose play button was activated. */
  readonly playTrack = output<number>();
  readonly like = output<TrackItem>();
  readonly more = output<TrackItem>();
}
