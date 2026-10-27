import { DestroyRef, Signal, inject, signal } from '@angular/core';
import { Observable, Subscription, timeout } from 'rxjs';

import { ApiProblem, toProblem } from '../api-result';

/** A request still open after this long fails, so the page shows its error block. */
export const REQUEST_TIMEOUT_MS = 15_000;

export type ResourceState<T> =
  { status: 'loading' } | { status: 'ready'; value: T } | { status: 'error'; problem: ApiProblem };

export interface ApiResource<T> {
  readonly state: Signal<ResourceState<T>>;
  /** Requests the data again, showing the loading state meanwhile (Try again). */
  reload(): void;
}

/**
 * Loads a page's data through a typed API call and exposes it as a signal: loading, ready or error.
 * Call it in an injection context; the request is cancelled when the page is destroyed.
 */
export function apiResource<T>(load: () => Observable<T>): ApiResource<T> {
  const state = signal<ResourceState<T>>({ status: 'loading' });
  let subscription: Subscription | null = null;

  const reload = () => {
    subscription?.unsubscribe();
    state.set({ status: 'loading' });
    subscription = load()
      .pipe(timeout(REQUEST_TIMEOUT_MS))
      .subscribe({
        next: (value) => state.set({ status: 'ready', value }),
        error: (error: unknown) => state.set({ status: 'error', problem: toProblem(error) }),
      });
  };

  inject(DestroyRef).onDestroy(() => subscription?.unsubscribe());
  reload();
  return { state: state.asReadonly(), reload };
}
