import { ChangeDetectionStrategy, Component } from '@angular/core';

/** The landing route. */
@Component({
  selector: 'hm-home',
  template: `
    <h1>Hummi</h1>
    <p>A free streaming platform for open-source AI-generated music.</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {}
