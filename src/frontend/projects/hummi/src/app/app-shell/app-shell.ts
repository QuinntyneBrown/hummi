import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  Injector,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import {
  AccountDialogs,
  AuthApi,
  LibraryStore,
  PlayerOverlays,
  PlayerStore,
  PlaylistDialogs,
  SearchStore,
  SessionStore,
  SettingsStore,
  ShareDialogs,
  SignInGate,
  UnreadStore,
} from '@hummi/api';
import { PlaylistDialogHostComponent } from '@hummi/library';
import { ShareDialogHostComponent } from '@hummi/sharing';
import { SignInPromptDialogComponent, SignOutDialogComponent } from '@hummi/accounts';
import {
  AccountMenuComponent,
  AlertComponent,
  ButtonDirective,
  IconComponent,
  NavLink,
  PlayerBarComponent,
  SearchPillComponent,
  ToastRegionComponent,
  ToastService,
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
 * is open the page behind it is inert (L2-047). Signed in, the avatar opens the account menu, whose Sign
 * out opens the Sign out dialog (L2-031, L2-052), and an unconfirmed email shows the banner (L2-028 AC4).
 * It renders the Sign in to save this prompt for SignInGate (L2-032). Routes with data.bare (the auth
 * pages) render without the header, banner and footer.
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
    AccountMenuComponent,
    AlertComponent,
    ButtonDirective,
    IconComponent,
    SignOutDialogComponent,
    SignInPromptDialogComponent,
    PlaylistDialogHostComponent,
    ShareDialogHostComponent,
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
  readonly gate = inject(SignInGate);
  readonly library = inject(LibraryStore);
  private readonly playlistDialogs = inject(PlaylistDialogs);
  private readonly shareDialogs = inject(ShareDialogs);
  /** The playing track with the listener's like (L2-018). */
  readonly currentTrack = computed(() => {
    const track = this.player.current();
    return track && this.library.withLikes([track])[0];
  });
  private readonly auth = inject(AuthApi);
  private readonly toasts = inject(ToastService);
  private readonly injector = inject(Injector);
  readonly accountMenuOpen = signal(false);
  private readonly accountDialogs = inject(AccountDialogs);
  readonly signOutOpen = this.accountDialogs.signOutOpen;
  /** Applies the theme and the Playback settings from the start (L2-034, L2-049). */
  private readonly settings = inject(SettingsStore);
  /** The header bell's unread count (L2-037 AC1). */
  readonly unread = inject(UnreadStore);
  private readonly avatar = viewChild<ElementRef<HTMLElement>>('avatar');
  readonly inert = computed(() =>
    this.shortcuts.dialogOpen() ||
    this.signOutOpen() ||
    this.gate.promptOpen() ||
    !!this.playlistDialogs.open() ||
    !!this.shareDialogs.open()
      ? ''
      : null,
  );
  /** The deepest route sets data.bare: no header, banner or footer. */
  readonly bare = signal(false);
  private readonly searchPill = viewChild.required(SearchPillComponent);
  private readonly hidePlayer = signal(false);
  readonly showPlayer = computed(() => !this.hidePlayer());

  constructor() {
    void this.session.load();
    const router = this.router;
    const subscription = router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.navOpen.set(false);
      this.hidePlayer.set(hidesPlayer(router.routerState.snapshot.root));
      this.bare.set(routeData(router.routerState.snapshot.root, 'bare'));
      this.accountMenuOpen.set(false);
    });
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
    // A failed like or follow becomes the danger toast with Retry (L2-018 AC4).
    effect(() => {
      const problem = this.library.problem();
      if (problem) {
        untracked(() => this.toasts.showDanger(problem.title, problem.text, { label: 'Retry', run: problem.retry }));
      }
    });
  }

  toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  /** Shortcuts stay off while a dialog makes the page inert. */
  shortcut(event: KeyboardEvent): void {
    if (this.signOutOpen() || this.gate.promptOpen() || this.playlistDialogs.open() || this.shareDialogs.open()) return;
    this.shortcuts.handle(event);
  }

  /** Cover, title and Expand open Now playing; the drawer closes, as the layer would cover it. */
  openNowPlaying(): void {
    this.overlays.closeQueue();
    void this.router.navigateByUrl('/now-playing');
  }

  toggleAccountMenu(): void {
    this.accountMenuOpen.update((open) => !open);
  }

  /** Escape or an outside click: the menu closes and focus returns to the avatar. */
  closeAccountMenu(): void {
    this.accountMenuOpen.set(false);
    this.avatar()?.nativeElement.focus();
  }

  openSignOut(): void {
    this.accountMenuOpen.set(false);
    this.accountDialogs.openSignOut();
  }

  /** Cancelled: focus returns to the avatar. Signed out: the header now shows Sign in and Sign up. */
  signOutClosed(reason: 'signed-out' | 'cancelled'): void {
    this.accountDialogs.closeSignOut();
    if (reason === 'cancelled') {
      afterNextRender(() => this.avatar()?.nativeElement.focus(), { injector: this.injector });
    }
  }

  /** The banner's Resend the email (L2-028 AC4). */
  async resendConfirmation(): Promise<void> {
    const result = await this.auth.resendConfirmation();
    this.toasts.show(
      result.ok ? 'We sent a new confirmation link' : 'We couldn’t send the email. Try again in a minute.',
    );
  }

  /** Close or Escape in the search layer: focus goes back to the header search field. */
  searchClosed(): void {
    this.searchPill().focus();
  }
}

/** True when the deepest active route, or any route above it, sets data.hidePlayer. */
function hidesPlayer(route: ActivatedRouteSnapshot): boolean {
  return routeData(route, 'hidePlayer');
}

/** True when the route, or any route below it, sets data[key] to true. */
function routeData(route: ActivatedRouteSnapshot, key: string): boolean {
  return route.data[key] === true || route.children.some((child) => routeData(child, key));
}
