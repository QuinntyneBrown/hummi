import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';

import { ConnectivityService } from './connectivity';
import { PlaybackApi, TrackSummaryDto } from './playback-api';

/** idle: nothing loaded; stalled: the stream stopped because the connection dropped. */
export type PlayState = 'idle' | 'playing' | 'paused' | 'stalled';

/**
 * The one player of the app, shared by every feature library. Owns the queue, the current track,
 * position and play state, Shuffle and Repeat, and drives a single HTMLAudioElement. Playing needs no
 * account (L2-014); each track start is recorded with POST /api/plays.
 *
 * Every queue entry is its own object, so a track queued twice is two entries. Shuffle reorders the
 * tracks after the current one and remembers the order it came from; turning it off restores that
 * order from the current track on. Repeat starts the queue again after its last track (L2-015). When
 * the connection drops, playback stops and keeps its position; it resumes from there once back online.
 */
@Injectable({ providedIn: 'root' })
export class PlayerStore {
  private readonly api = inject(PlaybackApi);
  private readonly connectivity = inject(ConnectivityService);
  private audioElement: HTMLAudioElement | null = null;

  private readonly queueState = signal<readonly TrackSummaryDto[]>([]);
  /** The queue in the order it had before Shuffle; null while Shuffle is off. */
  private readonly unshuffled = signal<readonly TrackSummaryDto[] | null>(null);
  private readonly indexState = signal(-1);
  private readonly playState = signal<PlayState>('idle');
  private readonly positionState = signal(0);
  private readonly durationState = signal<number | null>(null);
  private readonly repeatState = signal(false);
  private readonly resumeState = signal(0);

  readonly queue = this.queueState.asReadonly();
  readonly state = this.playState.asReadonly();
  /** Elapsed seconds of the current track. */
  readonly position = this.positionState.asReadonly();
  /** Seconds the audio reports, or null until it has loaded its metadata. */
  readonly duration = this.durationState.asReadonly();
  readonly current = computed<TrackSummaryDto | null>(() => this.queueState()[this.indexState()] ?? null);
  readonly playing = computed(() => this.playState() === 'playing');
  readonly stalled = computed(() => this.playState() === 'stalled');
  readonly shuffle = computed(() => this.unshuffled() !== null);
  readonly repeat = this.repeatState.asReadonly();
  /** Where playback resumes once the connection returns; null unless stalled. */
  readonly resumeFrom = computed(() => (this.stalled() ? this.resumeState() : null));
  /** What plays after the current track, in order; with Repeat, the queue's start follows its end. */
  readonly upNext = computed(() => {
    const queue = this.queueState();
    const index = this.indexState();
    if (index < 0) return [];
    const after = queue.slice(index + 1);
    return this.repeatState() ? [...after, ...queue.slice(0, index)] : after;
  });

  constructor() {
    effect(() => {
      if (this.connectivity.online()) untracked(() => this.reconnected());
      else untracked(() => this.disconnected());
    });
  }

  /** Replaces the queue with a list and plays the track at index; with Shuffle on, the rest is shuffled. */
  playFrom(tracks: readonly TrackSummaryDto[], index: number): void {
    const entries = tracks.map(entry);
    if (this.shuffle() && entries[index]) {
      const first = entries[index];
      this.unshuffled.set(entries);
      this.queueState.set([first, ...shuffled(entries.filter((e) => e !== first))]);
      this.start(0);
    } else {
      this.queueState.set(entries);
      this.start(index);
    }
  }

  /** Plays one track on its own from a start time in seconds, as a shared link's "Start at" asks (L2-025 AC4). */
  playAt(track: TrackSummaryDto, from: number): void {
    this.unshuffled.set(null);
    this.queueState.set([entry(track)]);
    this.start(0, Math.max(0, from));
  }

  /** Replaces the queue with a uniform random permutation of the list and plays its first track. */
  playShuffled(tracks: readonly TrackSummaryDto[]): void {
    this.unshuffled.set(null);
    this.queueState.set(shuffled(tracks.map(entry)));
    this.start(0);
  }

  /** Pauses a playing track; otherwise plays (or retries) the current one. */
  toggle(): void {
    if (!this.current()) return;
    const audio = this.audio();
    if (this.playing()) {
      audio.pause();
    } else if (this.stalled()) {
      this.start(this.indexState(), this.resumeState());
    } else if (!audio.src) {
      this.start(this.indexState());
    } else {
      void this.resume(audio);
    }
  }

  /** Plays the next queued track; after the last one, the first again when Repeat is on. */
  next(): void {
    if (this.indexState() < this.queueState().length - 1) this.start(this.indexState() + 1);
    else if (this.repeatState() && this.queueState().length) this.start(0);
  }

