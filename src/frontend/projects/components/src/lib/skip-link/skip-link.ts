import { ChangeDetectionStrategy, Component } from '@angular/core';

/** First focusable element of every page; jumps to main#main. */
@Component({
  selector: 'hm-skip-link',
  template: '<a class="skip-link" href="#main">Skip to content</a>',
  styles: `
    .skip-link {
      position: absolute;
      left: var(--space-3);
      top: -4rem;
      padding: var(--space-2) var(--space-3);
      background: var(--color-surface);
      border-radius: var(--radius-md);
      z-index: 10;
    }
    .skip-link:focus {
      top: var(--space-3);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkipLinkComponent {}
