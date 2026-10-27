import { Routes } from '@angular/router';

export const routes: Routes = [
  // Discovery first: it owns Home at '' (ADR 0015), which the player's empty-path parent would swallow.
  {
    path: '',
    loadChildren: () => import('@hummi/discovery').then((m) => m.routes),
  },
  {
    path: '',
    loadChildren: () => import('@hummi/player').then((m) => m.routes),
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
    path: '',
    loadChildren: () => import('@hummi/settings').then((m) => m.routes),
  },
  {
    path: '',
    loadChildren: () => import('@hummi/notifications').then((m) => m.routes),
  },
  {
    path: 'offline',
    title: 'You’re offline · Hummi',
    loadComponent: () => import('./offline/offline').then((m) => m.OfflineComponent),
  },
  {
    path: 'saved',
    title: 'Saved on this device · Hummi',
    loadComponent: () => import('./offline/saved-tracks').then((m) => m.SavedTracksComponent),
  },
  {
    path: 'server-error',
    title: 'Something broke · Hummi',
    data: { hidePlayer: true },
    loadComponent: () => import('./server-error/server-error').then((m) => m.ServerErrorComponent),
  },
  {
    path: '**',
    title: 'Page not found',
    data: { hidePlayer: true },
    loadComponent: () => import('./not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
