namespace Hummi.Domain.Library;

/// <summary>The four kinds of notification (L2-036 AC2).</summary>
public enum NotificationKind
{
    /// <summary>"{artist} released {track}." for listeners following the artist.</summary>
    Release = 1,

    /// <summary>"{owner} shared the playlist {playlist} with you." when a listener opens a playlist's share link.</summary>
    Share = 2,

    /// <summary>"{track} passed {n} plays." for listeners following the track's artist.</summary>
    Milestone = 3,

    /// <summary>A product change, sent to every listener.</summary>
    Product = 4,
}

/// <summary>
/// One notification for one listener (L2-036, L2-037). Actor and item are the linked names of the text;
/// Key makes each fact notify a listener once (for example the track and the milestone it passed).
/// </summary>
public sealed class Notification
{
    private Notification(Guid id, Guid listenerId, NotificationKind kind, string key, string? actorName, string? actorLink, string? itemName, string? itemLink, long? plays, string? text, DateTimeOffset createdAt)
    {
        Id = id;
        ListenerId = listenerId;
        Kind = kind;
        Key = key;
        ActorName = actorName;
        ActorLink = actorLink;
        ItemName = itemName;
        ItemLink = itemLink;
        Plays = plays;
        Text = text;
        CreatedAt = createdAt;
    }

    /// <summary>The play counts a milestone notification marks (ADR 0017).</summary>
    public static readonly IReadOnlyList<long> Milestones = [1_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

    public Guid Id { get; private set; }

    public Guid ListenerId { get; private set; }

    public NotificationKind Kind { get; private set; }

    public string Key { get; private set; }

    public string? ActorName { get; private set; }

    public string? ActorLink { get; private set; }

    public string? ItemName { get; private set; }

    public string? ItemLink { get; private set; }

    public long? Plays { get; private set; }

    /// <summary>The whole text of a product change.</summary>
    public string? Text { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset? ReadAt { get; private set; }

    public static Notification Release(Guid listenerId, string artist, string artistSlug, Guid trackId, string track, string trackSlug, DateTimeOffset now) =>
        new(Guid.NewGuid(), listenerId, NotificationKind.Release, $"release:{trackId}", artist, $"/artists/{artistSlug}", track, $"/tracks/{trackSlug}", null, null, now);

    public static Notification Share(Guid listenerId, string owner, Guid playlistId, string playlist, string link, DateTimeOffset now) =>
        new(Guid.NewGuid(), listenerId, NotificationKind.Share, $"share:{playlistId}", owner, null, playlist, link, null, null, now);

    public static Notification Milestone(Guid listenerId, Guid trackId, string track, string trackSlug, long plays, DateTimeOffset now) =>
        new(Guid.NewGuid(), listenerId, NotificationKind.Milestone, $"milestone:{trackId}:{plays}", null, null, track, $"/tracks/{trackSlug}", plays, null, now);

    public static Notification Product(Guid listenerId, string key, string text, DateTimeOffset now) =>
        new(Guid.NewGuid(), listenerId, NotificationKind.Product, $"product:{key}", null, null, null, null, null, text, now);

    public void MarkRead(DateTimeOffset at) => ReadAt ??= at;
}
