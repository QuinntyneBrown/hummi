import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PlaybackApi, PlayerOverlays, PlayerStore, apiResource } from '@hummi/api';
import {
  ErrorBlockComponent,
  ShelfComponent,
  SkeletonComponent,
  TrackCardComponent,
  TrackListComponent,
} from '@hummi/components';

/** Home (`/`): the Recently added shelf and the Top 10 on Hummi this week (ADR 0005). */
@Component({
  selector: 'hm-home',
  imports: [ErrorBlockComponent, ShelfComponent, SkeletonComponent, TrackCardComponent, TrackListComponent],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly api = inject(PlaybackApi);
  readonly player = inject(PlayerStore);
  readonly overlays = inject(PlayerOverlays);
  readonly home = apiResource(() => this.api.home());
  /** Placeholder counts for the loading layout. */
  readonly cards = [1, 2, 3, 4, 5, 6];
  readonly rows = [1, 2, 3, 4, 5, 6];
}
