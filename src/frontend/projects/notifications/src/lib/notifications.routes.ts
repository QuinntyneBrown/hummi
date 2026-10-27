import { Routes } from '@angular/router';

/** Lazy routes of the notifications feature library, mounted at the root of the app. */
export const routes: Routes = [
  {
    path: 'notifications',
    title: 'Notifications · Hummi',
    loadComponent: () => import('./notifications/notifications').then((m) => m.NotificationsComponent),
  },
];
