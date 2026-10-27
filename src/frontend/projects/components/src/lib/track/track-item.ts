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
  /** The genre it is listed under; null while unclassified, absent where a screen does not need it. */
  genreSlug?: string | null;
  genreName?: string | null;
}

/** Formats seconds as "m:ss", for example 222 as "3:42". */
export function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/** Formats a total length as "1 h 32 min", or "18 min" under an hour (L2-023 AC1). */
export function formatLength(seconds: number): string {
  const minutes = Math.round(Math.max(0, seconds) / 60);
  const h = Math.floor(minutes / 60);
  return h ? `${h} h ${minutes % 60} min` : `${minutes} min`;
}
