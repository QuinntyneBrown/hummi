import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PreloadAllModules, provideRouter, withComponentInputBinding, withPreloading } from '@angular/router';
import { ServerErrorHandler, provideApi } from '@hummi/api';

import { environment } from '../environments/environment';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Every lazy page loads in the background after start, so pages open offline from the running app (L2-043, ADR 0020).
    provideRouter(routes, withComponentInputBinding(), withPreloading(PreloadAllModules)),
    provideApi(environment.apiBaseUrl),
    // A page that cannot render shows Server error and is recorded (L2-046).
    { provide: ErrorHandler, useClass: ServerErrorHandler },
  ],
};
