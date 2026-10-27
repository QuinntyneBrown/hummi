import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { ButtonDirective, DescriptionItem, DescriptionListComponent, DialogComponent } from '@hummi/components';

import { SHORTCUTS } from './shortcuts';

/** The "Keyboard shortcuts" dialog (L2-017 AC5): the six bindings of SHORTCUTS and Close. */
@Component({
  selector: 'hm-shortcuts-dialog',
  imports: [ButtonDirective, DescriptionListComponent, DialogComponent],
  template: `
    <hm-dialog
      heading="Keyboard shortcuts"
      description="Work while the page is focused and no text field is."
      icon="keyboard"
      (dismiss)="closed.emit()"
    >
      <hm-description-list [items]="items" [keys]="true" />
      <button footer hmButton="primary" type="button" (click)="closed.emit()">Close</button>
    </hm-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShortcutsDialogComponent {
  readonly closed = output<void>();
  readonly items: readonly DescriptionItem[] = SHORTCUTS.map((s) => ({ term: s.label, value: s.action }));
}
