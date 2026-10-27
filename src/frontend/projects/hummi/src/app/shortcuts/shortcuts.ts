import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PlayerOverlays, PlayerStore, SearchStore, SignInGate } from '@hummi/api';

/** One keyboard shortcut: the keys it answers to, how the dialog shows it and what it does. */
export interface ShortcutBinding {
  keys: readonly string[];
  label: string;
  action: string;
}

/** The six shortcuts of L2-017, in the order the Keyboard shortcuts dialog lists them. */
export const SHORTCUTS: readonly ShortcutBinding[] = [
  { keys: [' '], label: 'Space', action: 'Play or pause' },
  { keys: ['ArrowRight', 'ArrowLeft'], label: '→ / ←', action: 'Next or previous track' },
  { keys: ['l', 'L'], label: 'L', action: 'Like the current track' },
  { keys: ['q', 'Q'], label: 'Q', action: 'Open the queue' },
  { keys: ['/'], label: '/', action: 'Focus search' },
  { keys: ['?'], label: '?', action: 'Show this list' },
];

/**
 * Keyboard shortcuts (L2-017). The shell passes every document keydown to handle(), which ignores keys
 * typed into a text field, keys with Ctrl, Alt or Meta, and Space on a focused control (so the control
 * keeps its own Space, L2-048). L asks SignInGate (L2-032); liking itself comes with journey 09.
 */
@Injectable({ providedIn: 'root' })
export class ShortcutService {
  private readonly player = inject(PlayerStore);
  private readonly overlays = inject(PlayerOverlays);
  private readonly search = inject(SearchStore);
  private readonly router = inject(Router);
  private readonly gate = inject(SignInGate);
  private readonly dialogState = signal(false);

  /** The Keyboard shortcuts dialog is open. */
  readonly dialogOpen = this.dialogState.asReadonly();

  closeDialog(): void {
    this.dialogState.set(false);
  }

  handle(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTextField(event.target) || this.search.open() || this.dialogState()) return;
    const key = event.key;
    if (key === ' ' && isControl(event.target)) return;
    if (!SHORTCUTS.some((s) => s.keys.includes(key))) return;
    event.preventDefault();
    switch (key) {
      case ' ':
        return this.player.toggle();
      case 'ArrowRight':
        return this.player.next();
      case 'ArrowLeft':
        return this.player.previous();
      case 'q':
      case 'Q':
        if (this.router.url.startsWith('/now-playing')) void this.router.navigateByUrl('/');
        return this.overlays.openQueue();
      case '/':
        return this.search.openWith();
      case '?':
        return this.dialogState.set(true);
      case 'l':
      case 'L':
        if (this.player.current()) this.gate.allow();
        return;
    }
  }
}

function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** Buttons, links and menu items activate themselves with Space. */
function isControl(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && !!target.closest('button, a[href], [role="menuitem"], summary');
}
