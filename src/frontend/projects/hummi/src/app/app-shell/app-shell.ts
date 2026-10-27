import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { PlayerStore, SessionStore } from '@hummi/api';
import { NavLink, PlayerBarComponent, TopNavComponent } from '@hummi/components';
import { filter } from 'rxjs';

/**
 * App shell: the header with primary navigation and account controls, main#main with the router outlet
 * and the footer, and the player bar once a track is loaded, except on routes with data.hidePlayer.
 */
@Component({
  selector: 'hm-app-shell',
  imports: [RouterOutlet, RouterLink, TopNavComponent, PlayerBarComponent],
  host: { '[class.has-player]': 'showPlayer() && !!player.current()' },
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
  readonly player = inject(PlayerStore);
  private readonly hidePlayer = signal(false);
  readonly showPlayer = computed(() => !this.hidePlayer());

  constructor() {
    void this.session.load();
    const router = inject(Router);
    const subscription = router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.navOpen.set(false);
      this.hidePlayer.set(hidesPlayer(router.routerState.snapshot.root));
    });
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  toggleNav(): void {
    this.navOpen.update((open) => !open);
  }
}

/** True when the deepest active route, or any route above it, sets data.hidePlayer. */
function hidesPlayer(route: ActivatedRouteSnapshot): boolean {
  return route.data['hidePlayer'] === true || route.children.some(hidesPlayer);
}
