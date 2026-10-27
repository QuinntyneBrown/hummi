import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { PlayerStore, SearchStore, SessionStore } from '@hummi/api';
import { NavLink, PlayerBarComponent, SearchPillComponent, TopNavComponent } from '@hummi/components';
import { SearchOverlayComponent } from '@hummi/search';
import { filter } from 'rxjs';

/**
 * App shell: the header with primary navigation and account controls, main#main with the router outlet
 * and the footer, and the player bar once a track is loaded, except on routes with data.hidePlayer.
 * The header search pill, or "/" while no text field is focused, opens the search layer (L2-006).
 */
@Component({
  selector: 'hm-app-shell',
  imports: [RouterOutlet, RouterLink, TopNavComponent, PlayerBarComponent, SearchPillComponent, SearchOverlayComponent],
  host: {
    '[class.has-player]': 'showPlayer() && !!player.current()',
    '(document:keydown)': 'shortcut($event)',
  },
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
  readonly search = inject(SearchStore);
  private readonly searchPill = viewChild.required(SearchPillComponent);
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

  /** "/" opens search unless the listener is typing in a field (L2-017). */
  shortcut(event: KeyboardEvent): void {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey || isTextField(event.target)) return;
    if (this.search.open()) return;
    event.preventDefault();
    this.search.openWith();
  }

  /** Close or Escape in the search layer: focus goes back to the header search field. */
  searchClosed(): void {
    this.searchPill().focus();
  }
}

/** True when the deepest active route, or any route above it, sets data.hidePlayer. */
function hidesPlayer(route: ActivatedRouteSnapshot): boolean {
  return route.data['hidePlayer'] === true || route.children.some(hidesPlayer);
}

function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}
