import { Routes } from '@angular/router';

/** Lazy routes of the sharing feature library, mounted at the root of the app. */
export const routes: Routes = [
  {
    path: 's/:code',
    title: 'Shared with you · Hummi',
    loadComponent: () => import('./shared-link/shared-link').then((m) => m.SharedLinkComponent),
  },
];
