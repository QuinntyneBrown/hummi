import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The Hummi mark, inlined from docs/design-system/assets. `wordmark` is the full "hummi"
 * lettering; `icon` is the "h" glyph with the dot on its shoulder. Strokes take --color-logo
 * (coral on light, cream on dark) and the dot is always --color-brand coral. Decorative by
 * default: give the enclosing link or heading the accessible name. Size with --logo-height; the
 * width follows the aspect ratio and never shrinks in a flex row.
 */
@Component({
  selector: 'hm-logo',
  template: `
    @if (variant() === 'icon') {
      <svg class="logo logo--icon" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <path class="stroke" d="M37 22 V76 M37 57 A14 14 0 0 1 65 57 V76" />
        <circle class="dot" cx="67" cy="28" r="9.5" />
      </svg>
    } @else {
      <svg class="logo logo--wordmark" viewBox="6 6 552 168" aria-hidden="true" focusable="false">
        <g class="stroke">
          <path d="M30 30 V150 M30 106 A26 26 0 0 1 82 106 V150" />
          <path d="M128 80 V124 A26 26 0 0 0 180 124 V80 V150" />
          <path
            d="M226 150 V106 A26 26 0 0 1 278 106 V150 M278 106 A26 26 0 0 1 330 106 V124 A26 26 0 0 0 382 124 V106 A26 26 0 0 1 434 106 V150 M434 106 A26 26 0 0 1 486 106 V150"
          />
          <path d="M532 80 V150" />
        </g>
        <circle class="dot" cx="536" cy="34" r="15" />
      </svg>
    }
  `,
  styles: `
    :host {
      display: inline-block;
      flex: none;
      line-height: 0;
    }
    /* Explicit widths: an auto-width SVG in a crowded flex row shrinks to nothing and scales the
       mark down with it. */
    .logo {
      display: block;
      height: var(--logo-height, 1.5rem);
    }
    .logo--wordmark {
      width: calc(var(--logo-height, 1.5rem) * 552 / 168);
    }
    .logo--icon {
      width: var(--logo-height, 1.5rem);
    }
    .stroke {
      fill: none;
      stroke: var(--color-logo);
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .logo--wordmark .stroke {
      stroke-width: 24;
    }
    .logo--icon .stroke {
      stroke-width: 15;
    }
    .dot {
      fill: var(--color-brand);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {
  readonly variant = input<'wordmark' | 'icon'>('wordmark');
}
