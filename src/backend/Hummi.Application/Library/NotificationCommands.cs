using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Domain.Library;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Library;

/// <summary>One notification as the page lists it; the client words it by kind (L2-036 AC2).</summary>
public sealed record NotificationDto(
    string Id,
    string Kind,
    string? ActorName,
    string? ActorLink,
    string? ItemName,
    string? ItemLink,
    long? Plays,
    string? Text,
    DateTimeOffset CreatedAt,
    bool Unread)
{
    public static NotificationDto From(Notification n) => new(
        n.Id.ToString(), n.Kind.ToString().ToLowerInvariant(), n.ActorName, n.ActorLink, n.ItemName, n.ItemLink, n.Plays, n.Text, n.CreatedAt, n.ReadAt is null);
}

public sealed record NotificationsDto(int Unread, IReadOnlyList<NotificationDto> Items);

/// <summary>The listener's notifications, newest first, with the unread count (L2-036, L2-037 AC2).</summary>
public sealed record GetNotificationsQuery(Guid ListenerId) : IRequest<Result<NotificationsDto>>;

public sealed class GetNotificationsQueryHandler(IHummiDbContext db) : IRequestHandler<GetNotificationsQuery, Result<NotificationsDto>>
{
    public const int PageSize = 50;

    public async Task<Result<NotificationsDto>> Handle(GetNotificationsQuery request, CancellationToken cancellationToken)
    {
        var mine = db.Notifications.AsNoTracking().Where(n => n.ListenerId == request.ListenerId);
        var unread = await mine.CountAsync(n => n.ReadAt == null, cancellationToken);
        var items = await mine.OrderByDescending(n => n.CreatedAt).Take(PageSize).ToListAsync(cancellationToken);
        return new NotificationsDto(unread, items.Select(NotificationDto.From).ToList());
    }
}

/// <summary>The header bell's count (L2-037 AC1).</summary>
public sealed record GetUnreadCountQuery(Guid ListenerId) : IRequest<Result<int>>;

public sealed class GetUnreadCountQueryHandler(IHummiDbContext db) : IRequestHandler<GetUnreadCountQuery, Result<int>>
{
    public async Task<Result<int>> Handle(GetUnreadCountQuery request, CancellationToken cancellationToken) =>
        await db.Notifications.CountAsync(n => n.ListenerId == request.ListenerId && n.ReadAt == null, cancellationToken);
}

/// <summary>Mark all as read (L2-037 AC3).</summary>
public sealed record MarkAllNotificationsReadCommand(Guid ListenerId) : IRequest<Result<Unit>>;

