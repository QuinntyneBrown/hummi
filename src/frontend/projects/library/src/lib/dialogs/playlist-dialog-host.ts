import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PlaylistDialogs } from '@hummi/api';

import { AddToPlaylistDialogComponent } from './add-to-playlist-dialog';
import { PlaylistFormDialogComponent } from './playlist-form-dialog';

/** The shell's Add to playlist and New playlist dialogs for PlaylistDialogs.open() (L2-020, L2-021). */
@Component({
  selector: 'hm-playlist-dialog-host',
  imports: [AddToPlaylistDialogComponent, PlaylistFormDialogComponent],
  template: `
    @if (dialogs.open(); as dialog) {
      @if (dialog.kind === 'add') {
        <hm-add-to-playlist-dialog [tracks]="dialog.tracks" [append]="dialog.append" />
      } @else {
        <hm-playlist-form-dialog [tracks]="dialog.tracks" />
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaylistDialogHostComponent {
  readonly dialogs = inject(PlaylistDialogs);
}
