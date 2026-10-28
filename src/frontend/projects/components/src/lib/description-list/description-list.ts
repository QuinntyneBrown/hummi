import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * One term and its value; with link, the value links there inside the app; with href, it links to an external
 * page that opens in a new tab (for example a track's Source on Pixabay, ADR 0021).
 */
export interface DescriptionItem {
  term: string;
  value: string;
  link?: string;
  href?: string;
}

/** Term and value pairs in two columns, for example a track's Details; with keys, terms are keys to press. */
@Component({
  selector: 'hm-description-list',
  imports: [RouterLink],
  template: `
    <dl class="dl">
      @for (item of items(); track item.term) {
        <dt>
          @if (keys()) {
            <kbd>{{ item.term }}</kbd>
          } @else {
            {{ item.term }}
          }
        </dt>
        <dd>
          @if (item.link; as link) {
            <a [routerLink]="link">{{ item.value }}</a>
          } @else if (item.href; as href) {
            <a
              [href]="href"
              target="_blank"
              rel="noopener noreferrer"
              [attr.aria-label]="item.value + ' (opens in a new tab)'"
              >{{ item.value }}</a
            >
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
  readonly keys = input(false);
}
