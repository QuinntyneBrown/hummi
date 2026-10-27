import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective, ErrorPageComponent, NOT_FOUND } from '@hummi/components';

/** Shown for any route the app does not know (L2-044). */
@Component({
  selector: 'hm-not-found',
  imports: [ButtonDirective, ErrorPageComponent, RouterLink],
  template: `
    <hm-error-page [code]="copy.code" [heading]="copy.heading" [text]="copy.text">
      <a hmButton="primary" routerLink="/">Go to Home</a>
      <a hmButton routerLink="/search">Search Hummi</a>
    </hm-error-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {
  protected readonly copy = NOT_FOUND;
}
