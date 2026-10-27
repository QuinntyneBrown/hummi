import { Routes } from '@angular/router';

/** Lazy routes of the player feature library, mounted at the root of the app. */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Hummi',
    loadComponent: () => import('./home/home').then((m) => m.HomeComponent),
  },
];
