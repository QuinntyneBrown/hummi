import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { ReportDialogs, ReportReason, ReportSubject, ReportsApi } from '@hummi/api';
import {
  AlertComponent,
  ButtonDirective,
  DialogComponent,
  RadioGroupComponent,
  RadioOption,
  TextareaComponent,
} from '@hummi/components';

const REASONS: RadioOption[] = [
  { value: 'copied', label: 'Copied from an artist without permission' },
  { value: 'wrong-licence', label: 'Wrong licence' },
  { value: 'harmful', label: 'Harmful or hateful content' },
  { value: 'other', label: 'Something else' },
];

/**
 * Report “{title}” (L2-038): the required "What’s wrong?" choice and optional Details. Sending disables the
 * choices and Cancel and makes Details read-only; success thanks the listener; a failure keeps the answers
 * under "That didn’t work". The artist never learns who reported (AC5).
 */
@Component({
  selector: 'hm-report-track-dialog',
  imports: [AlertComponent, ButtonDirective, DialogComponent, RadioGroupComponent, TextareaComponent],
  template: `
    @if (sent()) {
      <hm-dialog
        heading="Thanks, we’ll take a look"
        description="Reports are reviewed within 2 working days. We’ll email you the outcome."
        (dismiss)="dialogs.close()"
      >
        <button footer hmButton="primary" type="button" (click)="dialogs.close()">Close</button>
      </hm-dialog>
    } @else {
      <hm-dialog
        [heading]="'Report “' + track().title + '”'"
        description="Tell us what’s wrong. The artist isn’t told who reported."
        (dismiss)="cancel()"
      >
        @if (failed()) {
          <hm-alert tone="danger" heading="That didn’t work">
            Your report wasn’t sent. Your answers are still here; try again.
          </hm-alert>
        }
        <hm-radio-group
          legend="What’s wrong?"
          name="why"
          [options]="reasons"
          [disabled]="busy()"
          [error]="reasonError()"
          [(value)]="reason"
        />
        <hm-textarea
          label="Details"
          fieldId="report-details"
          [rows]="2"
          [readonly]="busy()"
          [error]="detailsError()"
          [(value)]="details"
        />
        <button footer hmButton type="button" [disabled]="busy()" (click)="cancel()">Cancel</button>
        <button footer hmButton="primary" type="button" [busy]="busy()" [disabled]="busy()" (click)="send()">
          @if (busy()) {
            <span class="spinner" aria-hidden="true"></span>Sending…
          } @else {
            Send report
          }
        </button>
      </hm-dialog>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportTrackDialogComponent {
  private readonly api = inject(ReportsApi);
  readonly dialogs = inject(ReportDialogs);
  readonly track = input.required<ReportSubject>();
  readonly reasons = REASONS;

  readonly reason = signal('');
  readonly details = signal('');
  readonly busy = signal(false);
  readonly failed = signal(false);
  readonly sent = signal(false);
  readonly reasonError = signal('');
  readonly detailsError = signal('');

  cancel(): void {
    if (!this.busy()) this.dialogs.close();
  }

  async send(): Promise<void> {
    if (this.busy()) return;
    this.failed.set(false);
    this.reasonError.set(this.reason() ? '' : 'Choose a reason');
    this.detailsError.set(this.details().trim().length > 1000 ? 'Keep the details under 1,000 characters' : '');
    if (this.reasonError() || this.detailsError()) return;
    this.busy.set(true);
    const result = await this.api.report(this.track().id, this.reason() as ReportReason, this.details().trim());
    this.busy.set(false);
    if (result.ok) {
      this.sent.set(true);
    } else if (result.problem.status === 422) {
      this.reasonError.set(result.problem.errors['reason']?.message ?? '');
      this.detailsError.set(result.problem.errors['details']?.message ?? '');
    } else {
      this.failed.set(true);
    }
  }
}
