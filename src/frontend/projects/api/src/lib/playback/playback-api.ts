import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-base-url';
import { toResult } from '../api-result';

/** One track as every track-returning endpoint lists it. */
export interface TrackSummaryDto {
  id: string;
  /** The track's segment of /tracks/{slug}. */
  slug: string;
  title: string;
  artistName: string;
  durationSeconds: number;
  coverUrl: string | null;
  /** The signed-in listener likes it; always false for a visitor. */
  liked: boolean;
  /** The genre it is listed under ("Playing from", "Then, more", "Go to"); null while unclassified. */
  genreSlug?: string | null;
  genreName?: string | null;
}

/** GET /api/home: the Recently added shelf and the Top 10 on Hummi this week. */
export interface HomeDto {
  recentlyAdded: TrackSummaryDto[];
  topTen: TrackSummaryDto[];
}

/** Home, stream URLs and play recording. Streams come from /media, a sibling of the API base URL. */
@Injectable({ providedIn: 'root' })
export class PlaybackApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  home(): Observable<HomeDto> {
    return this.http.get<HomeDto>(`${this.baseUrl}/home`);
  }

  /** The audio of a track, served by byte range. */
  streamUrl(trackId: string): string {
    return `${this.baseUrl.replace(/\/api$/, '')}/media/tracks/${encodeURIComponent(trackId)}`;
  }

  /** Records that playback of a track started; anonymous or signed in. Failures are ignored. */
  async recordPlay(trackId: string): Promise<void> {
    await toResult(this.http.post(`${this.baseUrl}/plays`, { trackId }));
  }
}
