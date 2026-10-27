import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { SignInGate } from '@hummi/api';
import { ButtonDirective, DialogComponent } from '@hummi/components';

/**
 * "Sign in to save this" (L2-032), rendered by the shell while SignInGate.promptOpen(): Not now closes
 * it and the listener stays on the page; Create account and Sign in open the matching page with the
 * current URL as returnUrl.
 */
@Component({
  selector: 'hm-sign-in-prompt-dialog',
  imports: [ButtonDirective, DialogComponent],
  template: `
    <hm-dialog
      heading="Sign in to save this"
      description="Likes, playlists and your queue live in your free Hummi account."
      icon="lock"
      (dismiss)="close()"
    >
      <button footer hmButton type="button" (click)="close()">Not now</button>
      <button footer hmButton type="button" (click)="go('/sign-up')">Create account</button>
      <button footer hmButton="primary" type="button" (click)="go('/sign-in')">Sign in</button>
    </hm-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInPromptDialogComponent {
  private readonly gate = inject(SignInGate);
  private readonly router = inject(Router);
  readonly closed = output<void>();

  close(): void {
    this.gate.closePrompt();
    this.closed.emit();
  }

  go(path: string): void {
    const returnUrl = this.router.url;
    this.gate.closePrompt();
    void this.router.navigate([path], { queryParams: { returnUrl } });
  }
}
