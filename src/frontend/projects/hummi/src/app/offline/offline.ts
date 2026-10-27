import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ConnectivityService, OfflineCache } from '@hummi/api';
import { ButtonDirective, ErrorPageComponent } from '@hummi/components';

/**
 * Offline (L2-043 AC3): stands in for a page that has no saved copy while the device is offline, keeping its
 * address. Retry opens that page again; Open saved tracks lists what plays without a connection.
 */
@Component({
  selector: 'hm-offline',
  imports: [RouterLink, ButtonDirective, ErrorPageComponent],
  template: `
    <hm-error-page
      code="Offline"
      icon="alert"
      heading="You’re offline"
      text="Hummi can’t reach the network. Tracks you saved on this device still play; everything else will load when you’re back."
    >
      <button hmButton="primary" type="button" (click)="retry()">Retry</button>
      <a hmButton routerLink="/saved">Open saved tracks</a>
    </hm-error-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineComponent {
  private readonly router = inject(Router);
  private readonly cache = inject(OfflineCache);
  readonly online = inject(ConnectivityService).online;

  retry(): void {
    void this.router.navigateByUrl(this.cache.missedUrl() ?? '/');
  }
}
