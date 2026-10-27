import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { API_BASE_URL } from '../api-base-url';
import { ApiResult, toResult } from '../api-result';
import { CurrentUser } from './session-store';

/** POST /api/auth/sign-up. */
export interface SignUpRequest {
  displayName: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
}

/**
 * The anonymous account calls (L2-027, L2-028). Sign up answers 202 or 422 with field errors; verify
 * answers the confirmed listener or 410 LINK_EXPIRED; resend sends a fresh link for the signed-in
 * listener, or for the owner of the given expired link.
 */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  signUp(request: SignUpRequest): Promise<ApiResult<unknown>> {
    return toResult(this.http.post(`${this.baseUrl}/auth/sign-up`, request));
  }

  verifyEmail(token: string): Promise<ApiResult<CurrentUser>> {
    return toResult(this.http.post<CurrentUser>(`${this.baseUrl}/auth/verify-email`, { token }));
  }

  resendConfirmation(token?: string): Promise<ApiResult<unknown>> {
    return toResult(this.http.post(`${this.baseUrl}/auth/resend-confirmation`, token ? { token } : {}));
  }
}
