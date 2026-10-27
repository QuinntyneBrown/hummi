import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { API_BASE_URL } from '../api-base-url';
import { ApiResult, toResult } from '../api-result';
import { SignInGate } from '../auth/sign-in-gate';

export type ReportReason = 'copied' | 'wrong-licence' | 'harmful' | 'other';

/** POST /api/tracks/{id}/reports (L2-038); 201, or 422 with "Choose a reason". */
@Injectable({ providedIn: 'root' })
export class ReportsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  report(trackId: string, reason: ReportReason | '', details: string): Promise<ApiResult<{ id: string }>> {
    return toResult(
      this.http.post<{ id: string }>(`${this.baseUrl}/tracks/${encodeURIComponent(trackId)}/reports`, {
        reason: reason || null,
        details,
      }),
    );
  }
}

/** The track being reported. */
export interface ReportSubject {
  id: string;
  title: string;
}

/**
 * The open Report dialog (L2-038); the shell renders it from @hummi/reporting. Reporting needs an account, so
 * the outcome can be emailed: signed out, the sign-in prompt opens instead (ADR 0018).
 */
@Injectable({ providedIn: 'root' })
export class ReportDialogs {
  private readonly gate = inject(SignInGate);
  private readonly state = signal<ReportSubject | null>(null);
  readonly open = this.state.asReadonly();

  report(track: ReportSubject): void {
    if (this.gate.allow()) this.state.set(track);
  }

  close(): void {
    this.state.set(null);
  }
}
