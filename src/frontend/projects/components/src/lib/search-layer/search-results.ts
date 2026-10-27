import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EqualizerComponent } from '../equalizer/equalizer';
import { IconComponent } from '../icon/icon';
import { TrackItem, formatDuration } from '../track/track-item';

/** The Top result card: cover, title and "{artist} · {duration}", linking to the track page. */
@Component({
  selector: 'hm-top-result',
  imports: [RouterLink, IconComponent],
  template: `
    <a class="top-result" [routerLink]="['/tracks', track().slug]" (click)="choose.emit()">
      <div class="cover cover--c1" [class.cover--art]="!!track().coverUrl" aria-hidden="true">
        @if (track().coverUrl; as url) {
          <img [src]="url" alt="" loading="lazy" />
        }
        <hm-icon name="music" />
      </div>
      <strong>{{ track().title }}</strong
      ><span>{{ meta() }}</span>
    </a>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopResultComponent {
  readonly track = input.required<TrackItem>();
  /** The listener followed the link. */
  readonly choose = output<void>();
  protected readonly meta = computed(
    () => `${this.track().artistName} · ${formatDuration(this.track().durationSeconds)}`,
  );
}

/**
 * One song result: cover, title linking to the track page, artist, duration and "More actions for
 * {title}" (shown on hover or focus). The current track is marked and shows the equaliser.
 */
@Component({
  selector: 'hm-search-song',
  imports: [RouterLink, EqualizerComponent, IconComponent],
  template: `
    <div class="srow" [attr.aria-current]="current() ? 'true' : null">
      <div class="cover cover--c1 cover--sm" [class.cover--art]="!!track().coverUrl" aria-hidden="true">
        @if (track().coverUrl; as url) {
          <img [src]="url" alt="" loading="lazy" />
        }
        <hm-icon name="music" />
      </div>
      <div class="srow__text">
        <a class="srow__title" [routerLink]="['/tracks', track().slug]" (click)="choose.emit()">
          @if (current()) {
            <hm-equalizer [live]="playing()" />
          }
          <span>{{ track().title }}</span>
        </a>
        <div class="srow__sub">{{ track().artistName }}</div>
      </div>
      <span class="srow__dur">{{ duration() }}</span>
      <button
        class="ibtn"
        type="button"
        aria-haspopup="menu"
        [attr.aria-label]="'More actions for ' + track().title"
        (click)="more.emit()"
      >
        <hm-icon name="more" />
      </button>
    </div>
  `,
  styles: ':host { display: contents; } .srow__title { color: inherit; text-decoration: none; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchSongComponent {
  readonly track = input.required<TrackItem>();
  /** This song is the one loaded in the player. */
  readonly current = input(false);
  /** The loaded song is playing rather than paused. */
  readonly playing = input(false);
  /** The listener followed the title link. */
  readonly choose = output<void>();
  readonly more = output<void>();
  protected readonly duration = computed(() => formatDuration(this.track().durationSeconds));
}

/** One artist result: round cover and name, linking to the artist page. */
@Component({
  selector: 'hm-search-artist',
  imports: [RouterLink, IconComponent],
  template: `
    <a class="srow srow--artist" [routerLink]="['/artists', slug()]" (click)="choose.emit()">
      <div class="cover cover--c3 cover--sm" aria-hidden="true"><hm-icon name="music" /></div>
      <div class="srow__text">
        <div class="srow__title">
          <span>{{ name() }}</span>
        </div>
      </div>
      <hm-icon name="arrow-up-right" />
    </a>
  `,
  styles: ':host { display: contents; } a.srow { color: inherit; text-decoration: none; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchArtistComponent {
  readonly slug = input.required<string>();
  readonly name = input.required<string>();
  readonly choose = output<void>();
}

/** The "Recent" list of earlier queries, each with a clock icon; selecting one emits it. */
@Component({
  selector: 'hm-recent-searches',
  imports: [IconComponent],
  template: `
    <section aria-labelledby="hm-recent-heading">
      <h2 class="layer-h" id="hm-recent-heading">Recent</h2>
      <ul class="recent">
        @for (query of queries(); track query) {
          <li>
            <a href="" role="button" (click)="$event.preventDefault(); choose.emit(query)"
              ><hm-icon name="clock" />{{ query }}</a
            >
          </li>
        }
      </ul>
    </section>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentSearchesComponent {
  readonly queries = input.required<readonly string[]>();
  readonly choose = output<string>();
}

/** A "Browse by sound" tile: genre gradient (tone 1 to 6), title and "{n} tracks"; opens /genres/{slug}. */
@Component({
  selector: 'hm-sound-tile',
  imports: [RouterLink, IconComponent],
  template: `
    <a class="sound" [routerLink]="['/genres', slug()]" (click)="choose.emit()">
      <div class="cover cover--c{{ tone() }}" aria-hidden="true"><hm-icon name="music" /></div>
      <span class="sound__cap"
        ><strong>{{ name() }}</strong
        ><small>{{ count() }} tracks</small></span
      >
    </a>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoundTileComponent {
  readonly slug = input.required<string>();
  readonly name = input.required<string>();
  readonly tone = input(1);
  readonly trackCount = input.required<number>();
  /** The listener followed the link. */
  readonly choose = output<void>();
  protected readonly count = computed(() => this.trackCount().toLocaleString('en-US'));
}
