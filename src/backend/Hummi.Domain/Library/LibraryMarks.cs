namespace Hummi.Domain.Library;

/// <summary>A listener's like of a track (L2-018). One row per listener and track; liking twice changes nothing.</summary>
public sealed class TrackLike
{
    private TrackLike(Guid listenerId, Guid trackId, DateTimeOffset likedAt)
    {
        ListenerId = listenerId;
        TrackId = trackId;
        LikedAt = likedAt;
    }

    public Guid ListenerId { get; private set; }

    public Guid TrackId { get; private set; }

    public DateTimeOffset LikedAt { get; private set; }

    public static TrackLike Create(Guid listenerId, Guid trackId, DateTimeOffset now) => new(listenerId, trackId, now);
}

/// <summary>A listener following an artist (L2-018). One row per listener and artist; following twice changes nothing.</summary>
public sealed class ArtistFollow
{
    private ArtistFollow(Guid listenerId, Guid artistId, DateTimeOffset followedAt)
    {
        ListenerId = listenerId;
        ArtistId = artistId;
        FollowedAt = followedAt;
    }

    public Guid ListenerId { get; private set; }

    public Guid ArtistId { get; private set; }

    public DateTimeOffset FollowedAt { get; private set; }

    public static ArtistFollow Create(Guid listenerId, Guid artistId, DateTimeOffset now) => new(listenerId, artistId, now);
}
