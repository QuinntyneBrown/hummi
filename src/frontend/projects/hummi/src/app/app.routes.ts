import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Hummi',
    loadComponent: () => import('./home/home').then((m) => m.HomeComponent),
  },
  {
    path: '**',
    title: 'Page not found',
    loadComponent: () => import('./not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
