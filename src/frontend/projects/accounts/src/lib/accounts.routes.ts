import { Routes } from '@angular/router';

/**
 * Lazy routes of the accounts feature library, mounted at the root of the app. The auth pages render the
 * centred card without the header, footer or player bar (data.bare, ADR 0010).
 */
export const routes: Routes = [
  {
    path: 'sign-up',
    title: 'Sign up · Hummi',
    data: { bare: true, hidePlayer: true },
    loadComponent: () => import('./sign-up/sign-up').then((m) => m.SignUpComponent),
  },
  {
    path: 'sign-in',
    title: 'Sign in · Hummi',
    data: { bare: true, hidePlayer: true },
    loadComponent: () => import('./sign-in/sign-in').then((m) => m.SignInComponent),
  },
  {
    path: 'verify-email',
    title: 'Confirm your email · Hummi',
    data: { bare: true, hidePlayer: true },
    loadComponent: () => import('./verify-email/verify-email').then((m) => m.VerifyEmailComponent),
  },
  {
    path: 'reset-password',
    title: 'Reset your password · Hummi',
    data: { bare: true, hidePlayer: true },
    loadComponent: () => import('./reset-password/reset-password').then((m) => m.ResetPasswordComponent),
  },
  {
    path: 'new-password',
    title: 'Choose a new password · Hummi',
    data: { bare: true, hidePlayer: true },
    loadComponent: () => import('./new-password/new-password').then((m) => m.NewPasswordComponent),
  },
];
