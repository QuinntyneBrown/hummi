import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Indeterminate spinner with a status message read by screen readers. */
@Component({
  selector: 'hm-spinner',
  template: `
    <span class="spinner" aria-hidden="true"></span>
    <span class="visually-hidden" role="status">{{ label() }}</span>
  `,
  styles: `
    .spinner {
      display: inline-block;
      width: 1.5rem;
      height: 1.5rem;
      border: 3px solid var(--color-border);
      border-top-color: var(--color-accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .spinner {
        animation-duration: 3s;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  readonly label = input.required<string>();
}
