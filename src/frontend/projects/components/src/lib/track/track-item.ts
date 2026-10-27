/** What a track row, card or the player bar needs to show one track. */
export interface TrackItem {
  id: string;
  /** The track's segment of /tracks/{slug}. */
  slug: string;
  title: string;
  artistName: string;
  /** Length in whole seconds. */
  durationSeconds: number;
  coverUrl: string | null;
  liked: boolean;
}

/** Formats seconds as "m:ss", for example 222 as "3:42". */
export function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
