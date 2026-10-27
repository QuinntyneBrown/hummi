import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';

import { IconComponent } from '../icon/icon';

/**
 * The account menu under the header avatar (L2-052): the avatar initial, display name and email, any
 * projected `.mi` items, then Sign out below a divider. The first item takes focus; ↑ and ↓ move between
 * items; Escape and the scrim emit dismiss. Sign out emits signOut; the host opens the dialog.
 */
@Component({
  selector: 'hm-account-menu',
  imports: [IconComponent],
  template: `
    <div class="menu-scrim" aria-hidden="true"></div>
    <div #panel class="menu-panel menu-panel--account" role="menu" aria-label="Account">
      <div class="menu-id">
        <span class="avatar" aria-hidden="true">{{ initial() }}</span>
        <div>
          <strong>{{ name() }}</strong>
          <small>{{ email() }}</small>
        </div>
      </div>
      <ng-content />
      <hr class="menu-divider" />
      <button class="mi" role="menuitem" type="button" (click)="signOut.emit()">
        <hm-icon name="logout" />Sign out
      </button>
    </div>
  `,
  host: { '(click)': 'scrimClick($event)', '(keydown)': 'keydown($event)' },
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountMenuComponent {
  readonly name = input.required<string>();
  readonly email = input.required<string>();
  readonly signOut = output<void>();
  readonly dismiss = output<void>();
  protected readonly initial = computed(() => this.name().charAt(0).toUpperCase());
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  constructor() {
    afterNextRender(() => this.items()[0]?.focus());
  }

  protected scrimClick(event: MouseEvent): void {
    if (event.target instanceof HTMLElement && event.target.classList.contains('menu-scrim')) this.dismiss.emit();
  }

  protected keydown(event: KeyboardEvent): void {
    const items = this.items();
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      items[(index + step + items.length) % items.length]?.focus();
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault();
      event.stopPropagation();
      this.dismiss.emit();
    }
  }

  private items(): HTMLElement[] {
    return Array.from(this.panel().nativeElement.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  }
}
