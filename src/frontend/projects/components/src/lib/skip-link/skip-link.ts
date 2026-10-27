import { ChangeDetectionStrategy, Component } from '@angular/core';

/** First focusable element of every page; jumps to main#main. */
@Component({
  selector: 'hm-skip-link',
  template: '<a class="skip-link" href="#main">Skip to content</a>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkipLinkComponent {}
