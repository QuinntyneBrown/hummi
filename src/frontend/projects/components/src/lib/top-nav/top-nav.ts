import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { IconComponent } from '../icon/icon';
import { LogoComponent } from '../logo/logo';

/** One primary navigation link; exact matches only the path itself (use it for Home). */
export interface NavLink {
  label: string;
  path: string;
  exact?: boolean;
}

/**
 * The sticky header: "Open navigation" toggle (narrow viewports only), the brand link, the primary
 * links with the current page marked, and an end slot for search and account controls. Below 64rem
 * the links hide until open is true; the design-system stylesheet does the switching.
 */
@Component({
  selector: 'hm-top-nav',
  imports: [RouterLink, RouterLinkActive, IconComponent, LogoComponent],
  template: `
    <header class="topnav" [class.topnav--solid]="solid()">
      <button
        class="ibtn topnav__menu"
        type="button"
        aria-label="Open navigation"
        aria-controls="hm-primary-nav"
        [attr.aria-expanded]="open()"
        (click)="menuToggle.emit()"
      >
        <hm-icon name="menu" />
      </button>
      <a class="topnav__brand" routerLink="/" aria-label="Hummi home"><hm-logo variant="wordmark" /></a>
      <nav class="topnav__links" id="hm-primary-nav" aria-label="Primary" [attr.data-open]="open()">
        @for (link of links(); track link.path + link.label) {
          <a
            class="topnav__link"
            [routerLink]="link.path"
            routerLinkActive
            ariaCurrentWhenActive="page"
            [routerLinkActiveOptions]="{ exact: !!link.exact }"
            >{{ link.label }}</a
          >
        }
      </nav>
      <div class="topnav__end"><ng-content /></div>
    </header>
  `,
  styles: ':host { display: contents; } .topnav__brand { --logo-height: 1.75rem; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavComponent {
  readonly links = input.required<readonly NavLink[]>();
  /** The narrow-viewport menu is open. */
  readonly open = input(false);
  /** Opaque background, for every page but the top of Home. */
  readonly solid = input(true);
  readonly menuToggle = output<void>();
}
