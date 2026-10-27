using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Playback;

/// <summary>Opens the audio of a playable track from the media volume. Anyone may stream (L2-014).</summary>
public sealed record GetTrackStreamQuery(Guid TrackId) : IRequest<Result<MediaFile>>;

public sealed class GetTrackStreamQueryHandler(IHummiDbContext db, IMediaStore media) : IRequestHandler<GetTrackStreamQuery, Result<MediaFile>>
{
    public async Task<Result<MediaFile>> Handle(GetTrackStreamQuery request, CancellationToken cancellationToken)
    {
        var track = await db.Tracks.AsNoTracking().SingleOrDefaultAsync(t => t.Id == request.TrackId, cancellationToken);
        if (track is null)
        {
            return PlaybackErrors.TrackNotFound;
        }

        if (!track.IsPlayable)
        {
            return PlaybackErrors.TrackWithdrawn;
        }

        return media.Open(track.AudioPath) is { } file ? file : PlaybackErrors.TrackNotFound;
    }
}
