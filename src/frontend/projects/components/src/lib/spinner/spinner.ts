import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Indeterminate spinner with a status message read by screen readers. */
@Component({
  selector: 'hm-spinner',
  template: `
    <span class="spinner" aria-hidden="true"></span>
    <span class="visually-hidden" role="status">{{ label() }}</span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  readonly label = input.required<string>();
}
