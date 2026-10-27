import { Injectable, computed, inject, signal } from '@angular/core';

import { PlaybackApi, TrackSummaryDto } from '../playback/playback-api';

const CACHE = 'hummi-audio-v1';
const INDEX = 'hummi.saved-audio';
const TOLD = 'hummi.saved-audio.told';

/** How many recently played tracks keep their audio on this device (ADR 0020). */
export const SAVED_TRACK_LIMIT = 25;

interface SavedEntry {
  track: TrackSummaryDto;
  savedAt: number;
}

/**
 * Audio saved on this device for offline listening (L2-043 AC2): every track that starts playing online is
 * kept in Cache Storage, the most recent SAVED_TRACK_LIMIT of them. There is no download button; saving is
 * automatic, and the first save says so once with the Downloads toast (L2-041 AC4).
 */
@Injectable({ providedIn: 'root' })
export class SavedAudioCache {
  private readonly api = inject(PlaybackApi);
  private readonly entries = signal<readonly SavedEntry[]>(readIndex());
  private readonly firstSave = signal(0);
  /** The saved tracks, most recently played first. */
  readonly tracks = computed(() => this.entries().map((e) => e.track));
  /** Counts up once, on the first save on this device, for the shell's Downloads toast. */
  readonly told = this.firstSave.asReadonly();

  isSaved(trackId: string): boolean {
    return this.entries().some((e) => e.track.id === trackId);
  }

  /** Keeps the track's audio; refreshes its place when already saved. Failures leave nothing saved. */
  async save(track: TrackSummaryDto): Promise<void> {
    if (typeof caches === 'undefined') return;
    const url = this.api.streamUrl(track.id);
    try {
      const cache = await caches.open(CACHE);
      if (!(await cache.match(url))) {
        const response = await fetch(url);
        if (!response.ok) return;
        await cache.put(url, response);
      }
      const kept = [
        { track: { ...track }, savedAt: Date.now() },
        ...this.entries().filter((e) => e.track.id !== track.id),
      ];
      const dropped = kept.splice(SAVED_TRACK_LIMIT);
      await Promise.all(dropped.map((e) => cache.delete(this.api.streamUrl(e.track.id))));
      this.entries.set(kept);
      writeIndex(kept);
      if (!localStorageFlag()) {
        setLocalStorageFlag();
        this.firstSave.update((n) => n + 1);
      }
    } catch {
      // Storage unavailable or full: the track simply is not saved.
    }
  }

  /** An object URL for the saved audio, or null when the track is not on this device. */
  async open(trackId: string): Promise<string | null> {
    if (typeof caches === 'undefined' || !this.isSaved(trackId)) return null;
    try {
      const response = await (await caches.open(CACHE)).match(this.api.streamUrl(trackId));
      return response ? URL.createObjectURL(await response.blob()) : null;
    } catch {
      return null;
    }
  }
}

function readIndex(): SavedEntry[] {
  try {
    return JSON.parse(localStorage.getItem(INDEX) ?? '[]') as SavedEntry[];
  } catch {
    return [];
  }
}

function writeIndex(entries: readonly SavedEntry[]): void {
  try {
    localStorage.setItem(INDEX, JSON.stringify(entries));
  } catch {
    // The audio stays cached; the list is rebuilt as tracks play again.
  }
}

function localStorageFlag(): boolean {
  try {
    return localStorage.getItem(TOLD) === '1';
  } catch {
    return true;
  }
}

function setLocalStorageFlag(): void {
  try {
    localStorage.setItem(TOLD, '1');
  } catch {
    // Without storage the toast would repeat; it is shown at most once per visit instead.
  }
}
