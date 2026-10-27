import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { NgTemplateOutlet } from '@angular/common';

import { IconComponent, IconName } from '../icon/icon';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const ICONS: Record<AlertTone, IconName> = { info: 'info', success: 'ok', warning: 'alert', danger: 'alert' };

/**
 * Inline message: the tone's icon, an optional title and projected text. Danger alerts are announced at
 * once. Elements marked actions sit after the text, as the selection bar's buttons do (L2-023). `banner` renders the page-wide strip above the header (L2-042): "{title}. {text}" on one line.
 */
@Component({
  selector: 'hm-alert',
  imports: [IconComponent, NgTemplateOutlet],
  template: `
    <div
      [class]="'alert alert--' + tone()"
      [class.banner]="banner()"
      [attr.role]="tone() === 'danger' ? 'alert' : 'status'"
    >
      <hm-icon [name]="icon()" />
      <div class="alert__body">
        @if (banner()) {
          <span>
            @if (heading(); as heading) {
              <strong>{{ heading }}.</strong>
            }
            <ng-container [ngTemplateOutlet]="text"
          /></span>
        } @else {
          @if (heading(); as heading) {
            <div class="alert__title">{{ heading }}</div>
          }
          <div><ng-container [ngTemplateOutlet]="text" /></div>
        }
      </div>
      <ng-content select="[actions]" />
    </div>
    <ng-template #text><ng-content /></ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertComponent {
  readonly tone = input<AlertTone>('info');
  readonly heading = input<string>();
  readonly banner = input(false);
  protected readonly icon = computed(() => ICONS[this.tone()]);
}
