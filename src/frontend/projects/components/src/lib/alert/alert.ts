import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

/** Inline message with an optional heading and projected text. Danger alerts are announced at once. */
@Component({
  selector: 'hm-alert',
  template: `
    <div [class]="'alert alert--' + tone()" [attr.role]="tone() === 'danger' ? 'alert' : 'status'">
      @if (heading(); as heading) {
        <strong>{{ heading }}</strong>
      }
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertComponent {
  readonly tone = input<AlertTone>('info');
  readonly heading = input<string>();
}
