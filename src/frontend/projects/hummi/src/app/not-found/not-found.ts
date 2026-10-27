import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective, CenterStateComponent } from '@hummi/components';

/** Shown for any route the app does not know. */
@Component({
  selector: 'hm-not-found',
  imports: [CenterStateComponent, ButtonDirective, RouterLink],
  template: `
    <hm-center-state code="404" heading="Page not found">
      <p>We could not find that page.</p>
      <a actions hmButton="primary" routerLink="/">Back to home</a>
    </hm-center-state>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