public sealed class MarkAllNotificationsReadCommandHandler(IHummiDbContext db, TimeProvider clock) : IRequestHandler<MarkAllNotificationsReadCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(MarkAllNotificationsReadCommand request, CancellationToken cancellationToken)
    {
        var now = clock.GetUtcNow();
        var unread = await db.Notifications.Where(n => n.ListenerId == request.ListenerId && n.ReadAt == null).ToListAsync(cancellationToken);
        unread.ForEach(n => n.MarkRead(now));
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

/// <summary>
/// The worker's sweep (L2-036 AC2): a release notification to each follower of an artist for tracks added in
/// the last <see cref="ReleaseWindow"/>, and a milestone notification to each follower when a track's plays
/// pass one of <see cref="Notification.Milestones"/>. Each fact notifies a listener once. Returns how many were created.
/// </summary>
public sealed record CreateDueNotificationsCommand : IRequest<Result<int>>;

public sealed class CreateDueNotificationsCommandHandler(IHummiDbContext db, TimeProvider clock) : IRequestHandler<CreateDueNotificationsCommand, Result<int>>
{
    public static readonly TimeSpan ReleaseWindow = TimeSpan.FromDays(7);

    public async Task<Result<int>> Handle(CreateDueNotificationsCommand request, CancellationToken cancellationToken)
    {
        var now = clock.GetUtcNow();
        var since = now - ReleaseWindow;
        var lowest = Notification.Milestones[0];
        var tracks = await db.Tracks.AsNoTracking()
            .Where(t => !t.Withdrawn && (t.AddedAt >= since || t.PlayCount >= lowest))
            .Join(db.Artists, t => t.ArtistId, a => a.Id, (t, a) => new { t.Id, t.Title, t.Slug, t.AddedAt, t.PlayCount, t.ArtistId, Artist = a.Name, ArtistSlug = a.Slug })
            .ToListAsync(cancellationToken);
        var artistIds = tracks.Select(t => t.ArtistId).Distinct().ToList();
        var followers = (await db.ArtistFollows.AsNoTracking().Where(f => artistIds.Contains(f.ArtistId)).ToListAsync(cancellationToken))
            .ToLookup(f => f.ArtistId, f => f.ListenerId);

        var candidates = new List<Notification>();
        foreach (var t in tracks)
        {
            foreach (var listener in followers[t.ArtistId])
            {
                if (t.AddedAt >= since)
                {
                    candidates.Add(Notification.Release(listener, t.Artist, t.ArtistSlug, t.Id, t.Title, t.Slug, now));
                }

                var passed = Notification.Milestones.Where(m => t.PlayCount >= m).DefaultIfEmpty(0).Max();
                if (passed > 0)
                {
                    candidates.Add(Notification.Milestone(listener, t.Id, t.Title, t.Slug, passed, now));
                }
            }
        }

        var listeners = candidates.Select(c => c.ListenerId).Distinct().ToList();
        var keys = candidates.Select(c => c.Key).Distinct().ToList();
        var existing = (await db.Notifications.AsNoTracking()
                .Where(n => listeners.Contains(n.ListenerId) && keys.Contains(n.Key))
                .Select(n => new { n.ListenerId, n.Key })
                .ToListAsync(cancellationToken))
            .Select(n => (n.ListenerId, n.Key))
            .ToHashSet();
        var fresh = candidates.Where(c => existing.Add((c.ListenerId, c.Key))).ToList();
        db.Notifications.AddRange(fresh);
        await db.SaveChangesAsync(cancellationToken);
        return fresh.Count;
    }
}

/// <summary>Announces a product change to every listener (L2-036 AC2); Key names the change so it is sent once.</summary>
public sealed record AnnounceProductChangeCommand(string Key, string Text) : IRequest<Result<int>>;

public sealed class AnnounceProductChangeCommandHandler(IHummiDbContext db, TimeProvider clock) : IRequestHandler<AnnounceProductChangeCommand, Result<int>>
{
    public async Task<Result<int>> Handle(AnnounceProductChangeCommand request, CancellationToken cancellationToken)
    {
        var key = $"product:{request.Key}";
        var told = db.Notifications.Where(n => n.Key == key).Select(n => n.ListenerId);
        var listeners = await db.Listeners.Where(l => !told.Contains(l.Id)).Select(l => l.Id).ToListAsync(cancellationToken);
        var now = clock.GetUtcNow();
        db.Notifications.AddRange(listeners.Select(l => Notification.Product(l, request.Key, request.Text, now)));
        await db.SaveChangesAsync(cancellationToken);
        return listeners.Count;
    }
}

/// <summary>
/// "{owner} shared the playlist {name} with you." (L2-036 AC2): sent once when a signed-in listener opens
/// someone else's playlist through its share link (ADR 0017). Anything else is ignored.
/// </summary>
public sealed record RecordPlaylistShareCommand(Guid ListenerId, string PlaylistId, string ShareCode) : IRequest<Result<Unit>>;

public sealed class RecordPlaylistShareCommandHandler(IHummiDbContext db, TimeProvider clock) : IRequestHandler<RecordPlaylistShareCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(RecordPlaylistShareCommand request, CancellationToken cancellationToken)
    {
        var code = (request.ShareCode ?? string.Empty).Trim().ToLowerInvariant();
        if (!Guid.TryParse(request.PlaylistId, out var id)
            || !await db.ShareLinks.AnyAsync(l => l.Code == code && l.TargetType == ShareTarget.Playlist && l.TargetId == id, cancellationToken))
        {
            return Unit.Value;
        }

        var playlist = await db.Playlists.AsNoTracking().SingleOrDefaultAsync(p => p.Id == id, cancellationToken);
        var key = $"share:{id}";
        if (playlist is null || playlist.OwnerId == request.ListenerId
            || await db.Notifications.AnyAsync(n => n.ListenerId == request.ListenerId && n.Key == key, cancellationToken))
        {
            return Unit.Value;
        }

        var owner = await db.Listeners.Where(l => l.Id == playlist.OwnerId).Select(l => l.DisplayName).SingleAsync(cancellationToken);
        db.Notifications.Add(Notification.Share(request.ListenerId, owner, id, playlist.Name, $"/playlists/{id}?share={code}", clock.GetUtcNow()));
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
