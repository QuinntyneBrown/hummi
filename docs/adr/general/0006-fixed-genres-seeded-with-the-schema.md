# 0006. The ten genres are fixed rows seeded with the schema, and moods map to genres

Status: Accepted (2026-10-27)

Amended by ADR 0021: imported Pixabay tracks are classified only when their Pixabay genre or a tag names one of the ten genres; the licence is the Pixabay Content License.

## Context

Journey 03 (browse genres) needs genres for Browse and the genre pages. L2-003 names exactly ten genres
(Soca, Kids, Steelpan & Calypso, Dancehall, Island chill, Parang, Chutney, Reggae, Zouk, Rapso) and a
Moods shelf of chips that open genre pages. The designs still named an older genre list and a separate
`Mood` entity. Tracks carried no genre and no licence yet, and there is no upload flow.

## Decision

- `Genre` is a domain entity with ten fixed instances (`Genre.All()`) with constant ids, slugs, names,
  descriptions, Browse order (`Position`) and a cover `Tone` (1 to 6). The `AddGenres` migration seeds them
  with EF Core `HasData`, so every install has them without running `Hummi.Cli`.
- `Track.GenreId` is a nullable foreign key: an unclassified track is not listed on any genre page.
  `Hummi.Cli seed` puts every demo track into the genre the mocks give it.
- The Moods shelf lists the first seven genres in Browse order (`Genre.MoodCount`). There is no `Mood`
  entity; mood curation beyond this mapping is deferred.
- Every published track carries CC0 1.0, CC BY 4.0 or CC BY-SA 4.0, so the openly licensed track count is
  the count of tracks that are not withdrawn. No licence column is added until the licence page needs one.
- Genre tracks are paged 50 at a time and sorted in the database (`newest` by date added, `most-played` by
  play count). The genre page loads the first page; Play all and Shuffle queue that page. Shuffle is a
  Fisher–Yates permutation in `PlayerStore.playShuffled`.
- Browse and genre pages live in a new `@hummi/discovery` feature library.

## Consequences

- Adding or renaming a genre is a migration, not data entry.
- The genre page's error title is "This genre didn’t load", since the name is unknown when the request fails.
- Paging past the first 50 tracks needs a later "Load more" slice.
