import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  Signal,
  computed,
  effect,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ApiResource,
  LibraryApi,
  LibraryDto,
  LibraryStore,
  PlayerOverlays,
  PlayerStore,
  SessionStore,
  SignInGate,
  apiResource,
} from '@hummi/api';
import {
  ButtonDirective,
  EmptyStateComponent,
  ErrorBlockComponent,
  IconComponent,
  MediaTileComponent,
  PageHeaderComponent,
  SkeletonComponent,
  TabsComponent,
  TrackListComponent,
} from '@hummi/components';
import { tap } from 'rxjs';

const TABS = ['Playlists', 'Liked', 'Following'] as const;

/**
 * Library (`/library`, L2-019): the counts, New playlist and the Playlists, Liked and Following tabs. It
 * reads GET /api/me/library on every visit, so a change made on another device shows here (AC5). A
 * visitor sees Sign in to see your library; nothing is requested for them. New playlist and Create a
 * playlist ask SignInGate until journey 10 opens the New playlist dialog.
 */
@Component({
  selector: 'hm-library',
  imports: [
    RouterLink,
    ButtonDirective,
    EmptyStateComponent,
    ErrorBlockComponent,
    IconComponent,
    MediaTileComponent,
    PageHeaderComponent,
    SkeletonComponent,
    TabsComponent,
    TrackListComponent,
  ],
  templateUrl: './library.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryComponent {
  private readonly api = inject(LibraryApi);
  readonly session = inject(SessionStore);
  readonly library = inject(LibraryStore);
  readonly player = inject(PlayerStore);
  readonly overlays = inject(PlayerOverlays);
  readonly gate = inject(SignInGate);
  readonly tabs = TABS;
  readonly tab = signal<string>('Playlists');
  readonly tiles = [1, 2, 3, 4, 5, 6];
  private readonly resource = signal<ApiResource<LibraryDto> | null>(null);
  /** Loading until the session is known and, when signed in, the library has answered. */
  readonly state: Signal<'loading' | 'signed-out' | 'error' | 'empty' | 'ready'> = computed(() => {
    if (!this.session.ready()) return 'loading';
    if (!this.session.signedIn()) return 'signed-out';
    const state = this.resource()?.state();
    if (!state || state.status === 'loading') return 'loading';
    if (state.status === 'error') return 'error';
    const v = state.value;
    return v.playlistCount + v.likedCount + v.followingCount === 0 ? 'empty' : 'ready';
  });
  readonly value = computed(() => {
    const state = this.resource()?.state();
    return state?.status === 'ready' ? state.value : null;
  });
  readonly subtitle = computed(() => {
    const v = this.value();
    if (!v) return '';
    return [
      count(v.playlistCount, 'playlist', 'playlists'),
      count(v.likedCount, 'liked track', 'liked tracks'),
      count(v.followingCount, 'artist', 'artists'),
    ].join(' · ');
  });

  constructor() {
    const injector = inject(Injector);
    effect(() => {
      if (this.session.signedIn() && !this.resource()) {
        const load = () => this.api.library().pipe(tap((v) => this.library.apply(v)));
        this.resource.set(runInInjectionContext(injector, () => apiResource(load)));
      }
    });
  }

  reload(): void {
    this.resource()?.reload();
  }
}

function count(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}
