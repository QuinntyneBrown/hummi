using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Application.Playback;
using Hummi.Domain.Catalogue;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Catalogue;

/// <summary>A track page and its licence page (L2-008, L2-009, L2-012).</summary>
public sealed record GetTrackQuery(string Slug) : IRequest<Result<TrackDetailDto>>;

public sealed record ArtistRefDto(string Slug, string Name);

public sealed record AlbumRefDto(string Slug, string Title);

/// <summary>
/// One track with everything its page shows. A playable track carries More from its artist; a withdrawn
/// one carries Similar tracks instead. Waveform holds peaks from 0 to 100. GeneratedWith is null when the
/// model is unknown; SourceUrl is the track's Pixabay page (ADR 0021).
/// </summary>
public sealed record TrackDetailDto(
    string Id,
    string Slug,
    string Title,
    int DurationSeconds,
    string? CoverUrl,
    ArtistRefDto Artist,
    AlbumRefDto? Album,
    string? Genre,
    string? GeneratedWith,
    Licence Licence,
    string LicenceLabel,
    string? SourceUrl,
    long Plays,
    bool Playable,
    bool Liked,
    IReadOnlyList<int> Waveform,
    IReadOnlyList<TrackSummaryDto> MoreFromArtist,
    IReadOnlyList<TrackSummaryDto> Similar);

public sealed class GetTrackQueryHandler(IHummiDbContext db) : IRequestHandler<GetTrackQuery, Result<TrackDetailDto>>
{
    public const int ShelfCount = 6;

    public async Task<Result<TrackDetailDto>> Handle(GetTrackQuery request, CancellationToken cancellationToken)
    {
        var track = await db.Tracks.AsNoTracking().Include(t => t.Artist).SingleOrDefaultAsync(t => t.Slug == request.Slug, cancellationToken);
        if (track is null)
        {
            return CatalogueErrors.TrackNotFound;
        }

        var album = track.AlbumId is { } albumId
            ? await db.Albums.AsNoTracking().Where(a => a.Id == albumId && a.Published).Select(a => new AlbumRefDto(a.Slug, a.Title)).SingleOrDefaultAsync(cancellationToken)
            : null;
        var genre = track.GenreId is { } genreId
            ? await db.Genres.AsNoTracking().Where(g => g.Id == genreId).Select(g => g.Name).SingleOrDefaultAsync(cancellationToken)
            : null;

        var others = db.Tracks.AsNoTracking().Where(t => t.Id != track.Id && !t.Withdrawn);
        IReadOnlyList<TrackSummaryDto> moreFrom = [];
        IReadOnlyList<TrackSummaryDto> similar = [];
        if (track.IsPlayable)
        {
            moreFrom = await others.Where(t => t.ArtistId == track.ArtistId)
                .OrderByDescending(t => t.PlayCount).ThenBy(t => t.Title).Take(ShelfCount).ToSummaries().ToListAsync(cancellationToken);
        }
        else
        {
            // Similar means the same genre, or the same artist when the track has no genre.
            similar = await others.Where(t => track.GenreId == null ? t.ArtistId == track.ArtistId : t.GenreId == track.GenreId)
                .OrderByDescending(t => t.PlayCount).ThenBy(t => t.Title).Take(ShelfCount).ToSummaries().ToListAsync(cancellationToken);
        }

        var artist = track.Artist!;
        return new TrackDetailDto(
            track.Id.ToString(),
            track.Slug,
            track.Title,
            track.DurationSeconds,
            track.CoverUrl,
            new ArtistRefDto(artist.Slug, artist.Name),
            album,
            genre,
            artist.ModelName,
            track.Licence,
            LicenceLabels.Of(track.Licence),
            track.SourceUrl,
            track.PlayCount,
            track.IsPlayable,
            false,
            [.. track.Waveform.Select(p => (int)p)],
            moreFrom,
            similar);
    }
}

internal static class CatalogueErrors
{
    public static readonly Error TrackNotFound = Error.NotFound("TRACK_NOT_FOUND", "This track isn’t on Hummi");

    public static readonly Error ArtistNotFound = Error.NotFound("ARTIST_NOT_FOUND", "This artist isn’t on Hummi");

    public static readonly Error AlbumNotFound = Error.NotFound("ALBUM_NOT_FOUND", "This album isn’t on Hummi");
}
