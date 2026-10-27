import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-base-url';
import { TrackSummaryDto } from '../playback/playback-api';

/** One artist result; it links to /artists/{slug}. */
export interface ArtistHitDto {
  slug: string;
  name: string;
}

/** GET /api/search?q=: the best song (null with none), up to 3 artists and up to 7 songs. */
export interface SearchResultsDto {
  query: string;
  topResult: TrackSummaryDto | null;
  artists: ArtistHitDto[];
  songs: TrackSummaryDto[];
}

/** The search overlay. 503 SEARCH_UNAVAILABLE means the index is unreachable. */
@Injectable({ providedIn: 'root' })
export class SearchApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  search(query: string): Observable<SearchResultsDto> {
    return this.http.get<SearchResultsDto>(`${this.baseUrl}/search`, { params: new HttpParams().set('q', query) });
  }
}
