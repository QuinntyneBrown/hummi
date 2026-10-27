import { Directive, input } from '@angular/core';

/**
 * Styles a native button or link as a Hummi button. Variants primary, secondary (default), ghost,
 * danger and link (an inline text action); block fills the row; large is the form submit size; busy sets aria-busy and keeps the accessible name; pressed makes a
 * toggle button (aria-pressed true or false), null leaves it a plain button.
 */
@Directive({
  selector: '[hmButton]',
  host: {
    class: 'btn',
    '[class.btn--primary]': "hmButton() === 'primary'",
    '[class.btn--ghost]': "hmButton() === 'ghost'",
    '[class.btn--danger]': "hmButton() === 'danger'",
    '[class.btn--link]': "hmButton() === 'link'",
    '[class.btn--block]': 'block()',
    '[class.btn--lg]': 'large()',
    '[attr.aria-busy]': "busy() ? 'true' : null",
    '[attr.aria-pressed]': 'pressed()',
  },
})
export class ButtonDirective {
  readonly hmButton = input<'' | 'primary' | 'ghost' | 'danger' | 'link'>('');
  readonly block = input(false);
  readonly large = input(false);
  readonly busy = input(false);
  readonly pressed = input<boolean | null>(null);
}
