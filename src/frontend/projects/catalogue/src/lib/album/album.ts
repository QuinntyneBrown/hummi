import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlbumsApi, LibraryStore, PlayerOverlays, PlayerStore, SignInGate } from '@hummi/api';
import {
  ButtonDirective,
  ErrorBlockComponent,
  IconComponent,
  PageHeaderComponent,
  SkeletonComponent,
  TrackListComponent,
} from '@hummi/components';

import { CatalogueNotFoundComponent, isNotFound, slugResource } from '../shared/catalogue-page';

/**
 * An album page (`/albums/{slug}`): Play, Add to playlist and Share, the tracks in album order and the
 * summary line (L2-011). A published album always has a track, so there is no empty state.
 */
@Component({
  selector: 'hm-album',
  imports: [
    RouterLink,
    ButtonDirective,
    CatalogueNotFoundComponent,
    ErrorBlockComponent,
    IconComponent,
    PageHeaderComponent,
    SkeletonComponent,
    TrackListComponent,
  ],
  templateUrl: './album.html',
  styles: '.album-actions { margin-bottom: var(--space-4); } .album-summary { margin-top: var(--space-4); }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumComponent {
  private readonly api = inject(AlbumsApi);
  readonly player = inject(PlayerStore);
  readonly overlays = inject(PlayerOverlays);
  readonly gate = inject(SignInGate);
  readonly library = inject(LibraryStore);
  readonly album = slugResource(
    (slug) => this.api.get(slug),
    (album) => album.title,
  );
  readonly isNotFound = isNotFound;
  readonly rows = [1, 2, 3, 4];
}
