import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GenresApi, apiResource } from '@hummi/api';
import {
  ChipDirective,
  ErrorBlockComponent,
  GenreTileComponent,
  PageHeaderComponent,
  ShelfComponent,
  SkeletonComponent,
} from '@hummi/components';

/** Browse (`/browse`): the Moods shelf of genre chips and the All genres grid (L2-003). It has no empty state. */
@Component({
  selector: 'hm-browse',
  imports: [
    RouterLink,
    ChipDirective,
    ErrorBlockComponent,
    GenreTileComponent,
    PageHeaderComponent,
    ShelfComponent,
    SkeletonComponent,
  ],
  templateUrl: './browse.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrowseComponent {
  private readonly api = inject(GenresApi);
  readonly directory = apiResource(() => this.api.directory());
  /** Placeholder count for the loading layout. */
  readonly tiles = [1, 2, 3, 4, 5, 6];

  subtitle(genres: number, tracks: number): string {
    const count =
      tracks === 0
        ? 'no tracks yet'
        : tracks === 1
          ? '1 freely licensed track'
          : `${tracks.toLocaleString('en-GB')} freely licensed tracks`;
    return `${genres} genres · ${count}`;
  }
}
