import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Home's featured album (L2-001 AC1, AC2; docs/design-system/components/billboard.html): kicker, the page's
 * h1, the artist, blurb, meta line and the projected actions, beside the artwork with its "Opens with" chip
 * naming the lead track.
 */
@Component({
  selector: 'hm-billboard',
  imports: [RouterLink],
  host: { class: 'billboard', role: 'region', 'aria-label': 'Featured' },
  template: `
    <div class="billboard__text">
      <p class="billboard__kicker">{{ kicker() }}</p>
      <h1 class="billboard__title">{{ heading() }}</h1>
      <p class="billboard__artist">
        @if (artistLink(); as link) {
          <a [routerLink]="link">{{ artist() }}</a>
        } @else {
          {{ artist() }}
        }
      </p>
      <p class="billboard__blurb">{{ blurb() }}</p>
      <p class="billboard__meta">{{ meta() }}</p>
      <div class="billboard__actions"><ng-content /></div>
    </div>
    <div class="billboard__media">
      @if (coverUrl(); as url) {
        <img [src]="url" alt="" />
      }
      <div class="billboard__chip">
        @if (leadCoverUrl(); as lead) {
          <img [src]="lead" alt="" />
        }
        <div>
          <small>Opens with</small><strong>{{ leadTitle() }}</strong>
        </div>
      </div>
    </div>
  `,
  styles: ':host { display: grid; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillboardComponent {
  readonly kicker = input.required<string>();
  readonly heading = input.required<string>();
  readonly artist = input.required<string>();
  readonly artistLink = input<string | null>(null);
  readonly blurb = input('');
  readonly meta = input('');
  readonly coverUrl = input<string | null>(null);
  readonly leadTitle = input.required<string>();
  readonly leadCoverUrl = input<string | null>(null);
}
