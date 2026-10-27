import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The page's h1 with an optional subtitle; projected content forms the actions cluster. */
@Component({
  selector: 'hm-page-header',
  host: { class: 'page-header' },
  template: `
    <div>
      <h1>{{ heading() }}</h1>
      @if (subtitle()) {
        <p class="subtitle">{{ subtitle() }}</p>
      }
    </div>
    <div class="cluster"><ng-content /></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly heading = input.required<string>();
  readonly subtitle = input('');
}
