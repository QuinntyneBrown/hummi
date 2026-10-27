import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReportDialogs } from '@hummi/api';

import { ReportTrackDialogComponent } from './report-track-dialog';

/** The shell's Report dialog for ReportDialogs.open() (L2-038). */
@Component({
  selector: 'hm-report-dialog-host',
  imports: [ReportTrackDialogComponent],
  template: `
    @if (dialogs.open(); as track) {
      <hm-report-track-dialog [track]="track" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportDialogHostComponent {
  readonly dialogs = inject(ReportDialogs);
}
