import { InjectionToken } from '@angular/core';

/** Base URL of the Hummi API, without a trailing slash. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
