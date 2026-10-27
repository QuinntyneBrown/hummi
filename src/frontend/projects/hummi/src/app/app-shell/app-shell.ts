import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { PlayerOverlays, PlayerStore, SearchStore, SessionStore } from '@hummi/api';
import {
  NavLink,
  PlayerBarComponent,
  SearchPillComponent,
  ToastRegionComponent,
  TopNavComponent,
} from '@hummi/components';
import { QueuePanelComponent, TrackMenuHostComponent } from '@hummi/player';
import { SearchOverlayComponent } from '@hummi/search';
import { filter } from 'rxjs';

import { ShortcutsDialogComponent } from '../shortcuts/shortcuts-dialog';
import { ShortcutService } from '../shortcuts/shortcuts';

/**
 * App shell: the header with primary navigation and account controls, main#main with the router outlet
 * and the footer, and the player bar once a track is loaded, except on routes with data.hidePlayer.
 * The header search pill opens the search layer (L2-006). It also hosts the queue drawer, the track menu
 * and the toasts, and passes keydowns to ShortcutService (L2-017); while the Keyboard shortcuts dialog
 * is open the page behind it is inert (L2-047).
 */
@Component({
  selector: 'hm-app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    TopNavComponent,
    PlayerBarComponent,
    SearchPillComponent,
    SearchOverlayComponent,
    QueuePanelComponent,
    TrackMenuHostComponent,
    ToastRegionComponent,
    ShortcutsDialogComponent,
  ],
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
  readonly overlays = inject(PlayerOverlays);
  readonly shortcuts = inject(ShortcutService);
  private readonly router = inject(Router);
  readonly inert = computed(() => (this.shortcuts.dialogOpen() ? '' : null));
  private readonly searchPill = viewChild.required(SearchPillComponent);
  private readonly hidePlayer = signal(false);
  readonly showPlayer = computed(() => !this.hidePlayer());

  constructor() {
    void this.session.load();
    const router = this.router;
    const subscription = router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.navOpen.set(false);
      this.hidePlayer.set(hidesPlayer(router.routerState.snapshot.root));
    });
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  shortcut(event: KeyboardEvent): void {
    this.shortcuts.handle(event);
  }

  /** Cover, title and Expand open Now playing; the drawer closes, as the layer would cover it. */
  openNowPlaying(): void {
    this.overlays.closeQueue();
    void this.router.navigateByUrl('/now-playing');
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
