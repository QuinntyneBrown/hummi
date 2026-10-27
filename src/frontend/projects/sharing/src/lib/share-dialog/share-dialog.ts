import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { PlayerStore, ShareDialogs, ShareSubject, SharesApi } from '@hummi/api';
import { ShareSheetComponent, ShareTarget, SpinnerComponent, ToastService, formatDuration } from '@hummi/components';

/**
 * The Share dialog (L2-025) for ShareDialogs: asks the API for the item's link, created on first use, and
 * shows it as "{host}/s/{code}" in hm-share-sheet. A track also gets the Embed tab and, when it is the
 * current track and has played, "Start at {m:ss}", which adds ?t={seconds} to the link.
 */
@Component({
  selector: 'hm-share-dialog',
  imports: [ShareSheetComponent, SpinnerComponent],
  template: `
    @if (code(); as c) {
      <hm-share-sheet
        [name]="subject().name"
        [byline]="subject().byline"
        [coverUrl]="subject().coverUrl"
        [link]="shown()"
        [fullLink]="full()"
        [embedCode]="embed()"
        [startLabel]="startLabel()"
        [(startAt)]="startAt"
        [targets]="targets()"
        (dismiss)="dialogs.close()"
      />
    } @else {
      <div class="share" role="dialog" aria-modal="true" aria-label="Share">
        <div class="share__panel"><hm-spinner label="Getting the link" /></div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareDialogComponent implements OnInit {
  private readonly api = inject(SharesApi);
  private readonly player = inject(PlayerStore);
  private readonly toasts = inject(ToastService);
  readonly dialogs = inject(ShareDialogs);
  readonly subject = input.required<ShareSubject>();

  readonly code = signal<string | null>(null);
  readonly startAt = signal(false);
  /** The current position when the shared track is playing or paused part-way (AC4). */
  private readonly start = computed(() => {
    const s = this.subject();
    const position = this.player.position();
    return s.type === 'track' && this.player.current()?.id === s.id && position > 0 ? position : 0;
  });
  readonly startLabel = computed(() => (this.start() ? formatDuration(this.start()) : ''));
  readonly full = computed(() => {
    const base = `${location.origin}/s/${this.code()}`;
    return this.startAt() && this.start() ? `${base}?t=${this.start()}` : base;
  });
  readonly shown = computed(() => this.full().replace(/^https?:\/\//, ''));
  readonly embed = computed(() => {
    const s = this.subject();
    return s.type === 'track' && s.slug
      ? `<iframe src="https://hummi.fm/embed/${s.slug}" width="100%" height="96" frameborder="0"></iframe>`
      : '';
  });
  readonly targets = computed<ShareTarget[]>(() => {
    const text = encodeURIComponent(`${this.subject().name} on Hummi ${this.full()}`);
    return [
      { label: 'WhatsApp', href: `https://wa.me/?text=${text}` },
      { label: 'Email', href: `mailto:?subject=${encodeURIComponent(this.subject().name)}&body=${text}` },
      { label: 'Messages', href: `sms:?&body=${text}` },
    ];
  });

  async ngOnInit(): Promise<void> {
    const s = this.subject();
    const result = await this.api.share(s.type, s.id);
    if (result.ok) {
      this.code.set(result.value.code);
    } else {
      this.dialogs.close();
      this.toasts.showDanger('Couldn’t make a link', 'Check your connection and try again.');
    }
  }
}
