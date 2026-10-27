import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { API_BASE_URL } from './api-base-url';
import { sessionInterceptor } from './auth/session-interceptor';
import { offlineInterceptor } from './offline/offline-cache';

/** Registers HttpClient with the session interceptor and the API base URL for every @hummi/api service. */
export function provideApi(baseUrl: string): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(withFetch(), withInterceptors([sessionInterceptor, offlineInterceptor])),
    { provide: API_BASE_URL, useValue: baseUrl },
  ]);
}
