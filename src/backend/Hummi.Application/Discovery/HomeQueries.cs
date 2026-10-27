using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Application.Playback;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Discovery;

/// <summary>Whether Home shows its content or "Your Home fills up as you listen" (L2-002 AC1).</summary>
public sealed record HomeSummaryDto(bool HasHistory);

/// <summary>
/// Home's summary for the caller. A signed-in listener has history once they played a track; a visitor
/// always sees Home's content, since their history is not known (ADR 0015).
/// </summary>
public sealed record GetHomeSummaryQuery(Guid? ListenerId) : IRequest<Result<HomeSummaryDto>>;

public sealed class GetHomeSummaryQueryHandler(IHummiDbContext db) : IRequestHandler<GetHomeSummaryQuery, Result<HomeSummaryDto>>
{
    public async Task<Result<HomeSummaryDto>> Handle(GetHomeSummaryQuery request, CancellationToken cancellationToken) =>
        new HomeSummaryDto(request.ListenerId is null || await db.PlayEvents.AnyAsync(p => p.ListenerId == request.ListenerId, cancellationToken));
}

/// <summary>
/// The billboard (L2-001 AC1 to AC3): the newest published album with a kicker, else the newest published
/// album. Tracks are in album order; the first is the "Opens with" track.
/// </summary>
public sealed record FeaturedAlbumDto(
    string Slug,
    string Title,
    string ArtistName,
    string ArtistSlug,
    string Kicker,
    string Blurb,
    int TrackCount,
    int DurationSeconds,
    IReadOnlyList<TrackSummaryDto> Tracks);

public sealed record GetFeaturedAlbumQuery : IRequest<Result<FeaturedAlbumDto>>;

public sealed class GetFeaturedAlbumQueryHandler(IHummiDbContext db) : IRequestHandler<GetFeaturedAlbumQuery, Result<FeaturedAlbumDto>>
{
    public static readonly Error NoFeature = Error.NotFound("NO_FEATURED_ALBUM", "Nothing is featured yet");

    public async Task<Result<FeaturedAlbumDto>> Handle(GetFeaturedAlbumQuery request, CancellationToken cancellationToken)
    {
        var album = await db.Albums.AsNoTracking().Where(a => a.Published)
            .OrderByDescending(a => a.Kicker != null).ThenByDescending(a => a.Year).ThenBy(a => a.Title)
            .FirstOrDefaultAsync(cancellationToken);
        if (album is null)
        {
            return NoFeature;
        }

        var artist = await db.Artists.AsNoTracking().SingleAsync(a => a.Id == album.ArtistId, cancellationToken);
        var tracks = await db.Tracks.AsNoTracking().Where(t => t.AlbumId == album.Id && !t.Withdrawn)
            .OrderBy(t => t.AlbumPosition).ToSummaries().ToListAsync(cancellationToken);
        if (tracks.Count == 0)
        {
            return NoFeature;
        }

        return new FeaturedAlbumDto(
            album.Slug,
            album.Title,
            artist.Name,
            artist.Slug,
            album.Kicker ?? $"New album · {album.Year}",
            album.Blurb ?? string.Empty,
            tracks.Count,
            tracks.Sum(t => t.DurationSeconds),
            tracks);
    }
}

/// <summary>One Home shelf; NewTrackIds are the tracks added in the last 7 days, which carry the New badge.</summary>
public sealed record HomeShelfDto(string Key, IReadOnlyList<TrackSummaryDto> Tracks, IReadOnlyList<string> NewTrackIds);

/// <summary>
/// One Home shelf by key, loaded on its own so a failure leaves the rest of Home working (L2-002 AC2):
/// recently-added (newest 6), top-10 (most played) or a genre slug (its 12 most played tracks).
/// </summary>
public sealed record GetHomeShelfQuery(string Key) : IRequest<Result<HomeShelfDto>>;

public sealed class GetHomeShelfQueryHandler(IHummiDbContext db, TimeProvider clock) : IRequestHandler<GetHomeShelfQuery, Result<HomeShelfDto>>
{
    public const int RecentlyAddedCount = 6;
    public const int TopCount = 10;
    public const int GenreShelfCount = 12;
    public static readonly TimeSpan NewFor = TimeSpan.FromDays(7);

    public static readonly Error UnknownShelf = Error.NotFound("SHELF_NOT_FOUND", "This shelf isn’t on Home");

    public async Task<Result<HomeShelfDto>> Handle(GetHomeShelfQuery request, CancellationToken cancellationToken)
    {
        var playable = db.Tracks.AsNoTracking().Where(t => !t.Withdrawn);
        IQueryable<Domain.Catalogue.Track> shelf;
        switch (request.Key)
        {
            case "recently-added":
                shelf = playable.OrderByDescending(t => t.AddedAt).Take(RecentlyAddedCount);
                break;
            case "top-10":
                shelf = playable.OrderByDescending(t => t.PlayCount).ThenBy(t => t.Title).Take(TopCount);
                break;
            default:
                var genre = await db.Genres.AsNoTracking().SingleOrDefaultAsync(g => g.Slug == request.Key, cancellationToken);
                if (genre is null)
                {
                    return UnknownShelf;
                }

                shelf = playable.Where(t => t.GenreId == genre.Id).OrderByDescending(t => t.PlayCount).ThenBy(t => t.Title).Take(GenreShelfCount);
                break;
        }

        var since = clock.GetUtcNow() - NewFor;
        var rows = await shelf.Select(t => new { t.Id, t.AddedAt }).ToListAsync(cancellationToken);
        var tracks = await shelf.ToSummaries().ToListAsync(cancellationToken);
        var fresh = rows.Where(r => r.AddedAt >= since).Select(r => r.Id.ToString()).ToList();
        return new HomeShelfDto(request.Key, tracks, fresh);
    }
}
