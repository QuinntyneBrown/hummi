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
  styles: `
    .alert {
      padding: var(--space-3) var(--space-4);
      border: 1px solid var(--color-border);
      border-left-width: 4px;
      border-radius: var(--radius-md);
      background: var(--color-surface);
    }
    .alert--info {
      border-left-color: var(--color-info);
    }
    .alert--success {
      border-left-color: var(--color-success);
    }
    .alert--warning {
      border-left-color: var(--color-warning);
    }
    .alert--danger {
      border-left-color: var(--color-danger);
    }
    strong {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertComponent {
  readonly tone = input<AlertTone>('info');
  readonly heading = input<string>();
}
