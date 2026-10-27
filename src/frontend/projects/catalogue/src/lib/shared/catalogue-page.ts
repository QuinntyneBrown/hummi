import { ChangeDetectionStrategy, Component, Signal, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiResource, ResourceState, apiResource } from '@hummi/api';
import { ButtonDirective, ErrorPageComponent, NOT_FOUND } from '@hummi/components';
import { Observable, map } from 'rxjs';

/**
 * Loads a catalogue page's data for the route's :slug, again whenever the slug changes, and names the
 * browser tab "{name} · Hummi" once it has loaded. Call it in an injection context.
 */
export function slugResource<T>(load: (slug: string) => Observable<T>, name: (value: T) => string): ApiResource<T> {
  const slug: Signal<string> = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('slug') ?? '')), {
    initialValue: '',
  });
  const resource = apiResource(() => load(untracked(slug)));
  const title = inject(Title);
  let first = true;
  effect(() => {
    slug();
    if (first) first = false;
    else untracked(() => resource.reload());
  });
  effect(() => {
    const state = resource.state();
    if (state.status === 'ready') title.setTitle(`${name(state.value)} · Hummi`);
  });
  return resource;
}

/** The API said the slug matches nothing, so the page shows Not found (L2-044). */
export function isNotFound(state: ResourceState<unknown>): boolean {
  return state.status === 'error' && state.problem.status === 404;
}

/** The Not found page (L2-044) in place of a track, artist or album that does not exist. */
@Component({
  selector: 'hm-catalogue-not-found',
  imports: [RouterLink, ButtonDirective, ErrorPageComponent],
  template: `
    <hm-error-page [code]="copy.code" [heading]="copy.heading" [text]="copy.text">
      <a hmButton="primary" routerLink="/">Go to Home</a>
      <a hmButton routerLink="/search">Search Hummi</a>
    </hm-error-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogueNotFoundComponent {
  protected readonly copy = NOT_FOUND;
}
