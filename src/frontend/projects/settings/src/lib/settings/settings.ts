import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccountDialogs, SessionStore, SettingsDto, SettingsStore, Theme } from '@hummi/api';
import {
  AlertComponent,
  ButtonDirective,
  EmptyStateComponent,
  ErrorBlockComponent,
  ErrorSummaryComponent,
  PageHeaderComponent,
  RadioGroupComponent,
  RadioOption,
  SkeletonComponent,
  SwitchComponent,
  TextFieldComponent,
} from '@hummi/components';

const IDS = { displayName: 'dn', email: 'em' };
const THEMES: RadioOption[] = [
  { value: 'device', label: 'Match my device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/**
 * Settings (`/settings`, L2-033 to L2-035, L2-049): Profile, Playback, Appearance and Notifications, saved
 * together with Save changes; Sign out opens the shell's dialog. Choosing a theme applies it at once; Save
 * stores it for every device. A visitor is asked to sign in (ADR 0016).
 */
@Component({
  selector: 'hm-settings',
  imports: [
    RouterLink,
    AlertComponent,
    ButtonDirective,
    EmptyStateComponent,
    ErrorBlockComponent,
    ErrorSummaryComponent,
    PageHeaderComponent,
    RadioGroupComponent,
    SkeletonComponent,
    SwitchComponent,
    TextFieldComponent,
  ],
  templateUrl: './settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly store = inject(SettingsStore);
  private readonly dialogs = inject(AccountDialogs);
  readonly session = inject(SessionStore);
  readonly ids = IDS;
  readonly themes = THEMES;

  readonly state = signal<'loading' | 'error' | 'ready'>('loading');
  readonly displayName = signal('');
  readonly email = signal('');
  readonly autoplaySimilar = signal(true);
  readonly crossfade = signal(false);
  readonly theme = signal<string>('device');
  readonly notifyNewReleases = signal(true);
  readonly productNews = signal(false);
  readonly busy = signal(false);
  readonly saved = signal(false);
  readonly failed = signal(false);
  readonly errors = signal<Record<string, string>>({});
  readonly attempt = signal(0);
  readonly subtitle = computed(() => {
    const s = this.store.settings();
    return s ? `${s.displayName} · ${s.email}` : '';
  });
  readonly summary = computed(() =>
    Object.entries(IDS)
      .filter(([field]) => this.errors()[field])
      .map(([field, id]) => ({ fieldId: id, message: this.errors()[field] })),
  );

  constructor() {
    effect(() => {
      if (this.session.signedIn()) untracked(() => void this.load());
    });
    // Choosing a theme shows it at once (L2-049 AC3); Save keeps it for every device.
    effect(() => {
      const theme = this.theme() as Theme;
      if (this.state() === 'ready') untracked(() => this.store.applyTheme(theme));
    });
  }

  async load(): Promise<void> {
    this.state.set('loading');
    const settings = await this.store.load();
    if (!settings) {
      this.state.set('error');
      return;
    }
    this.fill(settings);
    this.state.set('ready');
  }

  signOut(): void {
    this.dialogs.openSignOut();
  }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy()) return;
    this.saved.set(false);
    this.failed.set(false);
    const errors: Record<string, string> = {};
    if (!this.displayName().trim()) errors['displayName'] = 'Display name can’t be empty';
    this.errors.set(errors);
    if (Object.keys(errors).length) {
      this.attempt.update((n) => n + 1);
      return;
    }
    this.busy.set(true);
    const result = await this.store.save({
      displayName: this.displayName().trim(),
      email: this.email().trim(),
      autoplaySimilar: this.autoplaySimilar(),
      crossfade: this.crossfade(),
      theme: this.theme() as Theme,
      notifyNewReleases: this.notifyNewReleases(),
      productNews: this.productNews(),
    });
    this.busy.set(false);
    if (result.ok) {
      this.fill(result.value);
      this.saved.set(true);
    } else if (result.problem.status === 422) {
      this.errors.set(Object.fromEntries(Object.entries(result.problem.errors).map(([k, v]) => [k, v.message])));
      this.attempt.update((n) => n + 1);
    } else {
      this.failed.set(true);
    }
  }

  private fill(s: SettingsDto): void {
    this.displayName.set(s.displayName);
    this.email.set(s.email);
    this.autoplaySimilar.set(s.autoplaySimilar);
    this.crossfade.set(s.crossfade);
    this.theme.set(s.theme);
    this.notifyNewReleases.set(s.notifyNewReleases);
    this.productNews.set(s.productNews);
  }
}
