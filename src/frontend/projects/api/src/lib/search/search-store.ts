import { Injectable, signal } from '@angular/core';

/**
 * Whether the search layer is open and the query it opens with. The shell renders the layer while
 * open is true; the header, "/", the /search route and later the track menu open it (ADR 0008).
 */
@Injectable({ providedIn: 'root' })
export class SearchStore {
  private readonly openState = signal(false);
  private readonly queryState = signal('');

  readonly open = this.openState.asReadonly();
  /** The query the layer starts with when it opens. */
  readonly query = this.queryState.asReadonly();

  openWith(query = ''): void {
    this.queryState.set(query);
    this.openState.set(true);
  }

  close(): void {
    this.openState.set(false);
  }
}
