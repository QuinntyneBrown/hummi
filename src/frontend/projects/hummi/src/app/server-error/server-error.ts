import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective, ErrorPageComponent } from '@hummi/components';

/**
 * Server error (L2-046 AC1), shown by ServerErrorHandler in place of a page that could not render. The address
 * stays the page's own, so Try again reloads it.
 */
@Component({
  selector: 'hm-server-error',
  imports: [RouterLink, ButtonDirective, ErrorPageComponent],
  template: `
    <hm-error-page
      code="500"
      icon="alert"
      heading="Something broke on our side"
      text="We’ve been told and we’re fixing it. Nothing you saved is lost; try again in a minute."
    >
      <button hmButton="primary" type="button" (click)="reload()">Try again</button>
      <a hmButton routerLink="/">Go to Home</a>
    </hm-error-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerErrorComponent {
  reload(): void {
    location.reload();
  }
}
