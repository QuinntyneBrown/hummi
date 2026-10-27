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
import { LICENCE_TERMS } from './licence-terms';

/**
 * The licence and credit page (`/tracks/{slug}/licence`): the track's licence with a ready-made credit
 * line, the table of the three licences and the way back to the track (L2-012). Every track has a
 * licence, so there is no empty state.
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
  readonly rows = Object.values(LICENCE_TERMS).map((term) => [term.name, term.may, term.must]);
  readonly skeletonRows = [1, 2, 3];

  heading(track: TrackDetailDto): string {
    return `${track.title} is ${LICENCE_TERMS[track.licence].short}`;
  }

  /** The terms followed by the credit line “{title} by {artist}, generated with {model}.” */
  credit(track: TrackDetailDto): string {
    const terms = LICENCE_TERMS[track.licence].terms.replace('{artist}', track.artist.name);
    return `${terms} “${track.title} by ${track.artist.name}, generated with ${track.generatedWith}.”`;
  }
}
