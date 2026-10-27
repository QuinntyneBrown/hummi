using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Catalogue;

/// <summary>
/// Recomputes every artist's monthly listeners: distinct signed-in listeners who started one of the
/// artist's tracks in the last 30 days (L2-010). Anonymous plays cannot be told apart, so they are not
/// counted. Returns how many artists changed.
/// </summary>
public sealed record RefreshMonthlyListenersCommand : IRequest<Result<int>>;

public sealed class RefreshMonthlyListenersCommandHandler(IHummiDbContext db, TimeProvider clock)
    : IRequestHandler<RefreshMonthlyListenersCommand, Result<int>>
{
    public static readonly TimeSpan Window = TimeSpan.FromDays(30);

    public async Task<Result<int>> Handle(RefreshMonthlyListenersCommand request, CancellationToken cancellationToken)
    {
        var since = clock.GetUtcNow() - Window;
        var counts = await db.PlayEvents.AsNoTracking()
            .Where(p => p.PlayedAt >= since && p.ListenerId != null)
            .Join(db.Tracks, p => p.TrackId, t => t.Id, (p, t) => new { t.ArtistId, p.ListenerId })
            .Distinct()
            .GroupBy(x => x.ArtistId)
            .Select(g => new { ArtistId = g.Key, Listeners = g.Count() })
            .ToDictionaryAsync(x => x.ArtistId, x => x.Listeners, cancellationToken);

        var changed = 0;
        foreach (var artist in await db.Artists.ToListAsync(cancellationToken))
        {
            var listeners = counts.GetValueOrDefault(artist.Id);
            if (artist.MonthlyListeners != listeners)
            {
                artist.SetMonthlyListeners(listeners);
                changed++;
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        return changed;
    }
}
