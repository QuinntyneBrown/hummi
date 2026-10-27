import { Routes } from '@angular/router';

/** Lazy routes of the library feature library, mounted at the root of the app. */
export const routes: Routes = [
  {
    path: 'library',
    title: 'Library · Hummi',
    loadComponent: () => import('./library/library').then((m) => m.LibraryComponent),
  },
];
