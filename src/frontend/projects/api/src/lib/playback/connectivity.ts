import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/** Whether the browser is online, from navigator.onLine and the window's online and offline events. */
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly state = signal(typeof navigator === 'undefined' ? true : navigator.onLine);
  readonly online = this.state.asReadonly();

  constructor() {
    if (typeof window === 'undefined') return;
    const up = () => this.state.set(true);
    const down = () => this.state.set(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    });
  }
}
