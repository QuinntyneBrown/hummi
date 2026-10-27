import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../icon/icon';

export const DEFAULT_ERROR_TEXT =
  'The server didn’t answer in time. Your music hasn’t gone anywhere; try again in a moment.';

/** A failed load, announced as an alert, with Try again (emits retry) and Go to Home. */
@Component({
  selector: 'hm-error-block',
  imports: [RouterLink, IconComponent],
  template: `
    <div class="empty empty--error" role="alert">
      <div class="empty__icon"><hm-icon name="alert" /></div>
      <h2 class="empty__title">{{ heading() }}</h2>
      <p class="text-muted">{{ text() }}</p>
      <div class="empty__actions">
        <button class="btn btn--primary" type="button" (click)="retry.emit()">
          <hm-icon name="refresh" />Try again
        </button>
        <a class="btn" routerLink="/">Go to Home</a>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorBlockComponent {
  readonly heading = input('We couldn’t load this page');
  readonly text = input(DEFAULT_ERROR_TEXT);
  readonly retry = output<void>();
}
