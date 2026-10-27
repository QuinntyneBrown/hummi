import { Directive, input } from '@angular/core';

/**
 * Styles a native button or link as a Hummi button. Variants primary, secondary (default), ghost
 * and danger; block fills the row; busy sets aria-busy and keeps the accessible name.
 */
@Directive({
  selector: '[hmButton]',
  host: {
    class: 'btn',
    '[class.btn--primary]': "hmButton() === 'primary'",
    '[class.btn--ghost]': "hmButton() === 'ghost'",
    '[class.btn--danger]': "hmButton() === 'danger'",
    '[class.btn--block]': 'block()',
    '[attr.aria-busy]': "busy() ? 'true' : null",
  },
})
export class ButtonDirective {
  readonly hmButton = input<'' | 'primary' | 'ghost' | 'danger'>('');
  readonly block = input(false);
  readonly busy = input(false);
}
