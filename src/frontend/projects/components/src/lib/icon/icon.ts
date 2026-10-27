import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** SVG paths of the design-system icon set (24 by 24, stroked), copied from docs/mocks/_build/kit.py. */
const PATHS = {
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  skip: '<path d="M6 5v14M18 5 9 12l9 7z"/>',
  heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  share: '<path d="M12 15V3m0 0L8 7m4-4 4 4M5 12v8h14v-8"/>',
  queue: '<path d="M4 6h12M4 11h12M4 16h7M17 14v6l5-3z"/>',
  volume: '<path d="M4 9v6h4l5 4V5L8 9zM17 9a4 4 0 0 1 0 6"/>',
  expand: '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  music: '<path d="M9 18V6l11-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM20 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z"/>',
  alert: '<path d="M12 4 2.5 20h19zM12 10v4M12 17v.5"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2 5.3M20 4v7h-7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  home: '<path d="M3 12 12 3l9 9M5 10v10h14V10"/>',
} as const;

export type IconName = keyof typeof PATHS;

/** A decorative design-system icon. Give the enclosing control its accessible name. */
@Component({
  selector: 'hm-icon',
  template: `<svg
    class="icon"
    [class.icon--sm]="size() === 'sm'"
    [class.icon--lg]="size() === 'lg'"
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 24 24"
    [attr.fill]="fill() ? 'currentColor' : null"
    [innerHTML]="paths()"
  ></svg>`,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  private readonly sanitizer = inject(DomSanitizer);
  readonly name = input.required<IconName>();
  readonly fill = input(false);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** The paths are compile-time constants from PATHS, never user input. */
  protected readonly paths = computed(() => this.sanitizer.bypassSecurityTrustHtml(PATHS[this.name()]));
}
