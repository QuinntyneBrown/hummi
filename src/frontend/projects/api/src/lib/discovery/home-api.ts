import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, tap, throwError } from 'rxjs';

import { API_BASE_URL } from '../api-base-url';
import { ConnectivityService } from '../playback/connectivity';
import { TrackSummaryDto } from '../playback/playback-api';

/** GET /api/home/summary: whether Home shows its content or the empty state (L2-002 AC1). */
export interface HomeSummaryDto {
  hasHistory: boolean;
}

/** GET /api/home/featured: the billboard's album; tracks[0] is the "Opens with" track. */
export interface FeaturedAlbumDto {
  slug: string;
  title: string;
  artistName: string;
  artistSlug: string;
  kicker: string;
  blurb: string;
  trackCount: number;
  durationSeconds: number;
  tracks: TrackSummaryDto[];
}

/** GET /api/home/shelves/{key}: one shelf; newTrackIds carry the New badge. */
export interface HomeShelfDto {
  key: string;
  tracks: TrackSummaryDto[];
  newTrackIds: string[];
}

const CACHE = 'hummi.home.';

/**
 * Home's calls, one per part (L2-001, L2-002). The billboard and every shelf that loads is kept in
 * localStorage, so an offline device shows what was saved (L2-002 AC3); offline, a part without a saved
 * copy fails like any other failed request (ADR 0015).
 */
@Injectable({ providedIn: 'root' })
export class HomeApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly connectivity = inject(ConnectivityService);

  summary(): Observable<HomeSummaryDto> {
    return this.http.get<HomeSummaryDto>(`${this.baseUrl}/home/summary`);
  }

  featured(): Observable<FeaturedAlbumDto> {
    return this.cached('featured', this.http.get<FeaturedAlbumDto>(`${this.baseUrl}/home/featured`));
  }

  shelf(key: string): Observable<HomeShelfDto> {
    return this.cached(
      `shelf.${key}`,
      this.http.get<HomeShelfDto>(`${this.baseUrl}/home/shelves/${encodeURIComponent(key)}`),
    );
  }

  /** True when a saved copy of the part exists on this device. */
  hasSaved(part: string): boolean {
    return read(part) !== null;
  }

  private cached<T>(part: string, request: Observable<T>): Observable<T> {
    if (!this.connectivity.online()) {
      const saved = read<T>(part);
      return saved === null ? throwError(() => new Error('offline')) : of(saved);
    }
    return request.pipe(tap((value) => write(part, value)));
  }
}

function read<T>(part: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE + part);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(part: string, value: unknown): void {
  try {
    localStorage.setItem(CACHE + part, JSON.stringify(value));
  } catch {
    // Storage full or blocked: Home still works online.
  }
}
