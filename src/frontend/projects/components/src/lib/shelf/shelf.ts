import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, input, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../icon/icon';

let nextId = 0;

/**
 * A titled section of a page with an optional note and "See all" link. With rail, the projected cards
 * scroll horizontally inside the shelf, never the page, and Previous and Next page it (L2-001 AC6). busy
 * marks the content region as loading.
 */
@Component({
  selector: 'hm-shelf',
  imports: [NgTemplateOutlet, RouterLink, IconComponent],
  host: { class: 'shelf', role: 'region', '[attr.aria-labelledby]': 'headingId' },
  styles: ':host { display: block; }',
  template: `
    <div class="shelf__head">
      <h2 class="shelf__title" [id]="headingId">{{ heading() }}</h2>
      @if (note()) {
        <span class="shelf__note">{{ note() }}</span>
      }
      @if (moreLink(); as link) {
        <a class="shelf__more" [routerLink]="link">See all</a>
      }
    </div>
    @if (rail()) {
      <div class="shelf__rail">
        <button class="shelf__arrow shelf__arrow--prev" type="button" aria-label="Previous" (click)="page(-1)">
          <hm-icon name="back" />
        </button>
        <button class="shelf__arrow shelf__arrow--next" type="button" aria-label="Next" (click)="page(1)">
          <hm-icon name="chev" />
        </button>
        <div
          #track
          class="shelf__track"
          tabindex="0"
          role="group"
          [attr.aria-label]="regionLabel()"
          [attr.aria-busy]="busy() || null"
        >
          <ng-container [ngTemplateOutlet]="content" />
        </div>
      </div>
    } @else {
      <div [attr.aria-busy]="busy() || null" [attr.aria-label]="busy() ? regionLabel() : null">
        <ng-container [ngTemplateOutlet]="content" />
      </div>
    }
    <ng-template #content><ng-content /></ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShelfComponent {
  readonly heading = input.required<string>();
  readonly note = input('');
  readonly rail = input(false);
  readonly busy = input(false);
  /** Where "See all" goes; none hides it. */
  readonly moreLink = input<string | null>(null);
  private readonly track = viewChild<ElementRef<HTMLElement>>('track');
  protected readonly headingId = `hm-shelf-${++nextId}`;
  /** Scrolls the rail by most of its width, back (-1) or forward (1). */
  protected page(direction: -1 | 1): void {
    const track = this.track()?.nativeElement;
    track?.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: 'smooth' });
  }

  protected readonly regionLabel = computed(() => (this.busy() ? `Loading ${this.heading()}` : this.heading()));
}
