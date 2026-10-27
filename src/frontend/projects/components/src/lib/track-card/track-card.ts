import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EqualizerComponent } from '../equalizer/equalizer';
import { IconComponent } from '../icon/icon';
import { TrackItem, formatDuration } from '../track/track-item';

/** A shelf card: artwork linking to the track, a "Play {title}" button, More actions, title and meta. */
@Component({
  selector: 'hm-track-card',
  imports: [RouterLink, EqualizerComponent, IconComponent],
  template: `
    <div class="card-track" [attr.aria-current]="current() ? 'true' : null">
      <div class="card-track__art">
        <a
          class="card-track__cover"
          [routerLink]="['/tracks', track().slug]"
          [attr.aria-label]="track().title + ', ' + track().artistName"
        >
          <div class="cover cover--c1" [class.cover--art]="!!track().coverUrl" aria-hidden="true">
            @if (track().coverUrl; as url) {
              <img [src]="url" alt="" loading="lazy" />
            }
            <hm-icon name="music" />
          </div>
        </a>
        <button
          class="card-track__play"
          type="button"
          [attr.aria-label]="'Play ' + track().title"
          (click)="playTrack.emit()"
        >
          <hm-icon [name]="current() && playing() ? 'pause' : 'play'" [fill]="true" />
        </button>
        <button
          class="card-track__more"
          type="button"
          aria-haspopup="menu"
          [attr.aria-label]="'More actions for ' + track().title"
          (click)="more.emit()"
        >
          <hm-icon name="more" />
        </button>
      </div>
      <a class="card-track__title" [routerLink]="['/tracks', track().slug]">
        @if (current()) {
          <hm-equalizer [live]="playing()" />
        }
        <span>{{ track().title }}</span>
      </a>
      <span class="card-track__meta">{{ meta() }}</span>
    </div>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackCardComponent {
  readonly track = input.required<TrackItem>();
  readonly current = input(false);
  readonly playing = input(false);
  readonly playTrack = output<void>();
  readonly more = output<void>();

  protected readonly meta = computed(
    () => `${this.track().artistName} · ${formatDuration(this.track().durationSeconds)}`,
  );
}
