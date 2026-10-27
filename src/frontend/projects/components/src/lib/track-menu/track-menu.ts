import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { IconComponent } from '../icon/icon';
import { TrackItem, formatDuration } from '../track/track-item';

/** Gap in pixels between the menu and its anchor, and between the menu and the viewport edge. */
const GAP = 8;

/**
 * The track menu (L2-053): a transparent scrim and a "Track actions" menu showing the cover, title and
 * "{artist} · {duration}", then Play next, Add to queue, Save to library (or Remove from library, pressed,
 * when liked), Share, More from {artist} and Go to {genre}. It opens below the anchor, flips above it
 * when there is no room, and always stays inside the viewport. The first item takes focus; ↑ and ↓ move
 * between items; Escape, Tab and the scrim emit dismiss. Choosing an item emits it; the host closes the menu.
 */
@Component({
  selector: 'hm-track-menu',
  imports: [IconComponent],
  template: `
    <div class="menu-scrim" aria-hidden="true"></div>
    <div
      #panel
      class="menu-panel menu-panel--track"
      role="menu"
      aria-label="Track actions"
      [style.top.px]="top()"
      [style.left.px]="left()"
    >
      <div class="menu-head">
        <div class="cover cover--c1 cover--sm" [class.cover--art]="!!track().coverUrl" aria-hidden="true">
          @if (track().coverUrl; as url) {
            <img [src]="url" alt="" />
          }
          <hm-icon name="music" />
        </div>
        <div style="min-width: 0">
          <strong>{{ track().title }}</strong>
          <small>{{ track().artistName }} · {{ duration() }}</small>
        </div>
      </div>
      <button class="mi" role="menuitem" type="button" (click)="playNext.emit()">
        <hm-icon name="list-plus" />Play next
      </button>
      <button class="mi" role="menuitem" type="button" (click)="addToQueue.emit()">
        <hm-icon name="list-end" />Add to queue
      </button>
      <button
        class="mi"
        role="menuitem"
        type="button"
        [attr.aria-pressed]="track().liked ? 'true' : null"
        (click)="save.emit()"
      >
        <hm-icon name="heart" />{{ track().liked ? 'Remove from library' : 'Save to library' }}
      </button>
      <button class="mi" role="menuitem" type="button" (click)="share.emit()"><hm-icon name="share" />Share</button>
      <hr class="menu-divider" />
      <button class="mi" role="menuitem" type="button" (click)="moreFromArtist.emit()">
        <hm-icon name="mic" />More from {{ track().artistName }}
      </button>
      @if (track().genreName; as genre) {
        <button class="mi" role="menuitem" type="button" (click)="goToGenre.emit()">
          <hm-icon name="disc" />Go to {{ genre }}
        </button>
      }
    </div>
  `,
  host: { '(click)': 'scrimClick($event)', '(keydown)': 'keydown($event)' },
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackMenuComponent {
  readonly track = input.required<TrackItem>();
  /** Where the menu was opened from, in viewport pixels; null centres it. */
  readonly anchor = input<DOMRect | null>(null);
  readonly playNext = output<void>();
  readonly addToQueue = output<void>();
  readonly save = output<void>();
  readonly share = output<void>();
  readonly moreFromArtist = output<void>();
  readonly goToGenre = output<void>();
  readonly dismiss = output<void>();

  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  protected readonly top = signal(0);
  protected readonly left = signal(0);

  constructor() {
    afterNextRender(() => {
      this.place();
      this.items()[0]?.focus();
    });
  }

  protected duration(): string {
    return formatDuration(this.track().durationSeconds);
  }

  /** A click on the scrim, outside the panel, dismisses the menu. */
  protected scrimClick(event: MouseEvent): void {
    if (event.target instanceof HTMLElement && event.target.classList.contains('menu-scrim')) this.dismiss.emit();
  }

  protected keydown(event: KeyboardEvent): void {
    const items = this.items();
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      items[(index + step + items.length) % items.length]?.focus();
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault();
      event.stopPropagation();
      this.dismiss.emit();
    }
  }

  private items(): HTMLElement[] {
    return Array.from(this.panel().nativeElement.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  }

  /** Below the anchor and aligned to its right edge, above it when there is no room, inside the viewport. */
  private place(): void {
    const { width, height } = this.panel().nativeElement.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const anchor = this.anchor();
    let top = anchor ? anchor.bottom + GAP : (vh - height) / 2;
    let left = anchor ? anchor.right - width : (vw - width) / 2;
    if (anchor && top + height > vh - GAP) top = anchor.top - height - GAP;
    top = Math.max(GAP, Math.min(top, vh - height - GAP));
    left = Math.max(GAP, Math.min(left, vw - width - GAP));
    this.top.set(Math.round(top));
    this.left.set(Math.round(left));
  }
}
