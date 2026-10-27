import { Routes } from '@angular/router';

/** Lazy routes of the discovery feature library, mounted at the root of the app. */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Hummi',
    loadComponent: () => import('./home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'browse',
    title: 'Browse · Hummi',
    loadComponent: () => import('./browse/browse').then((m) => m.BrowseComponent),
  },
  {
    path: 'genres/:slug',
    title: 'Genre · Hummi',
    loadComponent: () => import('./genre/genre').then((m) => m.GenreComponent),
  },
];
