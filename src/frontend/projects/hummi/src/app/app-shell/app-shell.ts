import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthState } from '@hummi/api';
import { LogoComponent } from '@hummi/components';

/** App shell: header with the brand and the signed-in user, main#main with the router outlet, and a footer. */
@Component({
  selector: 'hm-app-shell',
  imports: [RouterOutlet, RouterLink, LogoComponent],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  readonly auth = inject(AuthState);

  constructor() {
    void this.auth.load();
  }
}
