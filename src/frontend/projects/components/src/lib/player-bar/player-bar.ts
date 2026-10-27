import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { EqualizerComponent } from '../equalizer/equalizer';
import { IconComponent } from '../icon/icon';
import { TrackItem, formatDuration } from '../track/track-item';

/**
 * The persistent "Player" region at the bottom of the shell: cover, title and artist (opening Now
 * playing), like and More actions, Previous track / Play or Pause / Next track, the Track position
 * scrubber with elapsed and total time, and Share, Queue, Volume and Expand. stalled replaces the
 * artist with the lost-connection message. The bar only renders; the host wires it to the player.
 */
@Component({
  selector: 'hm-player-bar',
  imports: [EqualizerComponent, IconComponent],
  template: `
    <section class="pbar" aria-label="Player">
      <div class="pbar__now">
        <button class="pbar__art" type="button" aria-label="Open Now playing" (click)="expand.emit()">
          <div class="cover cover--c1" [class.cover--art]="!!track().coverUrl" aria-hidden="true">
            @if (track().coverUrl; as url) {
              <img [src]="url" alt="" />
            }
            <hm-icon name="music" />
          </div>
        </button>
        <div class="pbar__text">
          <button class="pbar__title" type="button" (click)="expand.emit()">
            @if (playing() && !stalled()) {
              <hm-equalizer />
            }
            <span>{{ track().title }}</span>
          </button>
          @if (stalled()) {
            <span class="pbar__artist pbar__artist--error">Playback stopped. Check your connection.</span>
          } @else {
            <span class="pbar__artist">{{ track().artistName }}</span>
          }
        </div>
        <button
          class="ibtn"
          type="button"
          [attr.aria-label]="track().liked ? 'Remove like from ' + track().title : 'Like ' + track().title"
          [attr.aria-pressed]="track().liked"
          (click)="like.emit()"
        >
          <hm-icon name="heart" [fill]="track().liked" />
        </button>
        <button class="ibtn" type="button" aria-label="More actions" aria-haspopup="menu" (click)="more.emit()">
          <hm-icon name="more" />
        </button>
      </div>
      <div class="pbar__centre">
        <div class="pbar__ctrl">
          <button class="ibtn" type="button" aria-label="Previous track" (click)="previous.emit()">
            <hm-icon name="skip" [fill]="true" />
          </button>
          <button
            class="ibtn ibtn--play"
            type="button"
            [attr.aria-label]="playing() ? 'Pause' : 'Play'"
            (click)="togglePlay.emit()"
          >
            <hm-icon [name]="playing() ? 'pause' : 'play'" [fill]="true" />
          </button>
          <button class="ibtn pbar__next" type="button" aria-label="Next track" (click)="next.emit()">
            <hm-icon name="skip" [fill]="true" />
          </button>
        </div>
        <div class="scrubber">
          <time>{{ elapsed() }}</time>
          <div
            class="scrubber__track"
            role="progressbar"
            aria-label="Track position"
            aria-valuemin="0"
            aria-valuemax="100"
            [attr.aria-valuenow]="percent()"
            [attr.aria-valuetext]="elapsed() + ' of ' + total()"
          >
            <div class="scrubber__fill" [style.width.%]="percent()"></div>
            <div class="scrubber__thumb" [style.left.%]="percent()"></div>
          </div>
          <time>{{ total() }}</time>
        </div>
      </div>
      <div class="pbar__side">
        <button class="ibtn" type="button" aria-label="Share" (click)="share.emit()"><hm-icon name="share" /></button>
        <button class="ibtn" type="button" aria-label="Queue" (click)="queue.emit()"><hm-icon name="queue" /></button>
        <button class="ibtn" type="button" aria-label="Volume" (click)="volume.emit()">
          <hm-icon name="volume" />
        </button>
        <button class="ibtn" type="button" aria-label="Expand" (click)="expand.emit()">
          <hm-icon name="expand" />
        </button>
      </div>
    </section>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerBarComponent {
  readonly track = input.required<TrackItem>();
  readonly playing = input(false);
  /** The stream stopped because the connection dropped. */
  readonly stalled = input(false);
  /** Elapsed seconds. */
  readonly position = input(0);
  /** Total seconds; falls back to the track's duration until the audio reports it. */
  readonly duration = input<number | null>(null);
  readonly togglePlay = output<void>();
  readonly previous = output<void>();
  readonly next = output<void>();
  readonly like = output<void>();
  readonly more = output<void>();
  readonly share = output<void>();
  readonly queue = output<void>();
  readonly volume = output<void>();
  readonly expand = output<void>();

  private readonly totalSeconds = computed(() => this.duration() || this.track().durationSeconds);
  protected readonly elapsed = computed(() => formatDuration(this.position()));
  protected readonly total = computed(() => formatDuration(this.totalSeconds()));
  protected readonly percent = computed(() =>
    this.totalSeconds() ? Math.min(100, Math.round((this.position() / this.totalSeconds()) * 100)) : 0,
  );
}
