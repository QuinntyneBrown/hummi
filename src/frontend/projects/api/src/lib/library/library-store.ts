import { Injectable, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { SessionStore } from '../auth/session-store';
import { SignInGate } from '../auth/sign-in-gate';
import { LibraryApi, LibraryDto } from './library-api';

/** A failed like or follow; the shell shows it as the danger toast with Retry (L2-018 AC4). */
export interface LibraryProblem {
  id: number;
  title: string;
  text: string;
  retry: () => void;
}

/**
 * The signed-in listener's likes and follows (L2-018). Public catalogue responses are the same for
 * everyone, so the marks come from GET /api/me/library, loaded at sign-in and on every Library visit
 * (ADR 0012). A toggle flips the mark at once, sends an idempotent request and flips back on failure.
 */
@Injectable({ providedIn: 'root' })
export class LibraryStore {
  private readonly api = inject(LibraryApi);
  private readonly session = inject(SessionStore);
  private readonly gate = inject(SignInGate);
  private readonly likedIds = signal<ReadonlySet<string>>(new Set());
  private readonly followedSlugs = signal<ReadonlySet<string>>(new Set());
  private readonly lastProblem = signal<LibraryProblem | null>(null);
  /** False until the listener's library has been read; until then tracks keep the flag they arrived with. */
  private readonly loaded = signal(false);
  private nextProblem = 1;
  private readonly marked = new WeakMap<readonly object[], { liked: ReadonlySet<string>; tracks: object[] }>();

  /** The latest failed toggle, for the shell's danger toast. */
  readonly problem = this.lastProblem.asReadonly();

  constructor() {
    effect(() => {
      if (this.session.signedIn()) void this.reload();
      else this.apply(null);
    });
  }

  isLiked(trackId: string): boolean {
    return this.likedIds().has(trackId);
  }

  isFollowing(artistSlug: string): boolean {
    return this.followedSlugs().has(artistSlug);
  }

  /** The tracks with liked set from the listener's likes; the same array in gives the same array out. */
  withLikes<T extends { id: string; liked: boolean }>(tracks: readonly T[]): T[] {
    if (!this.loaded()) return tracks as T[];
    const liked = this.likedIds();
    const cached = this.marked.get(tracks);
    if (cached && cached.liked === liked) return cached.tracks as T[];
    const result = tracks.map((t) => (t.liked === liked.has(t.id) ? t : { ...t, liked: liked.has(t.id) }));
    this.marked.set(tracks, { liked, tracks: result });
    return result;
  }

  /** Reads the library afresh and refreshes the marks from it. */
  async reload(): Promise<LibraryDto | null> {
    try {
      const library = await firstValueFrom(this.api.library());
      this.apply(library);
      return library;
    } catch {
      return null;
    }
  }

  /** Called by Library after its own read, so the marks match what it shows. */
  apply(library: LibraryDto | null): void {
    this.loaded.set(library !== null);
    this.likedIds.set(new Set(library?.liked.map((t) => t.id) ?? []));
    this.followedSlugs.set(new Set(library?.following.map((a) => a.slug) ?? []));
  }

  /** Like or remove the like (L2-018 AC1, AC2); signed out, opens the sign-in prompt instead. */
  async toggleLike(track: { id: string; title: string }): Promise<void> {
    if (!this.gate.allow()) return;
    const liked = !this.isLiked(track.id);
    this.likedIds.update((ids) => toggled(ids, track.id, liked));
    const result = await this.api.setLike(track.id, liked);
    if (result.ok) return;
    this.likedIds.update((ids) => toggled(ids, track.id, !liked));
    this.fail(liked ? 'Couldn’t like the track' : 'Couldn’t remove the like', () => void this.toggleLike(track));
  }

  /** Follow or unfollow (L2-018 AC3); signed out, opens the sign-in prompt instead. */
  async toggleFollow(artist: { slug: string }): Promise<void> {
    if (!this.gate.allow()) return;
    const following = !this.isFollowing(artist.slug);
    this.followedSlugs.update((slugs) => toggled(slugs, artist.slug, following));
    const result = await this.api.setFollow(artist.slug, following);
    if (result.ok) return;
    this.followedSlugs.update((slugs) => toggled(slugs, artist.slug, !following));
    this.fail(
      following ? 'Couldn’t follow the artist' : 'Couldn’t unfollow the artist',
      () => void this.toggleFollow(artist),
    );
  }

  private fail(title: string, retry: () => void): void {
    this.lastProblem.set({ id: this.nextProblem++, title, text: 'Check your connection and try again.', retry });
  }
}

function toggled(set: ReadonlySet<string>, key: string, on: boolean): ReadonlySet<string> {
  const next = new Set(set);
  if (on) next.add(key);
  else next.delete(key);
  return next;
}
