import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  model,
  output,
  viewChild,
} from '@angular/core';

import { IconComponent } from '../icon/icon';

/**
 * The search layer: a scrim and a dialog "Search" that drops in from the top, with the query field
 * (focused on open), "Clear" once text is typed and "Close". Escape and Close emit dismiss; Enter emits
 * submitQuery. The results, empty and error states are projected below the bar.
 */
@Component({
  selector: 'hm-search-layer',
  imports: [IconComponent],
  template: `
    <div class="scrim" aria-hidden="true"></div>
    <div class="layer-search" role="dialog" aria-modal="true" aria-label="Search" (keydown.escape)="dismiss.emit()">
      <div class="layer-search__bar">
        <hm-icon name="search" />
        <input
          #field
          class="layer-search__input"
          type="search"
          placeholder="Search songs and artists"
          aria-label="Search songs and artists"
          autocomplete="off"
          [value]="query()"
          (input)="query.set(field.value)"
          (keydown.enter)="submitQuery.emit()"
        />
        @if (query()) {
          <button class="layer-search__clear" type="button" (click)="clear()">Clear</button>
        }
        <button class="layer-search__close" type="button" aria-label="Close search" (click)="dismiss.emit()">
          <hm-icon name="close" />
        </button>
      </div>
      <ng-content />
    </div>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchLayerComponent {
  readonly query = model('');
  readonly dismiss = output<void>();
  readonly submitQuery = output<void>();
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  constructor() {
    afterNextRender(() => this.focus());
  }

  /** Moves focus to the query field. */
  focus(): void {
    this.field().nativeElement.focus();
  }

  protected clear(): void {
    this.query.set('');
    this.focus();
  }
}
