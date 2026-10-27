import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, Routes } from '@angular/router';
import { SearchStore } from '@hummi/api';

/** /search?q= opens the search layer with that query over Home (ADR 0008). */
function openSearch(route: ActivatedRouteSnapshot) {
  inject(SearchStore).openWith(route.queryParamMap.get('q') ?? '');
  return inject(Router).createUrlTree(['/']);
}

export const routes: Routes = [{ path: 'search', canActivate: [openSearch], children: [] }];
