import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EqualizerComponent } from '../equalizer/equalizer';
import { IconComponent } from '../icon/icon';
import { TrackItem, formatDuration } from '../track/track-item';

/**
 * One row of a track list: position (the equaliser when current), cover, title linking to the
 * track page, "{artist} · {duration}", the like button and More actions. The position cell is a
 * "Play {title}" button; title and meta truncate with an ellipsis.
 */
@Component({
  selector: 'hm-track-row',
  imports: [RouterLink, EqualizerComponent, IconComponent],
  template: `
    <li class="track" [attr.aria-current]="current() ? 'true' : null">
      <button
        class="track__num track__play"
        type="button"
        [attr.aria-label]="'Play ' + track().title"
        (click)="playTrack.emit()"
      >
        @if (current()) {
          <hm-equalizer [live]="playing()" />
        } @else {
          <span aria-hidden="true">{{ position() }}</span>
        }
      </button>
      <div class="cover cover--c1 cover--sm" [class.cover--art]="!!track().coverUrl" aria-hidden="true">
        @if (track().coverUrl; as url) {
          <img [src]="url" alt="" loading="lazy" />
        }
        <hm-icon name="music" />
      </div>
      <div class="track__text">
        <div class="track__title">
          <a [routerLink]="['/tracks', track().slug]">{{ track().title }}</a>
        </div>
        <div class="track__meta">{{ meta() }}</div>
      </div>
      <div class="track__actions">
        <button
          class="btn btn--ghost btn--icon"
          type="button"
          [attr.aria-label]="likeLabel()"
          [attr.aria-pressed]="track().liked"
          (click)="like.emit()"
        >
          <hm-icon name="heart" [fill]="track().liked" />
        </button>
        <button
          class="btn btn--ghost btn--icon"
          type="button"
          aria-haspopup="menu"
          [attr.aria-label]="'More actions for ' + track().title"
          (click)="more.emit()"
        >
          <hm-icon name="more" />
        </button>
      </div>
    </li>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackRowComponent {
  readonly track = input.required<TrackItem>();
  readonly position = input.required<number>();
  /** This row's track is the one loaded in the player. */
  readonly current = input(false);
  /** The loaded track is playing rather than paused. */
  readonly playing = input(false);
  readonly playTrack = output<void>();
  readonly like = output<void>();
  readonly more = output<void>();

  protected readonly meta = computed(
    () => `${this.track().artistName} · ${formatDuration(this.track().durationSeconds)}`,
  );
  protected readonly likeLabel = computed(() =>
    this.track().liked ? `Remove like from ${this.track().title}` : `Like ${this.track().title}`,
  );
}
