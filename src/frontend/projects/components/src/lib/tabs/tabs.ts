import { ChangeDetectionStrategy, Component, ElementRef, input, model, viewChildren } from '@angular/core';

/**
 * A tab list over one panel (`.tabs`, docs/design-system/components/tabs.html). Only the selected tab
 * is in the tab order; Left and Right arrows, Home and End move the selection. The projected content is
 * the selected tab's panel.
 */
@Component({
  selector: 'hm-tabs',
  template: `
    <div class="tabs" role="tablist" [attr.aria-label]="label()">
      @for (tab of tabs(); track tab; let i = $index) {
        <button
          #tabButton
          class="tab"
          role="tab"
          type="button"
          [id]="idPrefix() + '-tab-' + i"
          [attr.aria-selected]="tab === selected()"
          [attr.aria-controls]="idPrefix() + '-panel'"
          [attr.tabindex]="tab === selected() ? null : -1"
          (click)="selected.set(tab)"
          (keydown)="key($event, i)"
        >
          {{ tab }}
        </button>
      }
    </div>
    <div
      role="tabpanel"
      [id]="idPrefix() + '-panel'"
      [attr.aria-labelledby]="idPrefix() + '-tab-' + tabs().indexOf(selected())"
      style="margin-top: var(--space-4)"
    >
      <ng-content />
    </div>
  `,
  styles: ':host { display: block; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent {
  readonly tabs = input.required<readonly string[]>();
  readonly label = input.required<string>();
  readonly idPrefix = input('tabs');
  readonly selected = model.required<string>();
  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  key(event: KeyboardEvent, index: number): void {
    const count = this.tabs().length;
    const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: count - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const target = (next + count) % count;
    this.selected.set(this.tabs()[target]);
    this.buttons()[target]?.nativeElement.focus();
  }
}
