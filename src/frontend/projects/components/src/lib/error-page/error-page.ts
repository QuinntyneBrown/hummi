import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { IconComponent, IconName } from '../icon/icon';

/**
 * A whole-page error such as 404: icon, code as an overline, the page's h1, text and a projected
 * actions row (L2-044).
 */
@Component({
  selector: 'hm-error-page',
  imports: [IconComponent],
  template: `
    <div class="empty">
      <div class="empty__icon"><hm-icon [name]="icon()" /></div>
      <p class="overline">{{ code() }}</p>
      <h1 class="empty__title" style="font: var(--text-h2)">{{ heading() }}</h1>
      <p class="text-muted">{{ text() }}</p>
      <div class="empty__actions"><ng-content /></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorPageComponent {
  readonly code = input.required<string>();
  readonly heading = input.required<string>();
  readonly text = input('');
  readonly icon = input<IconName>('search');
}

/** The Not found page's copy (L2-044), shared by the unknown route and every missing catalogue item. */
export const NOT_FOUND = {
  code: '404',
  heading: 'We couldn’t find that page',
  text: 'The link may be old or mistyped. The track or playlist might also have been removed by its owner.',
} as const;
