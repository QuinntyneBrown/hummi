import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A whole-page state centred in main: optional status code, heading, projected text and an actions row. */
@Component({
  selector: 'hm-center-state',
  template: `
    <div class="center-state">
      @if (code(); as code) {
        <span class="code" aria-hidden="true">{{ code }}</span>
      }
      <h1>{{ heading() }}</h1>
      <ng-content />
      <div class="actions"><ng-content select="[actions]" /></div>
    </div>
  `,
  styles: `
    .center-state {
      display: grid;
      justify-items: center;
      gap: var(--space-3);
      padding: var(--space-6) 0;
      text-align: center;
    }
    .code {
      font-size: 4rem;
      font-weight: 700;
      color: var(--color-accent);
    }
    .actions {
      display: flex;
      gap: var(--space-3);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CenterStateComponent {
  /** A status code shown large above the heading, for example "404". */
  readonly code = input<string>();
  readonly heading = input.required<string>();
}
