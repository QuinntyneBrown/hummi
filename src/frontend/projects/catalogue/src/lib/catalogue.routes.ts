import { Routes } from '@angular/router';

/** Lazy routes of the catalogue feature library, mounted at the root of the app. */
export const routes: Routes = [
  {
    path: 'tracks/:slug',
    title: 'Track · Hummi',
    loadComponent: () => import('./track/track').then((m) => m.TrackComponent),
  },
  {
    path: 'tracks/:slug/licence',
    title: 'Licence and credit · Hummi',
    loadComponent: () => import('./licence/licence').then((m) => m.LicenceComponent),
  },
  {
    path: 'artists/:slug',
    title: 'Artist · Hummi',
    loadComponent: () => import('./artist/artist').then((m) => m.ArtistComponent),
  },
  {
    path: 'albums/:slug',
    title: 'Album · Hummi',
    loadComponent: () => import('./album/album').then((m) => m.AlbumComponent),
  },
];
