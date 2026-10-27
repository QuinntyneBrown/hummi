# @hummi/api

Angular library in the Hummi frontend workspace and the only code that calls the Hummi API: base URL, typed
results, `SessionStore`, the session interceptor, `AuthApi` (sign up, verify and resend) and `SignInGate`
(the Sign in to save this check every save action calls, ADR 0010), `apiResource` (loading, ready and error states with
`reload()` and a 15-second timeout), `PlaybackApi` and `PlayerStore`, the one audio player of the app.
