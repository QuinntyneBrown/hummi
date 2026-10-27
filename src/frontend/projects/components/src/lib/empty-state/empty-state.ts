import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { IconComponent, IconName } from '../icon/icon';

/** Nothing to show yet: icon, heading, text and a projected actions row. */
@Component({
  selector: 'hm-empty-state',
  imports: [IconComponent],
  template: `
    <div class="empty">
      <div class="empty__icon"><hm-icon [name]="icon()" /></div>
      <h2 class="empty__title">{{ heading() }}</h2>
      <p class="text-muted">{{ text() }}</p>
      <div class="empty__actions"><ng-content /></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly icon = input<IconName>('music');
  readonly heading = input.required<string>();
  readonly text = input('');
}
