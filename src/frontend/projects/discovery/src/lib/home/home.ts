import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ApiResource,
  ConnectivityService,
  FeaturedAlbumDto,
  HomeApi,
  HomeShelfDto,
  LibraryStore,
  PlayerOverlays,
  PlayerStore,
  SignInGate,
  apiResource,
} from '@hummi/api';
import {
  AlertComponent,
  BillboardComponent,
  ButtonDirective,
  EmptyStateComponent,
  ErrorBlockComponent,
  GenreTileComponent,
  IconComponent,
  ShelfComponent,
  SkeletonComponent,
  ToastService,
  TrackCardComponent,
  TrackListComponent,
  formatLength,
} from '@hummi/components';

/** One shelf of Home in order (L2-001 AC4); list renders a numbered track list instead of cards. */
interface ShelfSpec {
  key: string;
  heading: string;
  note: string;
  more: string;
  list?: boolean;
}

const SHELVES: ShelfSpec[] = [
  { key: 'recently-added', heading: 'Recently added', note: 'Fresh this week', more: '/browse' },
  {
    key: 'top-10',
    heading: 'Top 10 on Hummi this week',
    note: 'Most played across the islands',
    more: '/browse',
    list: true,
  },
  { key: 'soca', heading: 'Soca', note: 'Road march contenders', more: '/genres/soca' },
  { key: 'kids', heading: 'Kids', note: 'Sing-alongs and bedtime songs', more: '/genres/kids' },
  { key: 'steelpan', heading: 'Steelpan & Calypso', note: '', more: '/genres/steelpan' },
  { key: 'dancehall', heading: 'Dancehall', note: '', more: '/genres/dancehall' },
  { key: 'island-chill', heading: 'Island chill', note: 'For slow afternoons', more: '/genres/island-chill' },
];

/** The empty state's "Start with a genre" tiles (L2-002 AC1). */
const STARTER_GENRES = [
  { slug: 'soca', name: 'Soca', tone: 1 },
  { slug: 'kids', name: 'Kids', tone: 2 },
  { slug: 'steelpan', name: 'Steelpan & Calypso', tone: 3 },
  { slug: 'dancehall', name: 'Dancehall', tone: 5 },
  { slug: 'island-chill', name: 'Island chill', tone: 4 },
  { slug: 'parang', name: 'Parang', tone: 6 },
];

/**
 * Home (`/`, L2-001, L2-002): the featured album billboard and seven shelves, each loaded on its own so a
 * failed shelf shows "{name} didn’t load" with Try again while the rest works. A signed-in listener with no
 * plays sees "Your Home fills up as you listen". Offline, the warning banner shows and only the parts saved
 * on this device render (ADR 0015).
 */
@Component({
  selector: 'hm-home',
  imports: [
    RouterLink,
    AlertComponent,
    BillboardComponent,
    ButtonDirective,
    EmptyStateComponent,
    ErrorBlockComponent,
    GenreTileComponent,
    IconComponent,
    ShelfComponent,
    SkeletonComponent,
    TrackCardComponent,
    TrackListComponent,
  ],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly api = inject(HomeApi);
  private readonly toasts = inject(ToastService);
  private readonly gate = inject(SignInGate);
  readonly player = inject(PlayerStore);
  readonly overlays = inject(PlayerOverlays);
  readonly library = inject(LibraryStore);
  readonly online = inject(ConnectivityService).online;
  readonly starters = STARTER_GENRES;
  readonly cards = [1, 2, 3, 4, 5, 6];

  readonly summary = apiResource(() => this.api.summary());
  readonly featured = apiResource(() => this.api.featured());
  readonly shelves: { spec: ShelfSpec; resource: ApiResource<HomeShelfDto> }[] = SHELVES.map((spec) => ({
    spec,
    resource: apiResource(() => this.api.shelf(spec.key)),
  }));

  /** No history yet: the empty state instead of the billboard and shelves. */
  readonly empty = computed(() => {
    const state = this.summary.state();
    return state.status === 'ready' && !state.value.hasHistory;
  });
  /** Every part failed while online: the whole-page error block. */
  readonly failed = computed(
    () =>
      this.online() &&
      this.featured.state().status === 'error' &&
      this.shelves.every((s) => s.resource.state().status === 'error'),
  );
  /**
   * The catalogue has no tracks: nothing is featured and every shelf loaded empty, so Home shows "No music
   * yet" instead of an empty page (L2-002 AC5, ADR 0021).
   */
  readonly noMusic = computed(
    () =>
      this.featured.state().status === 'error' &&
      this.shelves.every((s) => {
        const state = s.resource.state();
        return state.status === 'ready' && state.value.tracks.length === 0;
      }),
  );
  /** The billboard's album is playing. */
  readonly albumPlaying = computed(() => {
    const state = this.featured.state();
    const current = this.player.current();
    return (
      state.status === 'ready' &&
      this.player.playing() &&
      !!current &&
      state.value.tracks.some((t) => t.id === current.id)
    );
  });

  /** Try again on the whole-page error reads every part again. */
  reloadAll(): void {
    this.summary.reload();
    this.featured.reload();
    this.shelves.forEach((s) => s.resource.reload());
  }

  meta(album: FeaturedAlbumDto): string {
    return `${album.trackCount} tracks · ${formatLength(album.durationSeconds)} · Free to stream and share`;
  }

  isNew(shelf: HomeShelfDto, spec: ShelfSpec, id: string): boolean {
    return spec.key !== 'recently-added' && shelf.newTrackIds.includes(id);
  }

  /** Play album plays the lead track; while it plays the button reads Pause (L2-001 AC3). */
  playAlbum(album: FeaturedAlbumDto): void {
    if (
      this.albumPlaying() ||
      (this.player.current() && album.tracks.some((t) => t.id === this.player.current()?.id))
    ) {
      this.player.toggle();
    } else {
      this.player.playFrom(album.tracks, 0);
    }
  }

  /** Add to library likes the album's tracks (ADR 0015); signed out, the sign-in prompt instead. */
  async addAlbum(album: FeaturedAlbumDto): Promise<void> {
    if (!this.gate.allow()) return;
    const saved = await this.library.likeAll(album.tracks);
    if (saved) this.toasts.show(`Added ${album.title} to your library`, { track: album.tracks[0] });
  }
}
