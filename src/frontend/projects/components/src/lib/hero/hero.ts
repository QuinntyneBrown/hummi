import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { IconComponent, IconName } from '../icon/icon';

/**
 * The lead block of a catalogue page: artwork (round for an artist) beside a stack of projected
 * content such as the overline, a description, the actions and the waveform.
 */
@Component({
  selector: 'hm-hero',
  imports: [IconComponent],
  template: `
    <section class="hero" [attr.aria-label]="label()">
      <div class="cover cover--c1" [class.round]="round()" [class.cover--art]="!!coverUrl()" aria-hidden="true">
        @if (coverUrl(); as url) {
          <img [src]="url" alt="" />
        }
        <hm-icon [name]="icon()" />
      </div>
      <div class="stack"><ng-content /></div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  readonly label = input.required<string>();
  readonly coverUrl = input<string | null>(null);
  readonly round = input(false);
  readonly icon = input<IconName>('music');
}
