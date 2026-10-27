import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

let nextId = 0;

/**
 * A titled section of a page. With rail, the projected cards scroll horizontally inside the shelf,
 * never the page. busy marks the content region as loading.
 */
@Component({
  selector: 'hm-shelf',
  imports: [NgTemplateOutlet],
  host: { class: 'shelf', role: 'region', '[attr.aria-labelledby]': 'headingId' },
  styles: ':host { display: block; }',
  template: `
    <div class="shelf__head">
      <h2 class="shelf__title" [id]="headingId">{{ heading() }}</h2>
      @if (note()) {
        <span class="shelf__note">{{ note() }}</span>
      }
    </div>
    @if (rail()) {
      <div class="shelf__rail">
        <div
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
  protected readonly headingId = `hm-shelf-${++nextId}`;
  protected readonly regionLabel = computed(() => (this.busy() ? `Loading ${this.heading()}` : this.heading()));
}
