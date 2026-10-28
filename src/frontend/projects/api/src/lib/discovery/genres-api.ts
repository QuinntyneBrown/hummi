import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-base-url';
import { TrackSummaryDto } from '../playback/playback-api';

/** One genre as Browse shows it; tone picks cover gradient 1 to 6. */
export interface GenreTileDto {
  slug: string;
  name: string;
  tone: number;
  trackCount: number;
}

/** GET /api/genres: the ten genres, the mood chips and the count of playable, freely licensed tracks. */
export interface GenreDirectoryDto {
  genreCount: number;
  openlyLicensedTrackCount: number;
  moods: GenreTileDto[];
  genres: GenreTileDto[];
}

export type GenreTrackSort = 'newest' | 'most-played';

/** GET /api/genres/{slug}/tracks: one page of the genre's published tracks. */
export interface GenreTracksDto {
  slug: string;
  name: string;
  description: string;
  tone: number;
  trackCount: number;
  sort: GenreTrackSort;
  page: number;
  pageSize: number;
  tracks: TrackSummaryDto[];
}

/** Browse and the genre pages. */
@Injectable({ providedIn: 'root' })
export class GenresApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  directory(): Observable<GenreDirectoryDto> {
    return this.http.get<GenreDirectoryDto>(`${this.baseUrl}/genres`);
  }

  tracks(slug: string, sort: GenreTrackSort, page = 1): Observable<GenreTracksDto> {
    const params = new HttpParams().set('sort', sort).set('page', page);
    return this.http.get<GenreTracksDto>(`${this.baseUrl}/genres/${encodeURIComponent(slug)}/tracks`, { params });
  }
}
