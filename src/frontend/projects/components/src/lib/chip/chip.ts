import { Directive, input } from '@angular/core';

/**
 * Styles a native button or link as a design-system chip. On a toggle button, pass pressed so the
 * chip carries aria-pressed; leave it null on a link chip, which navigates instead.
 */
@Directive({
  selector: '[hmChip]',
  host: { class: 'chip', '[attr.aria-pressed]': 'pressed()' },
})
export class ChipDirective {
  readonly pressed = input<boolean | null>(null);
}
