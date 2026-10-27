import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  input,
  output,
  viewChild,
} from '@angular/core';

import { IconComponent } from '../icon/icon';
import { TrackItem, formatDuration } from '../track/track-item';

/**
 * The queue drawer (L2-016): a non-modal panel at the top right, without a backdrop, headed "Queue"
 * with "Close queue"; the "Now playing" card, "Up next · {n}" with Clear and a remove button per row,
 * the empty hint, and a dimmed "Then, more {genre}" list with durations. Close takes focus on open;
 * Close and Escape emit dismiss. The drawer only renders; the host owns the queue.
 */
@Component({
  selector: 'hm-queue-drawer',
  imports: [NgTemplateOutlet, IconComponent],
  template: `
    <aside class="drawer-queue" aria-label="Queue">
      <div class="drawer-queue__head">
        <h2>Queue</h2>
        <button #close class="ibtn" type="button" aria-label="Close queue" (click)="dismiss.emit()">
          <hm-icon name="close" />
        </button>
      </div>
      <div class="drawer-queue__body">
        @if (current(); as now) {
          <div class="q-label"><span>Now playing</span></div>
          <div class="q-row q-row--now">
            <ng-container *ngTemplateOutlet="cover; context: { $implicit: now }" />
            <div class="srow__text">
              <div class="srow__title">
                @if (playing()) {
                  <span class="eq eq--live" role="img" aria-label="Playing"
                    ><span></span><span></span><span></span
                  ></span>
                }
                <span>{{ now.title }}</span>
              </div>
              <div class="srow__sub">{{ now.artistName }}</div>
            </div>
          </div>
        }
        <div class="q-label">
          <span>Up next{{ upNext().length ? ' · ' + upNext().length : '' }}</span>
          @if (upNext().length) {
            <button type="button" (click)="clear.emit()">Clear</button>
          }
        </div>
        @for (item of upNext(); track $index; let i = $index) {
          <div class="q-row">
            <ng-container *ngTemplateOutlet="cover; context: { $implicit: item }" />
            <div class="srow__text">
              <div class="srow__title">
                <span>{{ item.title }}</span>
              </div>
              <div class="srow__sub">{{ item.artistName }}</div>
            </div>
            <button
              class="ibtn"
              type="button"
              [attr.aria-label]="'Remove ' + item.title + ' from the queue'"
              (click)="remove.emit(i)"
            >
              <hm-icon name="close" />
            </button>
          </div>
        } @empty {
          <p class="q-empty">Use Play next or Add to queue on any track to line it up here.</p>
        }
        @if (more().length && genreName()) {
          <div class="q-label">
            <span>Then, more {{ genreName() }}</span>
          </div>
          @for (item of more(); track item.id) {
            <div class="q-row q-row--more">
              <ng-container *ngTemplateOutlet="cover; context: { $implicit: item }" />
              <div class="srow__text">
                <div class="srow__title">
                  <span>{{ item.title }}</span>
                </div>
                <div class="srow__sub">{{ item.artistName }}</div>
              </div>
              <span class="srow__dur">{{ format(item.durationSeconds) }}</span>
            </div>
          }
        }
      </div>
    </aside>
    <ng-template #cover let-track>
      <div class="cover cover--c1 cover--sm" [class.cover--art]="!!track.coverUrl" aria-hidden="true">
        @if (track.coverUrl) {
          <img [src]="track.coverUrl" alt="" loading="lazy" />
        }
        <hm-icon name="music" />
      </div>
    </ng-template>
  `,
  host: { '(keydown.escape)': 'dismiss.emit()' },
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueueDrawerComponent {
  readonly current = input<TrackItem | null>(null);
  readonly playing = input(false);
  readonly upNext = input<readonly TrackItem[]>([]);
  /** The genre of the current track, naming "Then, more {genre}". */
  readonly genreName = input<string | null>(null);
  /** Up to four more tracks of the genre, shown dimmed. */
  readonly more = input<readonly TrackItem[]>([]);
  readonly dismiss = output<void>();
  readonly clear = output<void>();
  /** Index into upNext of the row to remove. */
  readonly remove = output<number>();

  private readonly closeButton = viewChild.required<ElementRef<HTMLButtonElement>>('close');
  protected readonly format = formatDuration;

  constructor() {
    afterNextRender(() => this.closeButton().nativeElement.focus());
  }
}
