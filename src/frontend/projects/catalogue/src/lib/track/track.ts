import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlayerOverlays, PlayerStore, TrackDetailDto, TracksApi } from '@hummi/api';
import {
  AlertComponent,
  ButtonDirective,
  DescriptionItem,
  DescriptionListComponent,
  ErrorBlockComponent,
  HeroComponent,
  IconComponent,
  PageHeaderComponent,
  ShelfComponent,
  SkeletonComponent,
  TrackListComponent,
  WaveformComponent,
  formatDuration,
} from '@hummi/components';

import { CatalogueNotFoundComponent, isNotFound, slugResource } from '../shared/catalogue-page';

/**
 * A track page (`/tracks/{slug}`): header, Play and the track actions, the waveform, the Details list
 * and More from the artist (L2-008). A withdrawn track shows a warning and Similar tracks instead and
 * cannot be played (L2-009); an unknown slug shows Not found. Like, Add to playlist, Share and Report
 * open dialogs that later journeys build.
 */
@Component({
  selector: 'hm-track',
  imports: [
    RouterLink,
    AlertComponent,
    ButtonDirective,
    CatalogueNotFoundComponent,
    DescriptionListComponent,
    ErrorBlockComponent,
    HeroComponent,
    IconComponent,
    PageHeaderComponent,
    ShelfComponent,
    SkeletonComponent,
    TrackListComponent,
    WaveformComponent,
  ],
  templateUrl: './track.html',
  styles: '.section-title { font: var(--text-h3); margin-bottom: var(--space-3); }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackComponent {
  private readonly api = inject(TracksApi);
  readonly player = inject(PlayerStore);
  readonly overlays = inject(PlayerOverlays);
  readonly track = slugResource(
    (slug) => this.api.get(slug),
    (track) => track.title,
  );
  readonly notFound = computed(() => isNotFound(this.track.state()));
  readonly rows = [1, 2, 3];

  /** How much of this track the player has played, 0 to 1; 0 while another track is loaded. */
  readonly played = computed(() => {
    const state = this.track.state();
    const current = this.player.current();
    if (state.status !== 'ready' || current?.id !== state.value.id) return 0;
    const duration = this.player.duration() ?? state.value.durationSeconds;
    return duration > 0 ? this.player.position() / duration : 0;
  });

  overline(track: TrackDetailDto): string {
    return `Track · ${formatDuration(track.durationSeconds)}`;
  }

  details(track: TrackDetailDto): DescriptionItem[] {
    return [
      { term: 'Artist', value: track.artist.name, link: `/artists/${track.artist.slug}` },
      ...(track.album ? [{ term: 'Album', value: track.album.title, link: `/albums/${track.album.slug}` }] : []),
      ...(track.genre ? [{ term: 'Genre', value: track.genre }] : []),
      { term: 'Generated with', value: `${track.generatedWith} (open weights)` },
      { term: 'Licence', value: track.licenceLabel, link: `/tracks/${track.slug}/licence` },
      { term: 'Plays', value: track.plays.toLocaleString('en-GB') },
    ];
  }

  play(track: TrackDetailDto): void {
    this.player.playFrom([{ ...track, artistName: track.artist.name }], 0);
  }
}
