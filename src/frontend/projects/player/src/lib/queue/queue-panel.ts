import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  output,
  signal,
} from '@angular/core';
import { GenresApi, PlayerOverlays, PlayerStore, TrackSummaryDto } from '@hummi/api';
import { QueueDrawerComponent } from '@hummi/components';
import { Subscription } from 'rxjs';

/** How many "Then, more {genre}" tracks the drawer lists. */
export const MORE_COUNT = 4;

/**
 * The queue drawer of the shell (L2-016): hm-queue-drawer over PlayerStore, with "Then, more {genre}"
 * drawn from the current track's genre, most played first, leaving out tracks already queued. The shell
 * renders it while PlayerOverlays.queueOpen() is true; closed fires on Close and Escape.
 */
@Component({
  selector: 'hm-queue-panel',
  imports: [QueueDrawerComponent],
  template: `
    <hm-queue-drawer
      [current]="player.current()"
      [playing]="player.playing()"
      [upNext]="player.upNext()"
      [genreName]="player.current()?.genreName ?? null"
      [more]="more()"
      (dismiss)="dismiss()"
      (clear)="player.clearUpNext()"
      (remove)="player.removeUpNext($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueuePanelComponent {
  readonly player = inject(PlayerStore);
  private readonly overlays = inject(PlayerOverlays);
  private readonly genres = inject(GenresApi);
  readonly closed = output<void>();

  private readonly genreTracks = signal<readonly TrackSummaryDto[]>([]);
  private readonly genreSlug = computed(() => this.player.current()?.genreSlug ?? null);
  readonly more = computed(() => {
    const queued = new Set(this.player.queue().map((t) => t.id));
    return this.genreTracks()
      .filter((t) => !queued.has(t.id))
      .slice(0, MORE_COUNT);
  });

  constructor() {
    let subscription: Subscription | null = null;
    effect(() => {
      const slug = this.genreSlug();
      subscription?.unsubscribe();
      this.genreTracks.set([]);
      if (!slug) return;
      subscription = this.genres.tracks(slug, 'most-played').subscribe({
        next: (page) => this.genreTracks.set(page.tracks),
        error: () => this.genreTracks.set([]),
      });
    });
    inject(DestroyRef).onDestroy(() => subscription?.unsubscribe());
  }

  dismiss(): void {
    this.overlays.closeQueue();
    this.closed.emit();
  }
}
