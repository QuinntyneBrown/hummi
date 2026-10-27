# @hummi/accounts

Angular feature library in the Hummi frontend workspace: creating an account and signing in and out
(L2-027 to L2-032). Its lazy route table serves `/sign-up`, `/sign-in` and `/verify-email?token=` as
bare pages (no header, footer or player bar). It also exports `SignOutDialogComponent`
(`hm-sign-out-dialog`), which the shell opens from the account menu, and `SignInPromptDialogComponent`
(`hm-sign-in-prompt-dialog`), which the shell renders while `SignInGate.promptOpen()` is true. Calls go
through `AuthApi` and `SessionStore` in `@hummi/api` (ADR 0010).
