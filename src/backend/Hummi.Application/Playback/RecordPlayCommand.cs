using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Playback;

/// <summary>Records that playback of a track started, for a signed-in listener or anonymously (L2-014).</summary>
public sealed record RecordPlayCommand(Guid TrackId, Guid? ListenerId) : IRequest<Result<Unit>>;

public sealed class RecordPlayCommandHandler(IHummiDbContext db, TimeProvider clock) : IRequestHandler<RecordPlayCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(RecordPlayCommand request, CancellationToken cancellationToken)
    {
        var track = await db.Tracks.SingleOrDefaultAsync(t => t.Id == request.TrackId, cancellationToken);
        if (track is null)
        {
            return PlaybackErrors.TrackNotFound;
        }

        if (!track.IsPlayable)
        {
            return PlaybackErrors.TrackWithdrawn;
        }

        db.PlayEvents.Add(track.RegisterPlay(request.ListenerId, clock.GetUtcNow()));
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
