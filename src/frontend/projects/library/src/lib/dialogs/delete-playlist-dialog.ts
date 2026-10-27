import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { PlaylistDialogs, PlaylistsApi } from '@hummi/api';
import { AlertComponent, ButtonDirective, DialogComponent, TextFieldComponent } from '@hummi/components';

/**
 * Delete “{name}”? (L2-022): Delete playlist stays disabled until the typed name matches exactly.
 * Deleting makes the field read-only and disables Cancel; a failure keeps the playlist and shows
 * "That didn’t work". The tracks stay on Hummi.
 */
@Component({
  selector: 'hm-delete-playlist-dialog',
  imports: [AlertComponent, ButtonDirective, DialogComponent, TextFieldComponent],
  template: `
    <hm-dialog
      [heading]="'Delete “' + name() + '”?'"
      description="You can’t undo this. People you shared it with lose access."
      icon="alert"
      tone="danger"
      (dismiss)="cancel()"
    >
      @if (failed()) {
        <hm-alert tone="danger" heading="That didn’t work">
          The playlist wasn’t deleted. Try again, or reload the page.
        </hm-alert>
      }
      <hm-text-field
        label="Type the playlist name to confirm"
        fieldId="del-name"
        [help]="
          'This deletes ' +
          trackCount() +
          (trackCount() === 1 ? ' track' : ' tracks') +
          ' from the playlist, not from Hummi.'
        "
        [readonly]="busy()"
        [(value)]="typed"
      />
      <button footer hmButton type="button" [disabled]="busy()" (click)="cancel()">Cancel</button>
      <button
        footer
        hmButton="danger"
        type="button"
        [busy]="busy()"
        [disabled]="busy() || !matches()"
        (click)="confirm()"
      >
        @if (busy()) {
          <span class="spinner" aria-hidden="true"></span>Deleting…
        } @else {
          Delete playlist
        }
      </button>
    </hm-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeletePlaylistDialogComponent {
  private readonly api = inject(PlaylistsApi);
  private readonly dialogs = inject(PlaylistDialogs);
  readonly playlistId = input.required<string>();
  readonly name = input.required<string>();
  readonly trackCount = input.required<number>();
  readonly closed = output<'deleted' | 'cancelled'>();

  readonly typed = signal('');
  readonly busy = signal(false);
  readonly failed = signal(false);
  readonly matches = computed(() => this.typed() === this.name());

  cancel(): void {
    if (!this.busy()) this.closed.emit('cancelled');
  }

  async confirm(): Promise<void> {
    if (!this.matches()) return;
    this.busy.set(true);
    this.failed.set(false);
    const result = await this.api.delete(this.playlistId());
    this.busy.set(false);
    if (!result.ok) {
      this.failed.set(true);
      return;
    }
    this.dialogs.changed();
    this.closed.emit('deleted');
  }
}
