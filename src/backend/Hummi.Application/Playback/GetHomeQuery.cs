using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Playback;

/// <summary>Home's shelves: Recently added, newest first, and the Top 10 by play count (ADR 0005).</summary>
public sealed record GetHomeQuery : IRequest<Result<HomeDto>>;

public sealed record HomeDto(IReadOnlyList<TrackSummaryDto> RecentlyAdded, IReadOnlyList<TrackSummaryDto> TopTen);

public sealed class GetHomeQueryHandler(IHummiDbContext db) : IRequestHandler<GetHomeQuery, Result<HomeDto>>
{
    public const int RecentlyAddedCount = 6;
    public const int TopCount = 10;

    public async Task<Result<HomeDto>> Handle(GetHomeQuery request, CancellationToken cancellationToken)
    {
        var playable = db.Tracks.AsNoTracking().Where(t => !t.Withdrawn);
        var recent = await playable.OrderByDescending(t => t.AddedAt).Take(RecentlyAddedCount).ToSummaries().ToListAsync(cancellationToken);
        var top = await playable.OrderByDescending(t => t.PlayCount).ThenBy(t => t.Title).Take(TopCount).ToSummaries().ToListAsync(cancellationToken);
        return new HomeDto(recent, top);
    }
}
