import { Injectable, signal } from '@angular/core';

/** localStorage key of the recent searches on this device. */
export const RECENT_SEARCHES_KEY = 'hummi.recent-searches';
export const MAX_RECENT_SEARCHES = 6;

/** The last six queries run on this device, newest first and without duplicates (ADR 0008). */
@Injectable({ providedIn: 'root' })
export class RecentSearchesStore {
  private readonly itemsState = signal<readonly string[]>(read());
  readonly items = this.itemsState.asReadonly();

  add(query: string): void {
    const text = query.trim();
    if (!text) return;
    const items = [text, ...this.itemsState().filter((item) => item.toLowerCase() !== text.toLowerCase())].slice(
      0,
      MAX_RECENT_SEARCHES,
    );
    this.itemsState.set(items);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items));
    } catch {
      // Storage may be full or blocked; the list still lasts for this visit.
    }
  }
}

function read(): readonly string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? '[]');
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT_SEARCHES)
      : [];
  } catch {
    return [];
  }
}
