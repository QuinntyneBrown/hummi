import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { PlaylistDialogs, PlaylistTrack, PlaylistsApi } from '@hummi/api';
import {
  AlertComponent,
  ButtonDirective,
  CheckboxComponent,
  DialogComponent,
  TextFieldComponent,
  ToastService,
} from '@hummi/components';

const MAX_NAME = 60;

/** The playlist being renamed. */
export interface RenameTarget {
  id: string;
  name: string;
  isPublic: boolean;
}

/**
 * New playlist and Rename playlist (L2-021): "Playlist name" (up to 60 characters) and Make it public.
 * The name is checked here as the server checks it. Saving makes the name read-only and disables the
 * option and Cancel; a failure shows "That didn’t work" and keeps the typed name. Opened from Add to
 * playlist, the new playlist holds those tracks.
 */
@Component({
  selector: 'hm-playlist-form-dialog',
  imports: [AlertComponent, ButtonDirective, CheckboxComponent, DialogComponent, TextFieldComponent],
  template: `
    <hm-dialog
      [heading]="rename() ? 'Rename playlist' : 'New playlist'"
      [description]="rename() ? 'Choose a new name for this playlist.' : 'Playlists are private until you share them.'"
      (dismiss)="cancel()"
    >
      @if (failed()) {
        <hm-alert tone="danger" heading="That didn’t work">
          The playlist wasn’t saved. Your name is still here; try again.
        </hm-alert>
      }
      <form class="stack" novalidate (submit)="save($event)" id="playlist-form">
        <hm-text-field
          label="Playlist name"
          fieldId="pl-name"
          help="Up to 60 characters"
          [required]="true"
          [readonly]="busy()"
          [error]="error()"
          [(value)]="name"
        />
        <hm-checkbox
          label="Make it public"
          fieldId="pl-public"
          hint="Anyone can find and listen to it. You can change this later."
          [disabled]="busy()"
          [(checked)]="isPublic"
        />
      </form>
      <button footer hmButton type="button" [disabled]="busy()" (click)="cancel()">Cancel</button>
      <button footer hmButton="primary" type="submit" form="playlist-form" [busy]="busy()" [disabled]="busy()">
        @if (busy()) {
          <span class="spinner" aria-hidden="true"></span>Saving…
        } @else {
          {{ rename() ? 'Save name' : 'Create playlist' }}
        }
      </button>
    </hm-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaylistFormDialogComponent implements OnInit {
  private readonly api = inject(PlaylistsApi);
  private readonly dialogs = inject(PlaylistDialogs);
  private readonly toasts = inject(ToastService);
  /** Tracks the new playlist starts with. */
  readonly tracks = input<PlaylistTrack[]>([]);
  /** Set to rename instead of create. */
  readonly rename = input<RenameTarget | null>(null);
  readonly closed = output<'saved' | 'cancelled'>();

  readonly name = signal('');
  readonly isPublic = signal(false);
  readonly busy = signal(false);
  readonly failed = signal(false);
  readonly error = signal('');
  readonly trimmed = computed(() => this.name().trim());

  ngOnInit(): void {
    const target = this.rename();
    if (target) {
      this.name.set(target.name);
      this.isPublic.set(target.isPublic);
    }
  }

  cancel(): void {
    if (this.busy()) return;
    this.closed.emit('cancelled');
    if (!this.rename()) this.dialogs.close();
  }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy()) return;
    const name = this.trimmed();
    this.error.set(!name ? 'Give your playlist a name' : name.length > MAX_NAME ? 'Use up to 60 characters' : '');
    if (this.error()) return;
    this.busy.set(true);
    this.failed.set(false);
    const target = this.rename();
    const tracks = this.tracks();
    const result = target
      ? await this.api.update(target.id, name, this.isPublic())
      : await this.api.create(
          name,
          this.isPublic(),
          tracks.map((t) => t.id),
        );
    this.busy.set(false);
    if (!result.ok) {
      if (result.problem.status === 422) this.error.set(result.problem.errors['name']?.message ?? '');
      else this.failed.set(true);
      return;
    }
    this.dialogs.changed();
    if (!target && tracks.length) {
      this.toasts.showCard({
        tone: 'success',
        title: `Added to ${name}`,
        text: tracks.length === 1 ? `“${tracks[0].title}” is now track 1.` : `${tracks.length} tracks added.`,
      });
    } else if (!target) {
      this.toasts.show(`Created “${name}”`);
    }
    this.closed.emit('saved');
    if (!target) this.dialogs.close();
  }
}
