using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Application.Playback;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Catalogue;

/// <summary>An artist page (L2-010).</summary>
public sealed record GetArtistQuery(string Slug) : IRequest<Result<ArtistDetailDto>>;

/// <summary>One release on the artist page's Releases shelf.</summary>
public sealed record AlbumTileDto(string Slug, string Title, int Year, int TrackCount, string? CoverUrl);

/// <summary>
/// One artist with Popular (most played playable tracks) and Releases (published albums, newest first).
/// Following stays false until follows exist (journey 10). CoverUrl is the cover of the most played track.
/// </summary>
public sealed record ArtistDetailDto(
    string Slug,
    string Name,
    string? ModelName,
    string Description,
    int MonthlyListeners,
    string? CoverUrl,
    bool Following,
    IReadOnlyList<TrackSummaryDto> Popular,
    IReadOnlyList<AlbumTileDto> Releases);

public sealed class GetArtistQueryHandler(IHummiDbContext db) : IRequestHandler<GetArtistQuery, Result<ArtistDetailDto>>
{
    public const int PopularCount = 5;

    public async Task<Result<ArtistDetailDto>> Handle(GetArtistQuery request, CancellationToken cancellationToken)
    {
        var artist = await db.Artists.AsNoTracking().SingleOrDefaultAsync(a => a.Slug == request.Slug, cancellationToken);
        if (artist is null)
        {
            return CatalogueErrors.ArtistNotFound;
        }

        var playable = db.Tracks.AsNoTracking().Where(t => t.ArtistId == artist.Id && !t.Withdrawn);
        var popular = await playable.OrderByDescending(t => t.PlayCount).ThenBy(t => t.Title).Take(PopularCount).ToSummaries().ToListAsync(cancellationToken);
        var albums = await db.Albums.AsNoTracking().Where(a => a.ArtistId == artist.Id && a.Published)
            .OrderByDescending(a => a.Year).ThenBy(a => a.Title).ToListAsync(cancellationToken);
        var albumIds = albums.Select(a => a.Id).ToList();
        var albumTracks = await playable.Where(t => t.AlbumId != null && albumIds.Contains(t.AlbumId.Value))
            .OrderBy(t => t.AlbumPosition).Select(t => new { AlbumId = t.AlbumId!.Value, t.CoverUrl }).ToListAsync(cancellationToken);
        var releases = albums.Select(a =>
        {
            var tracks = albumTracks.Where(t => t.AlbumId == a.Id).ToList();
            return new AlbumTileDto(a.Slug, a.Title, a.Year, tracks.Count, tracks.FirstOrDefault()?.CoverUrl);
        }).ToList();

        return new ArtistDetailDto(
            artist.Slug,
            artist.Name,
            artist.ModelName,
            artist.Description,
            artist.MonthlyListeners,
            popular.FirstOrDefault()?.CoverUrl,
            false,
            popular,
            releases);
    }
}
