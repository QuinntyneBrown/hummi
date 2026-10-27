import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  NotificationDto,
  NotificationsApi,
  NotificationsDto,
  SessionStore,
  UnreadStore,
  apiResource,
} from '@hummi/api';
import {
  ButtonDirective,
  EmptyStateComponent,
  ErrorBlockComponent,
  IconName,
  NotificationItemComponent,
  PageHeaderComponent,
  SkeletonComponent,
} from '@hummi/components';

const ICONS: Record<string, IconName> = { release: 'note', share: 'share', milestone: 'trend', product: 'info' };

/**
 * "2 hours ago", "Yesterday" or "Sat 24 Oct" (L2-036 AC1): minutes and hours today, Yesterday, then the
 * date, with the year once it is not this year.
 */
export function relativeTime(iso: string, now = new Date()): string {
  const then = new Date(iso);
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (then.getTime() >= startOfToday) {
    const hours = Math.floor(minutes / 60);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (then.getTime() >= startOfToday - 86_400_000) return 'Yesterday';
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
  if (then.getFullYear() !== now.getFullYear()) options.year = 'numeric';
  return then.toLocaleDateString('en-GB', options).replace(',', '');
}

/**
 * Notifications (`/notifications`, L2-036, L2-037): newest first with the kind's icon, linked text, the time
 * and an Unread dot; the subtitle counts unread and Mark all as read clears them and the bell. Empty, it
 * points to Browse to find artists to follow.
 */
@Component({
  selector: 'hm-notifications',
  imports: [
    RouterLink,
    ButtonDirective,
    EmptyStateComponent,
    ErrorBlockComponent,
    NotificationItemComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './notifications.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent {
  private readonly api = inject(NotificationsApi);
  private readonly unreadStore = inject(UnreadStore);
  readonly session = inject(SessionStore);
  readonly notifications = apiResource(() => this.api.list());
  /** Set once Mark all as read succeeded, so the page reads at once without a reload. */
  private readonly cleared = signal(false);
  readonly rows = [1, 2, 3, 4];

  readonly value = computed<NotificationsDto | null>(() => {
    const state = this.notifications.state();
    if (state.status !== 'ready') return null;
    return this.cleared() ? { unread: 0, items: state.value.items.map((i) => ({ ...i, unread: false })) } : state.value;
  });

  constructor() {
    effect(() => {
      const v = this.value();
      if (v) untracked(() => this.unreadStore.set(v.unread));
    });
  }

  icon(n: NotificationDto): IconName {
    return ICONS[n.kind] ?? 'info';
  }

  time(n: NotificationDto): string {
    return relativeTime(n.createdAt);
  }

  async markAllRead(): Promise<void> {
    const result = await this.api.markAllRead();
    if (result.ok) this.cleared.set(true);
  }
}
