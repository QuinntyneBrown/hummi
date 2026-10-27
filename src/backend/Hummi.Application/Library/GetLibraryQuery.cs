using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Application.Playback;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Library;

/// <summary>The signed-in listener's library (L2-019), read fresh on every load so every device agrees (AC5).</summary>
public sealed record GetLibraryQuery(Guid ListenerId) : IRequest<Result<LibraryDto>>;

/// <summary>A playlist tile: "{n} tracks · {owner}" (L2-019 AC2). Playlists arrive with journey 10.</summary>
public sealed record PlaylistTileDto(string Id, string Name, int TrackCount, string OwnerName, string? CoverUrl);

/// <summary>A followed artist tile; CoverUrl is the cover of the artist's most played track.</summary>
public sealed record ArtistTileDto(string Slug, string Name, int MonthlyListeners, string? CoverUrl);

/// <summary>Counts for the subtitle and the three tabs; liked tracks and follows newest first.</summary>
public sealed record LibraryDto(
    int PlaylistCount,
    int LikedCount,
    int FollowingCount,
    IReadOnlyList<PlaylistTileDto> Playlists,
    IReadOnlyList<TrackSummaryDto> Liked,
    IReadOnlyList<ArtistTileDto> Following);

public sealed class GetLibraryQueryHandler(IHummiDbContext db) : IRequestHandler<GetLibraryQuery, Result<LibraryDto>>
{
    public async Task<Result<LibraryDto>> Handle(GetLibraryQuery request, CancellationToken cancellationToken)
    {
        var likes = await db.TrackLikes.AsNoTracking().Where(l => l.ListenerId == request.ListenerId)
            .Select(l => new { l.TrackId, l.LikedAt }).ToListAsync(cancellationToken);
        var likedIds = likes.Select(l => l.TrackId).ToList();
        var tracks = await db.Tracks.AsNoTracking().Where(t => likedIds.Contains(t.Id) && !t.Withdrawn).ToSummaries().ToListAsync(cancellationToken);
        var liked = tracks
            .OrderByDescending(t => likes.First(l => l.TrackId.ToString() == t.Id).LikedAt)
            .Select(t => t with { Liked = true })
            .ToList();

        var follows = await db.ArtistFollows.AsNoTracking().Where(f => f.ListenerId == request.ListenerId)
            .OrderByDescending(f => f.FollowedAt).Select(f => f.ArtistId).ToListAsync(cancellationToken);
        var artists = await db.Artists.AsNoTracking().Where(a => follows.Contains(a.Id))
            .Select(a => new
            {
                a.Id,
                Tile = new ArtistTileDto(
                    a.Slug,
                    a.Name,
                    a.MonthlyListeners,
                    db.Tracks.Where(t => t.ArtistId == a.Id && !t.Withdrawn).OrderByDescending(t => t.PlayCount).Select(t => t.CoverUrl).FirstOrDefault()),
            })
            .ToListAsync(cancellationToken);
        var following = follows.Select(id => artists.Single(a => a.Id == id).Tile).ToList();

        return new LibraryDto(0, liked.Count, following.Count, [], liked, following);
    }
}
