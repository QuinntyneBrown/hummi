import { ChangeDetectionStrategy, Component, ElementRef, inject, output } from '@angular/core';

import { IconComponent } from '../icon/icon';

/**
 * The header search field "Search songs and artists" with the "/" key hint; from 48rem the pill shows,
 * below it an icon button. Both emit activate, which opens the search layer.
 */
@Component({
  selector: 'hm-search-pill',
  imports: [IconComponent],
  template: `
    <button class="search-pill" type="button" aria-label="Search songs and artists" (click)="activate.emit()">
      <hm-icon name="search" /><span>Search songs and artists</span><kbd aria-hidden="true">/</kbd>
    </button>
    <button class="ibtn search-icon" type="button" aria-label="Search songs and artists" (click)="activate.emit()">
      <hm-icon name="search" />
    </button>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPillComponent {
  readonly activate = output<void>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Focuses whichever of the pill and the icon button is shown, for example when the layer closes. */
  focus(): void {
    const buttons = [...this.host.nativeElement.querySelectorAll('button')];
    buttons.find((button) => button.offsetParent !== null)?.focus();
  }
}
