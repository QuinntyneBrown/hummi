import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * One placeholder shape. Put skeletons inside a region with aria-busy="true" that stands for the
 * content still loading; the shapes themselves are hidden from assistive technology.
 */
@Component({
  selector: 'hm-skeleton',
  template: '',
  host: {
    class: 'skeleton',
    '[class.skeleton--text]': "shape() === 'text'",
    '[class.skeleton--title]': "shape() === 'title'",
    '[class.skeleton--rect]': "shape() === 'rect'",
    '[class.skeleton--circle]': "shape() === 'circle'",
    '[class.skeleton--card]': "shape() === 'card'",
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    'aria-hidden': 'true',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  readonly shape = input<'text' | 'title' | 'rect' | 'circle' | 'card'>('text');
  readonly width = input<string | null>(null);
  readonly height = input<string | null>(null);
}
