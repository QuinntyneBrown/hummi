using Hummi.Domain.Catalogue;

namespace Hummi.Application.Playback;

/// <summary>
/// One track as every track-returning endpoint lists it. Liked is false until likes exist (journey 09).
/// The genre names "Playing from" and "Then, more" in Now playing and the queue; null while unclassified.
/// </summary>
public sealed record TrackSummaryDto(string Id, string Slug, string Title, string ArtistName, int DurationSeconds, string? CoverUrl, bool Liked, string? GenreSlug = null, string? GenreName = null);

public static class TrackSummaryProjection
{
    /// <summary>
    /// Projects tracks with their artist into summaries in the database. The id is lower-case like
    /// <see cref="Guid.ToString()"/>: SQL Server would otherwise render a uniqueidentifier in upper case, and ids
    /// built in memory (likes, playlist entries, fresh badges) would no longer match.
    /// </summary>
    public static IQueryable<TrackSummaryDto> ToSummaries(this IQueryable<Track> tracks) =>
        tracks.Select(t => new TrackSummaryDto(t.Id.ToString().ToLower(), t.Slug, t.Title, t.Artist!.Name, t.DurationSeconds, t.CoverUrl, false,
            t.Genre == null ? null : t.Genre.Slug, t.Genre == null ? null : t.Genre.Name));
}

internal static class PlaybackErrors
{
    public static readonly Common.Error TrackNotFound = Common.Error.NotFound("TRACK_NOT_FOUND", "This track isn’t on Hummi");

    public static readonly Common.Error TrackWithdrawn = Common.Error.Gone("TRACK_WITHDRAWN", "This track is no longer available");
}
