import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  input,
  output,
  viewChild,
} from '@angular/core';

import { IconComponent, IconName } from '../icon/icon';

let nextId = 0;

/**
 * A modal dialog (L2-047): backdrop, a panel labelled by its title and described by its description, a
 * Close icon button, the projected body and the projected [footer]. The panel takes focus on open and
 * Tab stays inside it; Close and Escape emit dismiss. The host makes the page behind it inert.
 */
@Component({
  selector: 'hm-dialog',
  imports: [IconComponent],
  template: `
    <div class="backdrop" aria-hidden="true"></div>
    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="id + '-title'"
      [attr.aria-describedby]="id + '-desc'"
      (keydown)="keydown($event)"
    >
      <div #panel class="dialog__panel" tabindex="-1">
        <div class="dialog__header">
          <div [class]="'dialog__icon dialog__icon--' + tone()" aria-hidden="true">
            <hm-icon [name]="icon()" />
          </div>
          <div style="flex: 1">
            <h2 class="dialog__title" [id]="id + '-title'">{{ heading() }}</h2>
            <p class="text-muted" style="margin-top: var(--space-1)" [id]="id + '-desc'">{{ description() }}</p>
          </div>
          <button class="btn btn--ghost btn--icon" type="button" aria-label="Close" (click)="dismiss.emit()">
            <hm-icon name="close" />
          </button>
        </div>
        <div class="dialog__body stack"><ng-content /></div>
        <div class="dialog__footer"><ng-content select="[footer]" /></div>
      </div>
    </div>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogComponent {
  readonly heading = input.required<string>();
  readonly description = input('');
  readonly icon = input<IconName>('info');
  readonly tone = input<'info' | 'danger'>('info');
  readonly dismiss = output<void>();

  protected readonly id = `hm-dialog-${nextId++}`;
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  constructor() {
    afterNextRender(() => this.panel().nativeElement.focus());
  }

  protected keydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.dismiss.emit();
    } else if (event.key === 'Tab') {
      this.trapTab(event);
    }
  }

  /** Keeps Tab and Shift+Tab cycling through the panel's focusable elements. */
  private trapTab(event: KeyboardEvent): void {
    const focusable = Array.from(
      this.panel().nativeElement.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input, select, textarea',
      ),
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === this.panel().nativeElement)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
