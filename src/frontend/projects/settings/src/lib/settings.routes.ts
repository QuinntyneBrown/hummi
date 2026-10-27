import { Routes } from '@angular/router';

/** Lazy routes of the settings feature library, mounted at the root of the app. */
export const routes: Routes = [
  {
    path: 'settings',
    title: 'Settings · Hummi',
    loadComponent: () => import('./settings/settings').then((m) => m.SettingsComponent),
  },
];
