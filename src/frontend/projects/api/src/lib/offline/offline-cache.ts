import { HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, tap, throwError } from 'rxjs';

import { ConnectivityService } from '../playback/connectivity';

const PREFIX = 'hummi.http.';
const INDEX = 'hummi.http.index';

/** How many page responses are kept for offline use (ADR 0020). */
export const CACHED_RESPONSE_LIMIT = 60;

/** The page requests whose answers are kept and that open the Offline page when missing (L2-043). */
const PAGE_REQUESTS = [
  /\/api\/tracks\/[^/]+$/,
  /\/api\/tracks\/[^/]+\/licence$/,
  /\/api\/artists\/[^/]+$/,
  /\/api\/albums\/[^/]+$/,
  /\/api\/genres(\/[^/]+\/tracks)?(\?.*)?$/,
  /\/api\/playlists\/[^/?]+(\?.*)?$/,
  /\/api\/me\/library$/,
  /\/api\/me\/notifications$/,
  /\/api\/me\/settings$/,
];

/**
 * Pages visited online keep their API answers in localStorage (the newest CACHED_RESPONSE_LIMIT); offline,
 * a page request is answered from there (L2-043 AC1), and a page with no saved answer opens the Offline page
 * in its place, keeping the address (AC3). Other requests pass through untouched.
 */
@Injectable({ providedIn: 'root' })
export class OfflineCache {
  private readonly connectivity = inject(ConnectivityService);
  private readonly router = inject(Router);
  /** The address the Offline page stands in for, so Retry can open it again. */
  readonly missedUrl = signal<string | null>(null);

  handle(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    if (request.method !== 'GET' || !PAGE_REQUESTS.some((p) => p.test(request.urlWithParams))) return next(request);
    const key = request.urlWithParams;
    if (!this.connectivity.online()) {
      const saved = read(key);
      if (saved !== null) return of(new HttpResponse({ status: 200, body: saved, url: key }));
      this.showOfflinePage();
      return throwError(() => new Error('offline'));
    }
    return next(request).pipe(
      tap((event) => {
        if (event instanceof HttpResponse && event.ok) write(key, event.body);
      }),
    );
  }

  private showOfflinePage(): void {
    if (this.router.url.startsWith('/offline')) return;
    this.missedUrl.set(location.pathname + location.search);
    void this.router.navigateByUrl('/offline', { skipLocationChange: true });
  }
}

/** The interceptor for provideApi. */
export function offlineInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  return inject(OfflineCache).handle(request, next);
}

function read(key: string): unknown | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(key: string, body: unknown): void {
  try {
    const index = (JSON.parse(localStorage.getItem(INDEX) ?? '[]') as string[]).filter((k) => k !== key);
    index.unshift(key);
    for (const old of index.splice(CACHED_RESPONSE_LIMIT)) localStorage.removeItem(PREFIX + old);
    localStorage.setItem(PREFIX + key, JSON.stringify(body));
    localStorage.setItem(INDEX, JSON.stringify(index));
  } catch {
    // Storage full or blocked: the page still works online.
  }
}
