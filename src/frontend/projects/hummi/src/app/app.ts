import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SkipLinkComponent } from '@hummi/components';

import { AppShellComponent } from './app-shell/app-shell';

/** Root component: skip link and the app shell. */
@Component({
  selector: 'hm-root',
  imports: [SkipLinkComponent, AppShellComponent],
  template: '<hm-skip-link /><hm-app-shell />',
  styles: ':host { display: block; min-height: 100dvh; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
