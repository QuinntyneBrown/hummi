import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { API_BASE_URL } from '../api-base-url';
import { ApiResult, toResult } from '../api-result';

/** What `/s/{code}` opens: a track by slug or a playlist by id. */
export interface SharedItemDto {
  type: 'track' | 'playlist';
  trackSlug: string | null;
  playlistId: string | null;
}

/** POST /api/shares and GET /api/shares/{code} (L2-025, L2-026); both work without an account. */
@Injectable({ providedIn: 'root' })
export class SharesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  share(type: 'track' | 'playlist', id: string): Promise<ApiResult<{ code: string }>> {
    return toResult(this.http.post<{ code: string }>(`${this.baseUrl}/shares`, { type, id }));
  }

  resolve(code: string): Promise<ApiResult<SharedItemDto>> {
    return toResult(this.http.get<SharedItemDto>(`${this.baseUrl}/shares/${encodeURIComponent(code)}`));
  }
}

/** What the Share dialog shares: a track (with its slug for the embed code) or a playlist. */
export interface ShareSubject {
  type: 'track' | 'playlist';
  id: string;
  name: string;
  byline: string;
  coverUrl: string | null;
  slug?: string;
}

/** The open Share dialog (L2-025); any page opens it, the shell renders it from @hummi/sharing. */
@Injectable({ providedIn: 'root' })
export class ShareDialogs {
  private readonly state = signal<ShareSubject | null>(null);
  readonly open = this.state.asReadonly();

  share(subject: ShareSubject): void {
    this.state.set(subject);
  }

  close(): void {
    this.state.set(null);
  }
}