  /** Plays the previous queued track; on the first track, starts it again. */
  previous(): void {
    if (this.indexState() < 0) return;
    this.start(Math.max(0, this.indexState() - 1));
  }

  toggleRepeat(): void {
    this.repeatState.update((on) => !on);
  }

  /** Shuffles the tracks after the current one, or restores the order they had before. */
  toggleShuffle(): void {
    const queue = this.queueState();
    const index = this.indexState();
    const original = this.unshuffled();
    if (original) {
      const current = queue[index];
      const restored = original.filter((e) => queue.includes(e));
      this.unshuffled.set(null);
      this.queueState.set(restored);
      this.indexState.set(current ? restored.indexOf(current) : -1);
    } else {
      this.unshuffled.set(queue);
      this.queueState.set([...queue.slice(0, index + 1), ...shuffled(queue.slice(index + 1))]);
    }
  }

  /** Puts the track at the end of the queue; with nothing loaded it becomes the current track, paused. */
  addToQueue(track: TrackSummaryDto): void {
    const added = entry(track);
    if (!this.current()) return this.load(added);
    this.queueState.update((queue) => [...queue, added]);
    this.unshuffled.update((original) => original && [...original, added]);
  }

  /** Puts the track right after the current one; with nothing loaded it becomes the current track, paused. */
  playNext(track: TrackSummaryDto): void {
    const added = entry(track);
    const current = this.current();
    if (!current) return this.load(added);
    this.queueState.update((queue) => insertAfter(queue, current, added));
    this.unshuffled.update((original) => original && insertAfter(original, current, added));
  }

  /** Removes the entry at index of upNext. */
  removeUpNext(index: number): void {
    const removed = this.upNext()[index];
    if (!removed) return;
    const current = this.current();
    const queue = this.queueState().filter((e) => e !== removed);
    this.queueState.set(queue);
    this.unshuffled.update((original) => original && original.filter((e) => e !== removed));
    this.indexState.set(current ? queue.indexOf(current) : -1);
  }

  /** Empties Up next, keeping the current track. */
  clearUpNext(): void {
    const current = this.current();
    if (!current) return;
    this.queueState.set([current]);
    this.unshuffled.update((original) => original && [current]);
    this.indexState.set(0);
  }

  private load(added: TrackSummaryDto): void {
    this.unshuffled.update((original) => original && [added]);
    this.queueState.set([added]);
    this.indexState.set(0);
    this.positionState.set(0);
    this.durationState.set(null);
    this.playState.set('paused');
  }

  /** Plays the track at index, from the given second. */
  private start(index: number, from = 0): void {
    const track = this.queueState()[index];
    if (!track) return;
    const audio = this.audio();
    this.indexState.set(index);
    this.positionState.set(from);
    this.durationState.set(null);
    audio.src = this.api.streamUrl(track.id);
    if (from > 0) {
      audio.addEventListener('loadedmetadata', () => (audio.currentTime = from), { once: true });
    }
    void this.resume(audio);
    if (from === 0) void this.api.recordPlay(track.id);
  }

  /** The connection went away: stop and keep the position to resume from. */
  private disconnected(): void {
    if (!this.current() || this.playState() === 'idle' || this.stalled()) return;
    if (this.playState() === 'paused') return;
    this.stall();
  }

  /** The connection came back: resume a stream it stopped. */
  private reconnected(): void {
    if (this.stalled() && this.current()) this.start(this.indexState(), this.resumeState());
  }

  private stall(): void {
    this.resumeState.set(this.positionState());
    this.playState.set('stalled');
    this.audioElement?.pause();
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
    audio.addEventListener('timeupdate', () => {
      if (!this.stalled()) this.positionState.set(Math.floor(audio.currentTime));
    });
    audio.addEventListener('loadedmetadata', () =>
      this.durationState.set(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null),
    );
    audio.addEventListener('ended', () => {
      if (this.indexState() < this.queueState().length - 1 || this.repeatState()) this.next();
      else this.playState.set('paused');
    });
    audio.addEventListener('error', () => {
      if (audio.getAttribute('src')) this.stall();
    });
    audio.addEventListener('stalled', () => {
      if (audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) this.stall();
    });
    this.audioElement = audio;
    return audio;
  }
}

/** A queue entry of its own, so the same track queued twice is two entries. */
function entry(track: TrackSummaryDto): TrackSummaryDto {
  return { ...track };
}

function insertAfter(
  list: readonly TrackSummaryDto[],
  after: TrackSummaryDto,
  added: TrackSummaryDto,
): TrackSummaryDto[] {
  const at = list.indexOf(after) + 1;
  return [...list.slice(0, at), added, ...list.slice(at)];
}

/** A uniform random permutation (Fisher–Yates). */
function shuffled<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
