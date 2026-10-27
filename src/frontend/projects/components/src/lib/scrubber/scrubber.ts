import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { formatDuration } from '../track/track-item';

/**
 * The "Track position" scrubber: elapsed time, the rail with its fill and thumb, and total time. full is
 * the larger Now playing size. It shows position; seeking arrives with a later journey.
 */
@Component({
  selector: 'hm-scrubber',
  template: `
    <div class="scrubber" [class.scrubber--full]="full()">
      <time>{{ elapsed() }}</time>
      <div
        class="scrubber__track"
        role="progressbar"
        aria-label="Track position"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-valuenow]="percent()"
        [attr.aria-valuetext]="elapsed() + ' of ' + total()"
      >
        <div class="scrubber__fill" [style.width.%]="percent()"></div>
        <div class="scrubber__thumb" [style.left.%]="percent()"></div>
      </div>
      <time>{{ total() }}</time>
    </div>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrubberComponent {
  /** Elapsed seconds. */
  readonly position = input(0);
  /** Total seconds. */
  readonly duration = input(0);
  readonly full = input(false);

  protected readonly elapsed = computed(() => formatDuration(this.position()));
  protected readonly total = computed(() => formatDuration(this.duration()));
  protected readonly percent = computed(() =>
    this.duration() ? Math.min(100, Math.round((this.position() / this.duration()) * 100)) : 0,
  );
}
