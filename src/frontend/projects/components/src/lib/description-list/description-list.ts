import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** One term and its value; with link, the value links there inside the app. */
export interface DescriptionItem {
  term: string;
  value: string;
  link?: string;
}

/** Term and value pairs in two columns, for example a track's Details. */
@Component({
  selector: 'hm-description-list',
  imports: [RouterLink],
  template: `
    <dl class="dl">
      @for (item of items(); track item.term) {
        <dt>{{ item.term }}</dt>
        <dd>
          @if (item.link; as link) {
            <a [routerLink]="link">{{ item.value }}</a>
          } @else {
            {{ item.value }}
          }
        </dd>
      }
    </dl>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptionListComponent {
  readonly items = input.required<readonly DescriptionItem[]>();
}
