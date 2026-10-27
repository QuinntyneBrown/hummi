using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Domain.Library;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Library;

/// <summary>A share link: its code, for `/s/{code}`.</summary>
public sealed record ShareLinkDto(string Code);

/// <summary>What `/s/{code}` opens: a track by slug, or a playlist by id.</summary>
public sealed record SharedItemDto(string Type, string? TrackSlug, string? PlaylistId);

public static class SharingErrors
{
    public static readonly Error LinkNotFound = Error.NotFound("LINK_NOT_FOUND", "This link didn’t work");

    public static readonly Error AlreadyYours = new(409, "OWN_PLAYLIST", "This playlist is already yours");
}

/// <summary>
/// The link of a track or playlist (L2-025), created on first use and the same for everyone after. Anyone may
/// share a track or a public playlist; a private playlist only by its owner.
/// </summary>
public sealed record GetOrCreateShareLinkCommand(Guid? ListenerId, string Type, string Id) : IRequest<Result<ShareLinkDto>>;

public sealed class GetOrCreateShareLinkCommandHandler(IHummiDbContext db, TimeProvider clock) : IRequestHandler<GetOrCreateShareLinkCommand, Result<ShareLinkDto>>
{
    public async Task<Result<ShareLinkDto>> Handle(GetOrCreateShareLinkCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(request.Id, out var id))
        {
            return SharingErrors.LinkNotFound;
        }

        ShareTarget target;
        if (request.Type == "track")
        {
            if (!await db.Tracks.AnyAsync(t => t.Id == id && !t.Withdrawn, cancellationToken))
            {
                return Playback.PlaybackErrors.TrackNotFound;
            }

            target = ShareTarget.Track;
        }
        else if (request.Type == "playlist")
        {
            var playlist = await db.Playlists.AsNoTracking().SingleOrDefaultAsync(p => p.Id == id, cancellationToken);
            if (playlist is null)
            {
                return PlaylistErrors.NotFound;
            }

            if (!playlist.IsPublic && playlist.OwnerId != request.ListenerId)
            {
                return PlaylistErrors.Private;
            }

            target = ShareTarget.Playlist;
        }
        else
        {
            return SharingErrors.LinkNotFound;
        }

        var link = await db.ShareLinks.SingleOrDefaultAsync(l => l.TargetType == target && l.TargetId == id, cancellationToken);
        if (link is null)
        {
            link = ShareLink.Create(target, id, clock.GetUtcNow());
            while (await db.ShareLinks.AnyAsync(l => l.Code == link.Code, cancellationToken))
            {
                link = ShareLink.Create(target, id, clock.GetUtcNow());
            }

            db.ShareLinks.Add(link);
            await db.SaveChangesAsync(cancellationToken);
        }

        return new ShareLinkDto(link.Code);
    }
}

/// <summary>Resolves `/s/{code}` (L2-026). An unknown code, a withdrawn track or a deleted playlist answer 404.</summary>
public sealed record ResolveShareLinkQuery(string Code) : IRequest<Result<SharedItemDto>>;

public sealed class ResolveShareLinkQueryHandler(IHummiDbContext db) : IRequestHandler<ResolveShareLinkQuery, Result<SharedItemDto>>
{
    public async Task<Result<SharedItemDto>> Handle(ResolveShareLinkQuery request, CancellationToken cancellationToken)
    {
        var code = (request.Code ?? string.Empty).Trim().ToLowerInvariant();
        var link = await db.ShareLinks.AsNoTracking().SingleOrDefaultAsync(l => l.Code == code, cancellationToken);
        if (link?.TargetType == ShareTarget.Track)
        {
            var slug = await db.Tracks.Where(t => t.Id == link.TargetId && !t.Withdrawn).Select(t => t.Slug).SingleOrDefaultAsync(cancellationToken);
            if (slug is not null)
            {
                return new SharedItemDto("track", slug, null);
            }
        }
        else if (link?.TargetType == ShareTarget.Playlist && await db.Playlists.AnyAsync(p => p.Id == link.TargetId, cancellationToken))
        {
            return new SharedItemDto("playlist", null, link.TargetId.ToString());
        }

        return SharingErrors.LinkNotFound;
    }
}

/// <summary>Save to my library for someone else's playlist the listener may open (L2-024 AC3); idempotent.</summary>
public sealed record SavePlaylistCommand(Guid ListenerId, string PlaylistId, string? ShareCode, bool Saved) : IRequest<Result<Unit>>;

public sealed class SavePlaylistCommandHandler(IHummiDbContext db, TimeProvider clock) : IRequestHandler<SavePlaylistCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(SavePlaylistCommand request, CancellationToken cancellationToken)
    {
        var access = await PlaylistAccess.ViewableAsync(db, request.ListenerId, request.PlaylistId, request.ShareCode, cancellationToken);
        if (!access.IsSuccess)
        {
            return access.Error!;
        }

        var playlist = access.Value!;
        if (playlist.OwnerId == request.ListenerId)
        {
            return SharingErrors.AlreadyYours;
        }

        var saved = await db.SavedPlaylists.SingleOrDefaultAsync(s => s.ListenerId == request.ListenerId && s.PlaylistId == playlist.Id, cancellationToken);
        if (request.Saved && saved is null)
        {
            db.SavedPlaylists.Add(SavedPlaylist.Create(request.ListenerId, playlist.Id, clock.GetUtcNow()));
        }
        else if (!request.Saved && saved is not null)
        {
            db.SavedPlaylists.Remove(saved);
        }

        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

/// <summary>Who may open a playlist (L2-024 AC4): the owner, anyone when public, anyone with its share link.</summary>
internal static class PlaylistAccess
{
    public static async Task<Result<Playlist>> ViewableAsync(IHummiDbContext db, Guid? listenerId, string playlistId, string? shareCode, CancellationToken cancellationToken)
    {
        var playlist = Guid.TryParse(playlistId, out var id)
            ? await db.Playlists.AsNoTracking().Include(p => p.Entries).SingleOrDefaultAsync(p => p.Id == id, cancellationToken)
            : null;
        if (playlist is null)
        {
            return PlaylistErrors.NotFound;
        }

        if (playlist.OwnerId == listenerId || playlist.IsPublic)
        {
            return playlist;
        }

        var code = (shareCode ?? string.Empty).Trim().ToLowerInvariant();
        var shared = code.Length > 0 && await db.ShareLinks.AnyAsync(l => l.Code == code && l.TargetType == ShareTarget.Playlist && l.TargetId == id, cancellationToken);
        return shared ? playlist : PlaylistErrors.Private;
    }
}
