import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { ServerErrorHandler, provideApi } from '@hummi/api';

import { environment } from '../environments/environment';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideApi(environment.apiBaseUrl),
    // A page that cannot render shows Server error and is recorded (L2-046).
    { provide: ErrorHandler, useClass: ServerErrorHandler },
  ],
};
