import { Injectable, computed, inject, signal } from '@angular/core';

import { PlaybackApi, TrackSummaryDto } from './playback-api';

/** idle: nothing loaded; stalled: the stream stopped because the connection dropped. */
export type PlayState = 'idle' | 'playing' | 'paused' | 'stalled';

/**
 * The one player of the app, shared by every feature library. Owns the queue, the current track,
 * position and play state, and drives a single HTMLAudioElement. Playing needs no account (L2-014);
 * each track start is recorded with POST /api/plays.
 */
@Injectable({ providedIn: 'root' })
export class PlayerStore {
  private readonly api = inject(PlaybackApi);
  private audioElement: HTMLAudioElement | null = null;

  private readonly queueState = signal<readonly TrackSummaryDto[]>([]);
  private readonly indexState = signal(-1);
  private readonly playState = signal<PlayState>('idle');
  private readonly positionState = signal(0);
  private readonly durationState = signal<number | null>(null);

  readonly queue = this.queueState.asReadonly();
  readonly state = this.playState.asReadonly();
  /** Elapsed seconds of the current track. */
  readonly position = this.positionState.asReadonly();
  /** Seconds the audio reports, or null until it has loaded its metadata. */
  readonly duration = this.durationState.asReadonly();
  readonly current = computed(() => this.queueState()[this.indexState()] ?? null);
  readonly playing = computed(() => this.playState() === 'playing');
  readonly stalled = computed(() => this.playState() === 'stalled');

  /** Replaces the queue with a list and plays the track at index. */
  playFrom(tracks: readonly TrackSummaryDto[], index: number): void {
    this.queueState.set([...tracks]);
    this.start(index);
  }

  /** Pauses a playing track; otherwise plays (or retries) the current one. */
  toggle(): void {
    const audio = this.audioElement;
    if (!audio || !this.current()) return;
    if (this.playing()) {
      audio.pause();
    } else if (this.stalled()) {
      this.start(this.indexState());
    } else {
      void this.resume(audio);
    }
  }

  next(): void {
    if (this.indexState() < this.queueState().length - 1) this.start(this.indexState() + 1);
  }

  /** Plays the previous queued track; on the first track, starts it again. */
  previous(): void {
    this.start(Math.max(0, this.indexState() - 1));
  }

  private start(index: number): void {
    const track = this.queueState()[index];
    if (!track) return;
    const audio = this.audio();
    this.indexState.set(index);
    this.positionState.set(0);
    this.durationState.set(null);
    audio.src = this.api.streamUrl(track.id);
    void this.resume(audio);
    void this.api.recordPlay(track.id);
  }

  private async resume(audio: HTMLAudioElement): Promise<void> {
    try {
      await audio.play();
    } catch {
      // A play() interrupted by a new src or a failed load is reported through the element's events.
    }
  }

  private audio(): HTMLAudioElement {
    if (this.audioElement) return this.audioElement;
    const audio = new Audio();
    audio.preload = 'auto';
    audio.addEventListener('playing', () => this.playState.set('playing'));
    audio.addEventListener('pause', () => {
      if (this.playState() !== 'stalled') this.playState.set('paused');
    });
    audio.addEventListener('timeupdate', () => this.positionState.set(Math.floor(audio.currentTime)));
    audio.addEventListener('loadedmetadata', () =>
      this.durationState.set(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null),
    );
    audio.addEventListener('ended', () => {
      if (this.indexState() < this.queueState().length - 1) this.next();
      else this.playState.set('paused');
    });
    audio.addEventListener('error', () => this.playState.set('stalled'));
    audio.addEventListener('stalled', () => {
      if (audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) this.playState.set('stalled');
    });
    this.audioElement = audio;
    return audio;
  }
}
