import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-base-url';
import { ApiResult, toResult } from '../api-result';
import { TrackSummaryDto } from '../playback/playback-api';

/** A playlist tile in Library: "{n} tracks · {owner}" (L2-019 AC2). */
export interface PlaylistTileDto {
  id: string;
  name: string;
  trackCount: number;
  ownerName: string;
  coverUrl: string | null;
}

/** A followed artist in Library > Following. */
export interface ArtistTileDto {
  slug: string;
  name: string;
  monthlyListeners: number;
  coverUrl: string | null;
}

/** GET /api/me/library: the counts and the three tabs, newest first. */
export interface LibraryDto {
  playlistCount: number;
  likedCount: number;
  followingCount: number;
  playlists: PlaylistTileDto[];
  liked: TrackSummaryDto[];
  following: ArtistTileDto[];
}

/** The signed-in listener's library (L2-018, L2-019). Likes and follows are idempotent PUT and DELETE. */
@Injectable({ providedIn: 'root' })
export class LibraryApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  library(): Observable<LibraryDto> {
    return this.http.get<LibraryDto>(`${this.baseUrl}/me/library`);
  }

  setLike(trackId: string, liked: boolean): Promise<ApiResult<unknown>> {
    const url = `${this.baseUrl}/me/likes/${encodeURIComponent(trackId)}`;
    return toResult(liked ? this.http.put(url, null) : this.http.delete(url));
  }

  setFollow(artistSlug: string, following: boolean): Promise<ApiResult<unknown>> {
    const url = `${this.baseUrl}/me/follows/${encodeURIComponent(artistSlug)}`;
    return toResult(following ? this.http.put(url, null) : this.http.delete(url));
  }
}
