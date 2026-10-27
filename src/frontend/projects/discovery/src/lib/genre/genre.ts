import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GenreTrackSort, GenresApi, PlayerOverlays, PlayerStore, apiResource } from '@hummi/api';
import {
  ButtonDirective,
  ChipDirective,
  EmptyStateComponent,
  ErrorBlockComponent,
  IconComponent,
  PageHeaderComponent,
  SkeletonComponent,
  TrackListComponent,
} from '@hummi/components';
import { map } from 'rxjs';

/**
 * A genre page (`/genres/{slug}`): Play all, Shuffle, the Newest and Most played sort chips and the
 * numbered track list, or the empty state (L2-004). Sorting happens on the server.
 */
@Component({
  selector: 'hm-genre',
  imports: [
    RouterLink,
    ButtonDirective,
    ChipDirective,
    EmptyStateComponent,
    ErrorBlockComponent,
    IconComponent,
    PageHeaderComponent,
    SkeletonComponent,
    TrackListComponent,
  ],
  templateUrl: './genre.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenreComponent {
  private readonly api = inject(GenresApi);
  readonly player = inject(PlayerStore);
  readonly overlays = inject(PlayerOverlays);
  readonly sort = signal<GenreTrackSort>('newest');
  private readonly slug = toSignal(inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('slug') ?? '')), {
    initialValue: '',
  });
  readonly genre = apiResource(() => this.api.tracks(untracked(this.slug), untracked(this.sort)));
  readonly heading = computed(() => {
    const state = this.genre.state();
    return state.status === 'ready' ? state.value.name : 'Genre';
  });
  /** Placeholder count for the loading layout. */
  readonly rows = [1, 2, 3, 4, 5, 6, 7, 8];

  constructor() {
    // apiResource loads once on creation; later slug or sort changes request the page again.
    let first = true;
    effect(() => {
      this.slug();
      this.sort();
      if (first) first = false;
      else untracked(() => this.genre.reload());
    });
  }

  subtitle(trackCount: number, description: string): string {
    return `${trackCount.toLocaleString('en-GB')} ${trackCount === 1 ? 'track' : 'tracks'} · ${description}`;
  }
}
