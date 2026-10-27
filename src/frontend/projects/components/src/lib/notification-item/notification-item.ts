import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { IconComponent, IconName } from '../icon/icon';

/**
 * One notification (`.notif`, docs/design-system/components/notification-item.html): the kind's icon, the
 * projected text with its links, the time below it and, while unread, a dot labelled "Unread" (L2-036, L2-037).
 */
@Component({
  selector: 'hm-notification-item',
  imports: [IconComponent],
  host: { class: 'notif', '[attr.data-unread]': 'unread()' },
  template: `
    <hm-icon [name]="icon()" />
    <div style="flex: 1">
      <ng-content />
      <div class="text-caption">{{ time() }}</div>
    </div>
    @if (unread()) {
      <span class="dot" role="img" aria-label="Unread"></span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationItemComponent {
  readonly icon = input<IconName>('info');
  readonly time = input.required<string>();
  readonly unread = input(false);
}
