import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PlayerStore, SharesApi, TrackDetailDto, TracksApi } from '@hummi/api';
import {
  AlertComponent,
  ButtonDirective,
  ErrorBlockComponent,
  HeroComponent,
  IconComponent,
  PageHeaderComponent,
  SkeletonComponent,
  WaveformComponent,
  formatDuration,
} from '@hummi/components';
import { firstValueFrom } from 'rxjs';

const LICENCES: Record<string, string> = { cc0: 'CC0', ccBy4: 'CC BY 4.0', ccBySa4: 'CC BY-SA 4.0' };

/**
 * A share link (`/s/{code}`, L2-026). A track shows its landing page: "Shared with you", the meta line,
 * Play preview (the whole track, from ?t= when the link carries a start), Sign up to save it, the waveform
 * and the free-to-keep alert. A playlist opens its page with the code, which grants access while private.
 * An unknown code or a removed track shows "This link didn’t work".
 */
@Component({
  selector: 'hm-shared-link',
  imports: [
    RouterLink,
    AlertComponent,
    ButtonDirective,
    ErrorBlockComponent,
    HeroComponent,
    IconComponent,
    PageHeaderComponent,
    SkeletonComponent,
    WaveformComponent,
  ],
  template: `
    @switch (state()) {
      @case ('loading') {
        <hm-page-header heading="Shared with you" />
        <hm-skeleton shape="rect" height="14rem" />
      }
      @case ('error') {
        <hm-page-header heading="Shared with you" />
        <hm-error-block
          heading="This link didn’t work"
          text="The link may be incomplete or the track may have been removed."
          (retry)="load()"
        />
      }
      @case ('ready') {
        @if (track(); as t) {
          <hm-page-header [heading]="t.title" [subtitle]="t.artist.name" />
          <hm-hero [label]="t.title" [coverUrl]="t.coverUrl">
            <span class="overline">Shared with you</span>
            <p class="text-muted">{{ meta() }}</p>
            <div class="cluster">
              <button hmButton="primary" type="button" (click)="play(t)"><hm-icon name="play" />Play preview</button>
              <a hmButton routerLink="/sign-up">Sign up to save it</a>
            </div>
            <hm-waveform [peaks]="t.waveform" [played]="played()" />
          </hm-hero>
          <hm-alert tone="info" heading="Free to listen, free to keep">
            Hummi is free. Create an account to save this track to a playlist, follow {{ t.artist.name }} and keep your
            place.
          </hm-alert>
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedLinkComponent implements OnInit {
  private readonly shares = inject(SharesApi);
  private readonly tracks = inject(TracksApi);
  private readonly router = inject(Router);
  private readonly player = inject(PlayerStore);
  readonly code = input.required<string>();
  /** Start time in seconds from "Start at" (L2-025 AC4). */
  readonly t = input<string>();

  readonly state = signal<'loading' | 'error' | 'ready'>('loading');
  readonly track = signal<TrackDetailDto | null>(null);
  readonly meta = computed(() => {
    const t = this.track();
    if (!t) return '';
    return [t.artist.name, t.album?.title, formatDuration(t.durationSeconds), LICENCES[t.licence]]
      .filter(Boolean)
      .join(' · ');
  });
  readonly played = computed(() => {
    const t = this.track();
    const current = this.player.current();
    return t && current?.id === t.id && t.durationSeconds ? this.player.position() / t.durationSeconds : 0;
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.state.set('loading');
    const shared = await this.shares.resolve(this.code());
    if (shared.ok && shared.value.type === 'playlist' && shared.value.playlistId) {
      await this.router.navigate(['/playlists', shared.value.playlistId], {
        queryParams: { share: this.code() },
        replaceUrl: true,
      });
      return;
    }
    if (!shared.ok || !shared.value.trackSlug) {
      this.state.set('error');
      return;
    }
    try {
      this.track.set(await firstValueFrom(this.tracks.get(shared.value.trackSlug)));
      this.state.set('ready');
    } catch {
      this.state.set('error');
    }
  }

  /** Play preview: the whole track, without an account, from the link's start time if it has one. */
  play(t: TrackDetailDto): void {
    const summary = {
      id: t.id,
      slug: t.slug,
      title: t.title,
      artistName: t.artist.name,
      durationSeconds: t.durationSeconds,
      coverUrl: t.coverUrl,
      liked: t.liked,
      genreSlug: null,
      genreName: t.genre,
    };
    this.player.playAt(summary, Number(this.t() ?? 0) || 0);
  }
}
