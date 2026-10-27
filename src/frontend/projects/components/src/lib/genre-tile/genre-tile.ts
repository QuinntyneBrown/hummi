import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** A link tile for one genre on a design-system cover gradient (tone 1 to 6); opens /genres/{slug}. */
@Component({
  selector: 'hm-genre-tile',
  imports: [RouterLink],
  host: { style: 'display: contents' },
  template: `<a class="genre-tile cover--c{{ tone() }}" [routerLink]="['/genres', slug()]">{{ name() }}</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenreTileComponent {
  readonly slug = input.required<string>();
  readonly name = input.required<string>();
  readonly tone = input(1);
}
