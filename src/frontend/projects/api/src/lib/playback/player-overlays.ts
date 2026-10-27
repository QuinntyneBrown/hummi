import { Injectable, signal } from '@angular/core';

import { TrackSummaryDto } from './playback-api';

/** An open track menu: the track and where it was opened from. */
export interface TrackMenuState {
  track: TrackSummaryDto;
  /** The opener's box in viewport pixels, or null to centre the menu. */
  anchor: DOMRect | null;
  /** The element focus returns to when the menu closes. */
  opener: HTMLElement | null;
}

/**
 * The shell's playback overlays: whether the queue drawer is open (L2-016) and which track menu is
 * (L2-053). Feature libraries, the player bar and shortcuts open them; the shell renders them.
 */
@Injectable({ providedIn: 'root' })
export class PlayerOverlays {
  private readonly queueState = signal(false);
  private readonly menuState = signal<TrackMenuState | null>(null);

  readonly queueOpen = this.queueState.asReadonly();
  readonly trackMenu = this.menuState.asReadonly();

  openQueue(): void {
    this.queueState.set(true);
  }

  closeQueue(): void {
    this.queueState.set(false);
  }

  toggleQueue(): void {
    this.queueState.update((open) => !open);
  }

  /** Opens the menu for a track, anchored to the element that has focus (the More actions button). */
  openTrackMenu(track: TrackSummaryDto, opener: Element | null = document.activeElement): void {
    const element = opener instanceof HTMLElement && opener !== document.body ? opener : null;
    this.menuState.set({ track, anchor: element?.getBoundingClientRect() ?? null, opener: element });
  }

  /** Closes the menu; with restoreFocus, focus goes back to its opener. */
  closeTrackMenu(restoreFocus = true): void {
    const opener = this.menuState()?.opener;
    this.menuState.set(null);
    if (restoreFocus && opener?.isConnected) opener.focus();
  }
}
