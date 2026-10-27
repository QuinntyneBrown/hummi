import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { IconComponent } from '../icon/icon';

/** How long Copy reads "Copied" (L2-025 AC2). */
export const COPIED_MS = 2000;

/** One quick send target of the share sheet. */
export interface ShareTarget {
  label: string;
  href: string;
}

let nextId = 0;

/**
 * The Share dialog's sheet (L2-025, docs/design-system/components/share-sheet.html): cover, "Share {name}",
 * the Link and Embed tabs, the link or embed code with Copy, the optional "Start at" checkbox and the send
 * targets. Copy writes to the clipboard, reads "Copied" for COPIED_MS and announces "Link copied." The
 * panel takes focus and keeps Tab inside it; Close and Escape emit dismiss.
 */
@Component({
  selector: 'hm-share-sheet',
  imports: [IconComponent],
  template: `
    <div class="scrim" aria-hidden="true" (click)="dismiss.emit()"></div>
    <div
      class="share"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="id + '-title'"
      (keydown)="keydown($event)"
    >
      <div #panel class="share__panel" tabindex="-1">
        <button class="ibtn share__close" type="button" aria-label="Close" (click)="dismiss.emit()">
          <hm-icon name="close" />
        </button>
        <div class="share__head">
          <div class="cover cover--c1 cover--sm" [class.cover--art]="!!coverUrl()" aria-hidden="true">
            @if (coverUrl(); as url) {
              <img [src]="url" alt="" />
            }
            <hm-icon name="music" />
          </div>
          <div>
            <h2 [id]="id + '-title'">Share {{ name() }}</h2>
            <p>Free for anyone to play — no account needed.</p>
          </div>
        </div>
        @if (embedCode()) {
          <div class="seg-tabs" role="tablist" aria-label="Share as">
            @for (t of tabs; track t) {
              <button
                role="tab"
                type="button"
                [attr.aria-selected]="tab() === t"
                [attr.tabindex]="tab() === t ? null : -1"
                (click)="tab.set(t)"
                (keydown.arrowRight)="tab.set(t === 'Link' ? 'Embed' : 'Link')"
                (keydown.arrowLeft)="tab.set(t === 'Link' ? 'Embed' : 'Link')"
              >
                {{ t }}
              </button>
            }
          </div>
        }
        @if (tab() === 'Link') {
          <div class="linkbox">
            <span>{{ link() }}</span>
            <button
              class="copy-btn"
              [class.copy-btn--done]="copied() === 'link'"
              type="button"
              (click)="copy('link', fullLink())"
            >
              {{ copied() === 'link' ? 'Copied' : 'Copy' }}
            </button>
          </div>
          @if (startLabel()) {
            <label class="share__start">
              <input #start type="checkbox" [checked]="startAt()" (change)="startAt.set(start.checked)" />
              Start at {{ startLabel() }}
            </label>
          }
        } @else {
          <div class="embed-card">
            <div class="cover cover--c1 cover--sm" [class.cover--art]="!!coverUrl()" aria-hidden="true">
              @if (coverUrl(); as url) {
                <img [src]="url" alt="" />
              }
              <hm-icon name="music" />
            </div>
            <div>
              <strong>{{ name() }}</strong
              ><small>{{ byline() }} · on hummi</small>
            </div>
            <span class="play" aria-hidden="true"><hm-icon name="play" [fill]="true" /></span>
          </div>
          <div class="codebox">
            <code>{{ embedCode() }}</code>
            <button
              class="copy-btn"
              [class.copy-btn--done]="copied() === 'embed'"
              type="button"
              (click)="copy('embed', embedCode())"
            >
              {{ copied() === 'embed' ? 'Copied' : 'Copy' }}
            </button>
          </div>
        }
        <p class="visually-hidden" role="status">
          {{ copied() === 'link' ? 'Link copied.' : copied() === 'embed' ? 'Embed code copied.' : '' }}
        </p>
        <div class="share__via">
          <p>Send it straight to</p>
          <div>
            @for (target of targets(); track target.label) {
              <a class="pill-btn pill-btn--lg" [href]="target.href" target="_blank" rel="noopener">{{
                target.label
              }}</a>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareSheetComponent {
  readonly name = input.required<string>();
  readonly byline = input('');
  readonly coverUrl = input<string | null>(null);
  /** The link as shown, without its scheme, for example "hummi.fm/s/k7m2p9qa". */
  readonly link = input.required<string>();
  /** The link Copy writes. */
  readonly fullLink = input.required<string>();
  /** The iframe code of the Embed tab; empty hides the tabs (playlists). */
  readonly embedCode = input('');
  /** "m:ss" to offer "Start at", or empty. */
  readonly startLabel = input('');
  readonly startAt = model(false);
  readonly targets = input<readonly ShareTarget[]>([]);
  readonly dismiss = output<void>();

  protected readonly tabs = ['Link', 'Embed'] as const;
  protected readonly tab = signal<'Link' | 'Embed'>('Link');
  protected readonly copied = signal<'link' | 'embed' | null>(null);
  protected readonly id = `hm-share-${nextId++}`;
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    afterNextRender(() => this.panel().nativeElement.focus());
  }

  protected async copy(what: 'link' | 'embed', text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard refused (insecure context); the text stays visible to copy by hand.
    }
    this.copied.set(what);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.copied.set(null), COPIED_MS);
  }

  protected keydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.dismiss.emit();
    } else if (event.key === 'Tab') {
      const focusable = Array.from(
        this.panel().nativeElement.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input'),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === this.panel().nativeElement)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }
}
