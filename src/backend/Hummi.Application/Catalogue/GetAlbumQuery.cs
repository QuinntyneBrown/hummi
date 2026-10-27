using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Application.Playback;
using Hummi.Domain.Catalogue;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Catalogue;

/// <summary>An album page (L2-011). Only published albums are found.</summary>
public sealed record GetAlbumQuery(string Slug) : IRequest<Result<AlbumDetailDto>>;

/// <summary>One album with its playable tracks in album order and the summary line.</summary>
public sealed record AlbumDetailDto(
    string Slug,
    string Title,
    int Year,
    ArtistRefDto Artist,
    string? CoverUrl,
    string Summary,
    IReadOnlyList<TrackSummaryDto> Tracks);

public sealed class GetAlbumQueryHandler(IHummiDbContext db) : IRequestHandler<GetAlbumQuery, Result<AlbumDetailDto>>
{
    public async Task<Result<AlbumDetailDto>> Handle(GetAlbumQuery request, CancellationToken cancellationToken)
    {
        var album = await db.Albums.AsNoTracking().SingleOrDefaultAsync(a => a.Slug == request.Slug && a.Published, cancellationToken);
        if (album is null)
        {
            return CatalogueErrors.AlbumNotFound;
        }

        var artist = await db.Artists.AsNoTracking().Where(a => a.Id == album.ArtistId)
            .Select(a => new ArtistRefDto(a.Slug, a.Name)).SingleAsync(cancellationToken);
        var tracks = db.Tracks.AsNoTracking().Where(t => t.AlbumId == album.Id && !t.Withdrawn).OrderBy(t => t.AlbumPosition);
        var licences = await tracks.Select(t => new { t.DurationSeconds, t.Licence }).ToListAsync(cancellationToken);
        var summaries = await tracks.ToSummaries().ToListAsync(cancellationToken);
        var summary = AlbumSummary.Of(album.Year, licences.Select(t => t.DurationSeconds).ToList(), licences.Select(t => t.Licence).ToList());
        return new AlbumDetailDto(album.Slug, album.Title, album.Year, artist, summaries.FirstOrDefault()?.CoverUrl, summary, summaries);
    }
}

/// <summary>"{year} · {n} tracks · {minutes} min · {licence}": minutes round up, and the licence is the one every track shares.</summary>
public static class AlbumSummary
{
    public static string Of(int year, IReadOnlyCollection<int> durationsSeconds, IReadOnlyCollection<Licence> licences)
    {
        var count = durationsSeconds.Count;
        var minutes = (int)Math.Ceiling(durationsSeconds.Sum() / 60.0);
        var distinct = licences.Distinct().ToList();
        var licence = distinct.Count == 1 ? LicenceLabels.Of(distinct[0]) : "mixed licences";
        return $"{year} · {count} {(count == 1 ? "track" : "tracks")} · {minutes} min · {licence}";
    }
}
