import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, output, signal } from '@angular/core';
import {
  ApiProblem,
  GenresApi,
  PlayerStore,
  REQUEST_TIMEOUT_MS,
  SearchApi,
  SearchResultsDto,
  SearchStore,
  apiResource,
  toProblem,
} from '@hummi/api';
import {
  ErrorBlockComponent,
  RecentSearchesComponent,
  SearchArtistComponent,
  SearchLayerComponent,
  SearchSongComponent,
  SkeletonComponent,
  SoundTileComponent,
  TopResultComponent,
} from '@hummi/components';
import { Subscription, timeout } from 'rxjs';

import { RecentSearchesStore } from './recent-searches-store';

/** Milliseconds after the last keystroke before the overlay searches. */
export const SEARCH_DEBOUNCE_MS = 250;

type SearchState =
  | { status: 'empty' }
  | { status: 'loading' }
  | { status: 'ready'; results: SearchResultsDto }
  | { status: 'error'; problem: ApiProblem };

/**
 * The search overlay (L2-006, L2-007): hm-search-layer with the Top result, Artists and Songs, skeleton
 * rows while searching, Recent and Browse by sound for an empty query, no results and the error.
 * The shell renders it while SearchStore.open() is true; closed fires on Close and Escape.
 */
@Component({
  selector: 'hm-search-overlay',
  imports: [
    SearchLayerComponent,
    TopResultComponent,
    SearchArtistComponent,
    SearchSongComponent,
    RecentSearchesComponent,
    SoundTileComponent,
    SkeletonComponent,
    ErrorBlockComponent,
  ],
  templateUrl: './search-overlay.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchOverlayComponent {
  private readonly api = inject(SearchApi);
  private readonly store = inject(SearchStore);
  protected readonly recent = inject(RecentSearchesStore);
  protected readonly player = inject(PlayerStore);
  protected readonly genres = apiResource(() => inject(GenresApi).directory());
  /** Close or Escape; the shell closes the layer and returns focus to the header. */
  readonly closed = output<void>();

  protected readonly query = signal(this.store.query());
  protected readonly state = signal<SearchState>({ status: 'empty' });
  protected readonly ready = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.results : null;
  });
  protected readonly rows = [1, 2, 3, 4, 5];
  protected readonly sounds = computed(() => {
    const genres = this.genres.state();
    return genres.status === 'ready' ? genres.value.genres : [];
  });

  private timer: ReturnType<typeof setTimeout> | undefined;
  private request: Subscription | null = null;

  constructor() {
    if (this.query().trim()) this.run();
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
      this.request?.unsubscribe();
    });
  }

  protected typed(query: string): void {
    this.query.set(query);
    clearTimeout(this.timer);
    if (!query.trim()) {
      this.run();
      return;
    }
    this.timer = setTimeout(() => this.run(), SEARCH_DEBOUNCE_MS);
  }

  /** Enter: searches at once and remembers the query. */
  protected submitted(): void {
    clearTimeout(this.timer);
    this.recent.add(this.query());
    this.run();
  }

  protected repeat(query: string): void {
    this.query.set(query);
    this.submitted();
  }

  /** A result was chosen: remembers the query and closes the layer as its link navigates. */
  protected chose(): void {
    this.recent.add(this.query());
    this.store.close();
  }

  /** A Browse by sound tile was chosen: closes the layer as its link navigates. */
  protected choseSound(): void {
    this.store.close();
  }

  protected isCurrent(id: string): boolean {
    return this.player.current()?.id === id;
  }

  protected run(): void {
    this.request?.unsubscribe();
    const text = this.query().trim();
    if (!text) {
      this.state.set({ status: 'empty' });
      return;
    }
    this.state.set({ status: 'loading' });
    this.request = this.api
      .search(text)
      .pipe(timeout(REQUEST_TIMEOUT_MS))
      .subscribe({
        next: (results) => this.state.set({ status: 'ready', results }),
        error: (error: unknown) => this.state.set({ status: 'error', problem: toProblem(error) }),
      });
  }

  protected dismiss(): void {
    this.store.close();
    this.closed.emit();
  }
}
