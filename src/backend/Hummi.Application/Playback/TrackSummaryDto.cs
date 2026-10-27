using Hummi.Domain.Catalogue;

namespace Hummi.Application.Playback;

/// <summary>One track as every track-returning endpoint lists it. Liked is false until likes exist (journey 09).</summary>
public sealed record TrackSummaryDto(string Id, string Slug, string Title, string ArtistName, int DurationSeconds, string? CoverUrl, bool Liked);

public static class TrackSummaryProjection
{
    /// <summary>Projects tracks with their artist into summaries in the database.</summary>
    public static IQueryable<TrackSummaryDto> ToSummaries(this IQueryable<Track> tracks) =>
        tracks.Select(t => new TrackSummaryDto(t.Id.ToString(), t.Slug, t.Title, t.Artist!.Name, t.DurationSeconds, t.CoverUrl, false));
}

internal static class PlaybackErrors
{
    public static readonly Common.Error TrackNotFound = Common.Error.NotFound("TRACK_NOT_FOUND", "This track isn’t on Hummi");

    public static readonly Common.Error TrackWithdrawn = Common.Error.Gone("TRACK_WITHDRAWN", "This track is no longer available");
}
