import { Injectable, inject, signal } from '@angular/core';

import { SignInGate } from '../auth/sign-in-gate';

/** A track as the playlist dialogs need it. */
export interface PlaylistTrack {
  id: string;
  title: string;
  coverUrl: string | null;
}

/**
 * An open playlist dialog: Add to playlist for some tracks, or New playlist (holding them, if any). With
 * append (a selection, an album) Save appends to the checked playlists instead of setting membership.
 */
export type PlaylistDialog =
  { kind: 'add'; tracks: PlaylistTrack[]; append: boolean } | { kind: 'create'; tracks: PlaylistTrack[] };

/**
 * Which app-wide playlist dialog is open (L2-020, L2-021). Any page opens them; the shell renders them
 * from @hummi/library, as it does the Sign in to save this prompt. Opening asks SignInGate first.
 * changes counts saved changes, so Library and the playlist page read again.
 */
@Injectable({ providedIn: 'root' })
export class PlaylistDialogs {
  private readonly gate = inject(SignInGate);
  private readonly state = signal<PlaylistDialog | null>(null);
  private readonly saved = signal(0);
  readonly open = this.state.asReadonly();
  readonly changes = this.saved.asReadonly();

  /** One track sets its membership; append (or several tracks) adds them to the checked playlists. */
  addToPlaylist(tracks: PlaylistTrack[], append = tracks.length > 1): void {
    if (tracks.length && this.gate.allow()) this.state.set({ kind: 'add', tracks, append });
  }

  newPlaylist(tracks: PlaylistTrack[] = []): void {
    if (this.gate.allow()) this.state.set({ kind: 'create', tracks });
  }

  close(): void {
    this.state.set(null);
  }

  /** A playlist changed: pages showing playlists read again. */
  changed(): void {
    this.saved.update((n) => n + 1);
  }
}
