import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-base-url';
import { ApiResult, toResult } from '../api-result';
import { TrackSummaryDto } from '../playback/playback-api';

/** One entry of a playlist; entryId tells apart a track that appears twice. */
export interface PlaylistEntryDto {
  entryId: string;
  track: TrackSummaryDto;
}

/** GET /api/playlists/{id}: the owner's view, or a public playlist for anyone (isOwner false). */
export interface PlaylistDetailDto {
  id: string;
  name: string;
  isPublic: boolean;
  isOwner: boolean;
  ownerName: string;
  trackCount: number;
  durationSeconds: number;
  /** The viewer keeps someone else's playlist in Library (L2-024 AC3). */
  saved: boolean;
  entries: PlaylistEntryDto[];
}

/** One of the listener's playlists in Add to playlist (L2-020 AC1). */
export interface PlaylistChoiceDto {
  id: string;
  name: string;
  trackCount: number;
  containsTrack: boolean;
}

/** Where a track landed: "“{title}” is now track {position}." */
export interface PlaylistPositionDto {
  id: string;
  name: string;
  position: number;
}

export interface MembershipChangeDto {
  added: PlaylistPositionDto[];
  removed: string[];
}

/** The playlist calls (L2-020 to L2-023). Changes need a session; a public playlist reads for anyone. */
@Injectable({ providedIn: 'root' })
export class PlaylistsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** share is the playlist's link code, which opens it while private (L2-024 AC4). */
  get(id: string, share?: string | null): Observable<PlaylistDetailDto> {
    const query = share ? `?share=${encodeURIComponent(share)}` : '';
    return this.http.get<PlaylistDetailDto>(`${this.baseUrl}/playlists/${encodeURIComponent(id)}${query}`);
  }

  /** Save to my library, or take it out again. */
  setSaved(id: string, saved: boolean, share?: string | null): Promise<ApiResult<unknown>> {
    const query = share ? `?share=${encodeURIComponent(share)}` : '';
    const url = `${this.baseUrl}/me/saved-playlists/${encodeURIComponent(id)}${query}`;
    return toResult(saved ? this.http.put(url, null) : this.http.delete(url));
  }

  mine(trackId?: string): Promise<ApiResult<PlaylistChoiceDto[]>> {
    const query = trackId ? `?trackId=${encodeURIComponent(trackId)}` : '';
    return toResult(this.http.get<PlaylistChoiceDto[]>(`${this.baseUrl}/me/playlists${query}`));
  }

  create(name: string, isPublic: boolean, trackIds: string[] = []): Promise<ApiResult<PlaylistPositionDto>> {
    return toResult(this.http.post<PlaylistPositionDto>(`${this.baseUrl}/playlists`, { name, isPublic, trackIds }));
  }

  update(id: string, name: string, isPublic: boolean): Promise<ApiResult<unknown>> {
    return toResult(this.http.put(`${this.baseUrl}/playlists/${encodeURIComponent(id)}`, { name, isPublic }));
  }

  delete(id: string): Promise<ApiResult<unknown>> {
    return toResult(this.http.delete(`${this.baseUrl}/playlists/${encodeURIComponent(id)}`));
  }

  setMembership(trackId: string, playlistIds: string[]): Promise<ApiResult<MembershipChangeDto>> {
    return toResult(
      this.http.put<MembershipChangeDto>(`${this.baseUrl}/me/playlist-membership`, { trackId, playlistIds }),
    );
  }

  addTracks(id: string, trackIds: string[], allowDuplicates = false): Promise<ApiResult<PlaylistPositionDto>> {
    return toResult(
      this.http.post<PlaylistPositionDto>(`${this.baseUrl}/playlists/${encodeURIComponent(id)}/tracks`, {
        trackIds,
        allowDuplicates,
      }),
    );
  }

  removeEntries(id: string, entryIds: string[]): Promise<ApiResult<unknown>> {
    return toResult(this.http.post(`${this.baseUrl}/playlists/${encodeURIComponent(id)}/entries/remove`, { entryIds }));
  }
}
