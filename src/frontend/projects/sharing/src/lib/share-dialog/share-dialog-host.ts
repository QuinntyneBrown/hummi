import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ShareDialogs } from '@hummi/api';

import { ShareDialogComponent } from './share-dialog';

/** The shell's Share dialog for ShareDialogs.open() (L2-025). */
@Component({
  selector: 'hm-share-dialog-host',
  imports: [ShareDialogComponent],
  template: `
    @if (dialogs.open(); as subject) {
      <hm-share-dialog [subject]="subject" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareDialogHostComponent {
  readonly dialogs = inject(ShareDialogs);
}
