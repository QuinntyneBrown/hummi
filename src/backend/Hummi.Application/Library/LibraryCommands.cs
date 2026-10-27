using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Application.Playback;
using Hummi.Domain.Library;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Library;

/// <summary>Likes or unlikes a track (L2-018 AC1, AC2). Idempotent: a repeat changes nothing; an unknown track answers 404.</summary>
public sealed record SetTrackLikeCommand(Guid ListenerId, string TrackId, bool Liked) : IRequest<Result<Unit>>;

public sealed class SetTrackLikeCommandHandler(IHummiDbContext db, TimeProvider clock) : IRequestHandler<SetTrackLikeCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(SetTrackLikeCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(request.TrackId, out var trackId) || !await db.Tracks.AnyAsync(t => t.Id == trackId, cancellationToken))
        {
            return PlaybackErrors.TrackNotFound;
        }

        var like = await db.TrackLikes.SingleOrDefaultAsync(l => l.ListenerId == request.ListenerId && l.TrackId == trackId, cancellationToken);
        if (request.Liked && like is null)
        {
            db.TrackLikes.Add(TrackLike.Create(request.ListenerId, trackId, clock.GetUtcNow()));
        }
        else if (!request.Liked && like is not null)
        {
            db.TrackLikes.Remove(like);
        }

        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

/// <summary>Follows or unfollows an artist by slug (L2-018 AC3). Idempotent; an unknown artist answers 404.</summary>
public sealed record SetArtistFollowCommand(Guid ListenerId, string ArtistSlug, bool Following) : IRequest<Result<Unit>>;

public sealed class SetArtistFollowCommandHandler(IHummiDbContext db, TimeProvider clock) : IRequestHandler<SetArtistFollowCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(SetArtistFollowCommand request, CancellationToken cancellationToken)
    {
        var artistId = await db.Artists.Where(a => a.Slug == request.ArtistSlug).Select(a => (Guid?)a.Id).SingleOrDefaultAsync(cancellationToken);
        if (artistId is null)
        {
            return Catalogue.CatalogueErrors.ArtistNotFound;
        }

        var follow = await db.ArtistFollows.SingleOrDefaultAsync(f => f.ListenerId == request.ListenerId && f.ArtistId == artistId, cancellationToken);
        if (request.Following && follow is null)
        {
            db.ArtistFollows.Add(ArtistFollow.Create(request.ListenerId, artistId.Value, clock.GetUtcNow()));
        }
        else if (!request.Following && follow is not null)
        {
            db.ArtistFollows.Remove(follow);
        }

        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
