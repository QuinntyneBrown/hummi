import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { SessionStore } from '@hummi/api';
import { NavLink, TopNavComponent } from '@hummi/components';
import { filter } from 'rxjs';

/** App shell: the header with primary navigation and account controls, main#main with the router outlet and the footer. */
@Component({
  selector: 'hm-app-shell',
  imports: [RouterOutlet, RouterLink, TopNavComponent],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  readonly session = inject(SessionStore);
  readonly links: readonly NavLink[] = [
    { label: 'Home', path: '/', exact: true },
    { label: 'Soca', path: '/genres/soca' },
    { label: 'Kids', path: '/genres/kids' },
    { label: 'Steelpan', path: '/genres/steelpan' },
    { label: 'Your library', path: '/library' },
  ];
  /** The narrow-viewport navigation is open. */
  readonly navOpen = signal(false);

  constructor() {
    void this.session.load();
    const subscription = inject(Router)
      .events.pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.navOpen.set(false));
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  toggleNav(): void {
    this.navOpen.update((open) => !open);
  }
}
