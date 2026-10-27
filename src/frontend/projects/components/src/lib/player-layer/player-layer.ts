import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';

import { AlertComponent } from '../alert/alert';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { IconComponent } from '../icon/icon';
import { ScrubberComponent } from '../scrubber/scrubber';
import { TrackItem, formatDuration } from '../track/track-item';

/**
 * The full-screen Now playing layer (L2-015): "Close" and "Playing from {genre}", the large cover, title
 * and artist, the full scrubber, Shuffle / Previous track / Play or Pause / Next track / Repeat with the
 * two modes as aria-pressed toggles, Save, Share, Queue and More actions, and "Up next". resumeFrom shows
 * the lost-connection alert. Without a track it shows "Nothing is playing" with the projected actions.
 * Close takes focus on open; Close and Escape emit dismiss. The layer only renders; the host wires it.
 */
@Component({
  selector: 'hm-player-layer',
  imports: [AlertComponent, EmptyStateComponent, IconComponent, ScrubberComponent],
  template: `
    <div
      class="layer-player"
      role="dialog"
      aria-modal="true"
      aria-label="Now playing"
      (keydown.escape)="dismiss.emit()"
    >
      <div class="layer-player__top">
        <button #close class="pill-btn" type="button" (click)="dismiss.emit()">
          <span style="display: inline-flex; rotate: 90deg"><hm-icon name="chev" /></span>Close
        </button>
        @if (track()?.genreName; as genre) {
          <span class="layer-player__from"
            >Playing from <b>{{ genre }}</b></span
          >
        }
        <span style="width: 5.75rem"></span>
      </div>
      @if (track(); as t) {
        @if (resumeFrom() !== null) {
          <div class="layer-player__body" style="padding-block: 0">
            <hm-alert tone="danger" heading="Playback stopped">
              <div>
                We lost the connection while streaming {{ t.title }}. We’ll resume from {{ resumeAt() }} once you’re
                back online.
              </div>
            </hm-alert>
          </div>
        }
        <div class="layer-player__body">
          <div class="layer-player__art">
            <div class="cover cover--c1" [class.cover--art]="!!t.coverUrl" aria-hidden="true">
              @if (t.coverUrl; as url) {
                <img [src]="url" alt="" />
              }
              <hm-icon name="music" />
            </div>
          </div>
          <div>
            <h2 class="layer-player__title">{{ t.title }}</h2>
            <p class="layer-player__artist">{{ t.artistName }}</p>
            <div class="layer-player__scrub">
              <hm-scrubber [position]="position()" [duration]="duration() || t.durationSeconds" [full]="true" />
            </div>
            <div class="layer-player__ctrl">
              <button
                class="ibtn ibtn--lg"
                type="button"
                aria-label="Shuffle"
                [attr.aria-pressed]="shuffle()"
                (click)="toggleShuffle.emit()"
              >
                <hm-icon name="shuffle" />
              </button>
              <div class="mid">
                <button class="ibtn ibtn--lg" type="button" aria-label="Previous track" (click)="previous.emit()">
                  <hm-icon name="skip" [fill]="true" />
                </button>
                <button
                  class="ibtn ibtn--hero"
                  type="button"
                  [attr.aria-label]="playing() ? 'Pause' : 'Play'"
                  (click)="togglePlay.emit()"
                >
                  <hm-icon [name]="playing() ? 'pause' : 'play'" [fill]="true" />
                </button>
                <button
                  class="ibtn ibtn--lg"
                  style="rotate: 180deg"
                  type="button"
                  aria-label="Next track"
                  (click)="next.emit()"
                >
                  <hm-icon name="skip" [fill]="true" />
                </button>
              </div>
              <button
                class="ibtn ibtn--lg"
                type="button"
                aria-label="Repeat"
                [attr.aria-pressed]="repeat()"
                (click)="toggleRepeat.emit()"
              >
                <hm-icon name="repeat" />
              </button>
            </div>
            <div class="layer-player__acts">
              <button class="pill-btn pill-btn--lg" type="button" [attr.aria-pressed]="t.liked" (click)="save.emit()">
                <hm-icon name="heart" [fill]="t.liked" />{{ t.liked ? 'Saved' : 'Save' }}
              </button>
              <button class="pill-btn pill-btn--lg" type="button" (click)="share.emit()">
                <hm-icon name="share" />Share
              </button>
              <button class="pill-btn pill-btn--lg" type="button" (click)="queue.emit()">
                <hm-icon name="queue" />Queue
              </button>
              <button
                class="ibtn ibtn--lg"
                style="background: color-mix(in srgb, var(--color-fg-default) 8%, transparent)"
                type="button"
                aria-haspopup="menu"
                [attr.aria-label]="'More actions for ' + t.title"
                (click)="more.emit()"
              >
                <hm-icon name="more" />
              </button>
            </div>
            @if (firstTwo().length) {
              <section class="upnext" aria-label="Up next">
                <h3 class="layer-h">Up next</h3>
                @for (item of firstTwo(); track $index) {
                  <div class="srow">
                    <div class="cover cover--c1 cover--sm" [class.cover--art]="!!item.coverUrl" aria-hidden="true">
                      @if (item.coverUrl; as url) {
                        <img [src]="url" alt="" loading="lazy" />
                      }
                      <hm-icon name="music" />
                    </div>
                    <div class="srow__text">
                      <div class="srow__title">
                        <span>{{ item.title }}</span>
                      </div>
                      <div class="srow__sub">{{ item.artistName }}</div>
                    </div>
                    <span class="srow__dur">{{ format(item.durationSeconds) }}</span>
                  </div>
                }
              </section>
            }
          </div>
        </div>
      } @else {
        <div class="layer-player__body">
          <hm-empty-state
            icon="music"
            heading="Nothing is playing"
            text="Press play on any track and it shows up here with the waveform and queue."
          >
            <ng-content />
          </hm-empty-state>
        </div>
      }
    </div>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerLayerComponent {
  readonly track = input<TrackItem | null>(null);
  readonly playing = input(false);
  /** Elapsed seconds. */
  readonly position = input(0);
  /** Total seconds; falls back to the track's duration until the audio reports it. */
  readonly duration = input<number | null>(null);
  readonly shuffle = input(false);
  readonly repeat = input(false);
  /** The next queued tracks; the layer lists the first two. */
  readonly upNext = input<readonly TrackItem[]>([]);
  /** Seconds playback resumes from once the connection returns; null while streaming normally. */
  readonly resumeFrom = input<number | null>(null);
  readonly dismiss = output<void>();
  readonly togglePlay = output<void>();
  readonly previous = output<void>();
  readonly next = output<void>();
  readonly toggleShuffle = output<void>();
  readonly toggleRepeat = output<void>();
  readonly save = output<void>();
  readonly share = output<void>();
  readonly queue = output<void>();
  readonly more = output<void>();

  private readonly closeButton = viewChild.required<ElementRef<HTMLButtonElement>>('close');
  protected readonly firstTwo = computed(() => this.upNext().slice(0, 2));
  protected readonly resumeAt = computed(() => formatDuration(this.resumeFrom() ?? 0));
  protected readonly format = formatDuration;

  constructor() {
    afterNextRender(() => this.closeButton().nativeElement.focus());
  }
}
