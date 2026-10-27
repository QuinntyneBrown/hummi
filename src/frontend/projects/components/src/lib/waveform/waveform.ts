import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Bars drawn when a track has no peaks yet, so the waveform keeps its shape. */
const FLAT = Array.from({ length: 64 }, () => 50);

/**
 * A track's precomputed amplitude peaks (0 to 100) drawn as bars; bars up to the played proportion
 * (0 to 1) take the accent colour. Announced as one image, for example "Waveform, 33% played".
 */
@Component({
  selector: 'hm-waveform',
  template: `
    <div class="wave" role="img" [attr.aria-label]="label()">
      @for (peak of bars(); track $index) {
        <span [class.is-played]="$index < playedBars()" [style.height.%]="peak"></span>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaveformComponent {
  readonly peaks = input<readonly number[]>([]);
  readonly played = input(0);

  protected readonly bars = computed(() => (this.peaks().length ? this.peaks() : FLAT));
  private readonly proportion = computed(() => Math.min(1, Math.max(0, this.played())));
  protected readonly playedBars = computed(() => Math.round(this.bars().length * this.proportion()));
  protected readonly label = computed(() => {
    const percent = Math.round(this.proportion() * 100);
    return percent > 0 ? `Waveform, ${percent}% played` : 'Waveform, not played';
  });
}
