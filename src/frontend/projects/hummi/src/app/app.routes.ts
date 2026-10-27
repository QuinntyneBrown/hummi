import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('@hummi/player').then((m) => m.routes),
  },
  {
    path: '',
    loadChildren: () => import('@hummi/discovery').then((m) => m.routes),
  },
  {
    path: '',
    loadChildren: () => import('@hummi/catalogue').then((m) => m.routes),
  },
  {
    path: '',
    loadChildren: () => import('@hummi/search').then((m) => m.routes),
  },
  {
    path: '',
    loadChildren: () => import('@hummi/accounts').then((m) => m.routes),
  },
  {
    path: '',
    loadChildren: () => import('@hummi/library').then((m) => m.routes),
  },
  {
    path: '',
    loadChildren: () => import('@hummi/sharing').then((m) => m.routes),
  },
  {
    path: '**',
    title: 'Page not found',
    data: { hidePlayer: true },
    loadComponent: () => import('./not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
