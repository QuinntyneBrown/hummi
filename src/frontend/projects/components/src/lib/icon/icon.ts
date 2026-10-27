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
  plus: '<path d="M12 5v14M5 12h14"/>',
  flag: '<path d="M5 21V4h12l-2 4 2 4H5"/>',
  shuffle: '<path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M19 4l2 3-2 3M19 14l2 3-2 3"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"/>',
  repeat: '<path d="M4 11V9a3 3 0 0 1 3-3h13M17 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H4M7 21l-3-3 3-3"/>',
  chev: '<path d="m9 5 7 7-7 7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>',
  'list-plus': '<path d="M4 6h12M4 12h8M4 18h8M17 14v6M14 17h6"/>',
  'list-end': '<path d="M4 6h16M4 12h16M4 18h8M16 16l3 2-3 2"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>',
  keyboard:
    '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
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
