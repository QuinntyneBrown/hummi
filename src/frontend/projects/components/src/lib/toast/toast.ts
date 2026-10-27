import { ChangeDetectionStrategy, Component, Injectable, inject, input, signal } from '@angular/core';

import { IconComponent } from '../icon/icon';

/** Milliseconds a toast stays before it dismisses itself (L2-041). */
export const TOAST_MS = 4000;

/** One confirmation pill: its message, the track cover (or the coral dot) and an optional Undo. */
export interface Toast {
  id: number;
  message: string;
  coverUrl: string | null;
  /** True for the cover of a track without artwork; false shows the dot. */
  cover: boolean;
  undo?: () => void;
  /** A toned card (L2-018 AC4, L2-020): title, text and an optional action. Danger stays until dismissed. */
  card?: ToastCard;
}

export type ToastTone = 'success' | 'warning' | 'danger';

export interface ToastCard {
  tone: ToastTone;
  title: string;
  text: string;
  action?: { label: string; run: () => void };
}

/** Queues toasts for hm-toast-region; pills dismiss themselves after TOAST_MS, danger toasts stay. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly items = signal<readonly Toast[]>([]);
  readonly toasts = this.items.asReadonly();

  /** Shows a toast; with track it leads with the track's cover. */
  show(message: string, options: { track?: { coverUrl: string | null }; undo?: () => void } = {}): void {
    const toast: Toast = {
      id: this.nextId++,
      message,
      coverUrl: options.track?.coverUrl ?? null,
      cover: !!options.track,
      undo: options.undo,
    };
    this.items.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), TOAST_MS);
  }

  /** Shows a danger toast that stays until the listener dismisses it or runs its action. */
  showDanger(title: string, text: string, action?: { label: string; run: () => void }): void {
    this.showCard({ tone: 'danger', title, text, action });
  }

  /** Shows a toned card; success and warning dismiss themselves after TOAST_MS, danger stays. */
  showCard(card: ToastCard): void {
    const toast: Toast = { id: this.nextId++, message: card.title, coverUrl: null, cover: false, card };
    this.items.update((list) => [...list, toast]);
    if (card.tone !== 'danger') setTimeout(() => this.dismiss(toast.id), TOAST_MS);
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((t) => t.id !== id));
  }
}

/**
 * The polite live region of toast pills, centred above the player bar, or near the bottom with
 * noPlayer. Undo runs the toast's undo and dismisses it.
 */
@Component({
  selector: 'hm-toast-region',
  imports: [IconComponent],
  template: `
    <div class="toast-region" [class.toast-region--noplayer]="noPlayer()" role="status" aria-live="polite">
      @for (toast of service.toasts(); track toast.id) {
        @if (toast.card; as d) {
          <div [class]="'toast toast--' + d.tone" [attr.role]="d.tone === 'danger' ? 'alert' : 'status'">
            <hm-icon [name]="d.tone === 'success' ? 'ok' : 'alert'" />
            <div class="toast__body">
              <div class="toast__title">{{ d.title }}</div>
              <div class="toast__text">{{ d.text }}</div>
              @if (d.action; as action) {
                <button class="toast__action" type="button" (click)="service.dismiss(toast.id); action.run()">
                  {{ action.label }}
                </button>
              }
            </div>
            <button class="close" type="button" aria-label="Dismiss" (click)="service.dismiss(toast.id)">
              <hm-icon name="close" />
            </button>
          </div>
        } @else {
          <div class="toast" [class.toast--undo]="!!toast.undo">
            @if (toast.cover) {
              <div class="cover cover--c1 cover--sm" [class.cover--art]="!!toast.coverUrl" aria-hidden="true">
                @if (toast.coverUrl; as url) {
                  <img [src]="url" alt="" />
                }
                <hm-icon name="music" />
              </div>
            } @else {
              <span class="toast__dot" aria-hidden="true"></span>
            }
            <span class="toast__msg">{{ toast.message }}</span>
            @if (toast.undo; as undo) {
              <button class="toast__undo" type="button" (click)="undo(); service.dismiss(toast.id)">Undo</button>
            }
          </div>
        }
      }
    </div>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastRegionComponent {
  protected readonly service = inject(ToastService);
  readonly noPlayer = input(false);
}
