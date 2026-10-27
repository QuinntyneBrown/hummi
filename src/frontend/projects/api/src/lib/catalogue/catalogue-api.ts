import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-base-url';
import { TrackSummaryDto } from '../playback/playback-api';

/** The three open licences; every track carries exactly one. */
export type Licence = 'cc0' | 'ccBy4' | 'ccBySa4';

export interface ArtistRefDto {
  slug: string;
  name: string;
}

export interface AlbumRefDto {
  slug: string;
  title: string;
}

/**
 * GET /api/tracks/{slug}: one track with its details. A playable track carries moreFromArtist; a
 * withdrawn one (playable false) carries similar instead. waveform holds peaks from 0 to 100.
 */
export interface TrackDetailDto {
  id: string;
  slug: string;
  title: string;
  durationSeconds: number;
  coverUrl: string | null;
  artist: ArtistRefDto;
  album: AlbumRefDto | null;
  genre: string | null;
  /** The open-weights model, for example "openmusic-3b". */
  generatedWith: string;
  licence: Licence;
  /** For example "CC0 1.0 (public domain)". */
  licenceLabel: string;
  plays: number;
  playable: boolean;
  liked: boolean;
  waveform: number[];
  moreFromArtist: TrackSummaryDto[];
  similar: TrackSummaryDto[];
}

/** One release on an artist page. */
export interface AlbumTileDto {
  slug: string;
  title: string;
  year: number;
  trackCount: number;
  coverUrl: string | null;
}

/** GET /api/artists/{slug}: the artist with Popular tracks and Releases; both empty before a first release. */
export interface ArtistDetailDto {
  slug: string;
  name: string;
  modelName: string;
  description: string;
  monthlyListeners: number;
  coverUrl: string | null;
  following: boolean;
  popular: TrackSummaryDto[];
  releases: AlbumTileDto[];
}

/** GET /api/albums/{slug}: the album's tracks in order and the summary "{year} · {n} tracks · {minutes} min · {licence}". */
export interface AlbumDetailDto {
  slug: string;
  title: string;
  year: number;
  artist: ArtistRefDto;
  coverUrl: string | null;
  summary: string;
  tracks: TrackSummaryDto[];
}

/** Track pages and their licence pages. */
@Injectable({ providedIn: 'root' })
export class TracksApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get(slug: string): Observable<TrackDetailDto> {
    return this.http.get<TrackDetailDto>(`${this.baseUrl}/tracks/${encodeURIComponent(slug)}`);
  }
}

/** Artist pages. */
@Injectable({ providedIn: 'root' })
export class ArtistsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get(slug: string): Observable<ArtistDetailDto> {
    return this.http.get<ArtistDetailDto>(`${this.baseUrl}/artists/${encodeURIComponent(slug)}`);
  }
}

/** Album pages. */
@Injectable({ providedIn: 'root' })
export class AlbumsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get(slug: string): Observable<AlbumDetailDto> {
    return this.http.get<AlbumDetailDto>(`${this.baseUrl}/albums/${encodeURIComponent(slug)}`);
  }
}
