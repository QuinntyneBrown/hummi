import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { LogoComponent } from '../logo/logo';

/**
 * The centred card of the sign-in, sign-up and email pages (`.auth-layout`): the Hummi wordmark, a
 * level-1 heading, the projected [intro] line, the projected body and an optional projected [footer]
 * below the card.
 */
@Component({
  selector: 'hm-auth-card',
  imports: [LogoComponent],
  template: `
    <div class="auth-layout">
      <div class="auth-card">
        <div class="logo" role="img" aria-label="Hummi"><hm-logo /></div>
        <div class="card stack">
          <div>
            <h1 style="font: var(--text-h2)">{{ heading() }}</h1>
            <p class="text-muted" style="margin-top: var(--space-1)"><ng-content select="[intro]" /></p>
          </div>
          <ng-content />
        </div>
        <ng-content select="[footer]" />
      </div>
    </div>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCardComponent {
  readonly heading = input.required<string>();
}

/** A progress bar (`.progress`); without a value it is indeterminate. */
@Component({
  selector: 'hm-progress',
  template: `
    <div
      class="progress"
      [class.progress--indeterminate]="value() === null"
      role="progressbar"
      [attr.aria-label]="label()"
      [attr.aria-valuenow]="value()"
      [attr.aria-valuemin]="value() === null ? null : 0"
      [attr.aria-valuemax]="value() === null ? null : 100"
    >
      <div class="progress__bar" [style.width.%]="value()"></div>
    </div>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressComponent {
  readonly label = input.required<string>();
  /** 0 to 100, or null for indeterminate. */
  readonly value = input<number | null>(null);
}
