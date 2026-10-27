namespace Hummi.Domain.Catalogue;

/// <summary>That a listener, or an anonymous visitor when <see cref="ListenerId"/> is null, started a track.</summary>
public sealed class PlayEvent
{
    private PlayEvent(Guid id, Guid trackId, Guid? listenerId, DateTimeOffset playedAt)
    {
        Id = id;
        TrackId = trackId;
        ListenerId = listenerId;
        PlayedAt = playedAt;
    }

    public Guid Id { get; private set; }

    public Guid TrackId { get; private set; }

    public Guid? ListenerId { get; private set; }

    public DateTimeOffset PlayedAt { get; private set; }

    internal static PlayEvent Create(Guid trackId, Guid? listenerId, DateTimeOffset playedAt) =>
        new(Guid.NewGuid(), trackId, listenerId, playedAt);
}
