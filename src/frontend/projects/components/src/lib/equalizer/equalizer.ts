import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The three-bar equaliser that marks the playing track, announced as "Playing". */
@Component({
  selector: 'hm-equalizer',
  template: `<span class="eq" [class.eq--live]="live()" role="img" aria-label="Playing"
    ><span></span><span></span><span></span
  ></span>`,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EqualizerComponent {
  /** Animates the bars; false shows them still, for example while paused. */
  readonly live = input(true);
}
