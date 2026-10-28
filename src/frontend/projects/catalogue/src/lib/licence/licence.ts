import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TrackDetailDto, TracksApi } from '@hummi/api';
import {
  AlertComponent,
  ErrorBlockComponent,
  PageHeaderComponent,
  SkeletonComponent,
  TableComponent,
} from '@hummi/components';

import { CatalogueNotFoundComponent, isNotFound, slugResource } from '../shared/catalogue-page';
import { LICENCE_TERMS, TABLE_LICENCES } from './licence-terms';

/**
 * The licence and credit page (`/tracks/{slug}/licence`): the track's licence with a ready-made credit
 * line and, for a Pixabay track, links to the licence and the track's Pixabay page; the table of the
 * catalogue's licences and the way back to the track (L2-012, ADR 0021). Every track has a licence, so
 * there is no empty state.
 */
@Component({
  selector: 'hm-licence',
  imports: [
    RouterLink,
    AlertComponent,
    CatalogueNotFoundComponent,
    ErrorBlockComponent,
    PageHeaderComponent,
    SkeletonComponent,
    TableComponent,
  ],
  templateUrl: './licence.html',
  styles: '.section-title { font: var(--text-h3); margin-bottom: var(--space-3); }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LicenceComponent {
  private readonly api = inject(TracksApi);
  readonly track = slugResource(
    (slug) => this.api.get(slug),
    () => 'Licence and credit',
  );
  readonly isNotFound = isNotFound;
  readonly columns = ['Licence', 'You may', 'You must'];
  readonly rows = TABLE_LICENCES.map((licence) => LICENCE_TERMS[licence]).map((term) => [
    term.name,
    term.may,
    term.must,
  ]);
  readonly terms = LICENCE_TERMS;
  readonly skeletonRows = [1, 2, 3];

  heading(track: TrackDetailDto): string {
    return `${track.title} is ${LICENCE_TERMS[track.licence].short}`;
  }

  /**
   * The terms followed by the credit line: “{title} by {artist}, generated with {model}.” when the model is
   * known, else “{title} by {artist}, from Pixabay.” for a Pixabay track and “{title} by {artist}.” otherwise.
   */
  credit(track: TrackDetailDto): string {
    const terms = LICENCE_TERMS[track.licence].terms.replace('{artist}', track.artist.name);
    const origin = track.generatedWith
      ? `, generated with ${track.generatedWith}`
      : track.licence === 'pixabay'
        ? ', from Pixabay'
        : '';
    return `${terms} “${track.title} by ${track.artist.name}${origin}.”`;
  }
}
