import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AlbumTileDto, ArtistsApi, PlayerStore } from '@hummi/api';
import {
  ButtonDirective,
  EmptyStateComponent,
  ErrorBlockComponent,
  HeroComponent,
  IconComponent,
  MediaTileComponent,
  PageHeaderComponent,
  ShelfComponent,
  SkeletonComponent,
  TrackListComponent,
} from '@hummi/components';

import { CatalogueNotFoundComponent, isNotFound, slugResource } from '../shared/catalogue-page';

/**
 * An artist page (`/artists/{slug}`): monthly listeners, the model, the description, Play, Follow and
 * Share, the Popular list and the Releases shelf, or the empty state before a first release (L2-010).
 * Follow and Share are wired by later journeys.
 */
@Component({
  selector: 'hm-artist',
  imports: [
    ButtonDirective,
    CatalogueNotFoundComponent,
    EmptyStateComponent,
    ErrorBlockComponent,
    HeroComponent,
    IconComponent,
    MediaTileComponent,
    PageHeaderComponent,
    ShelfComponent,
    SkeletonComponent,
    TrackListComponent,
  ],
  templateUrl: './artist.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtistComponent {
  private readonly api = inject(ArtistsApi);
  readonly player = inject(PlayerStore);
  readonly artist = slugResource(
    (slug) => this.api.get(slug),
    (artist) => artist.name,
  );
  readonly isNotFound = isNotFound;
  readonly rows = [1, 2, 3, 4];

  listeners(count: number): string {
    return `${count.toLocaleString('en-GB')} monthly ${count === 1 ? 'listener' : 'listeners'}`;
  }

  releaseMeta(album: AlbumTileDto): string {
    return `${album.year} · ${album.trackCount} ${album.trackCount === 1 ? 'track' : 'tracks'}`;
  }
}
