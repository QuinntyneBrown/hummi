import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../icon/icon';

/** A linked tile for an album, artist or playlist: artwork, title and one line of meta. */
@Component({
  selector: 'hm-media-tile',
  imports: [RouterLink, IconComponent],
  template: `
    <a class="tile" [routerLink]="link()">
      <div class="cover cover--c3" [class.round]="round()" [class.cover--art]="!!coverUrl()" aria-hidden="true">
        @if (coverUrl(); as url) {
          <img [src]="url" alt="" loading="lazy" />
        }
        <hm-icon name="music" />
      </div>
      <div class="tile__title truncate">{{ title() }}</div>
      <div class="tile__meta truncate">{{ meta() }}</div>
    </a>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaTileComponent {
  readonly link = input.required<string>();
  readonly title = input.required<string>();
  readonly meta = input('');
  readonly coverUrl = input<string | null>(null);
  readonly round = input(false);
}
