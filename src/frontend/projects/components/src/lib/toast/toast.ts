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
}

/** Queues toasts for hm-toast-region; each dismisses itself after TOAST_MS. */
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
    </div>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastRegionComponent {
  protected readonly service = inject(ToastService);
  readonly noPlayer = input(false);
}
