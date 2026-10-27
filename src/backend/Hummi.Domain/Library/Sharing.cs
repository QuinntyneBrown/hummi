using System.Security.Cryptography;

namespace Hummi.Domain.Library;

/// <summary>What a share link points at.</summary>
public enum ShareTarget
{
    Track = 1,
    Playlist = 2,
}

/// <summary>
/// A share link `/s/{code}` to a track or playlist (L2-025, L2-026): one per target, reused by everyone who
/// shares it. A playlist link also lets anyone open that playlist while it is private (ADR 0014).
/// </summary>
public sealed class ShareLink
{
    /// <summary>8 characters from 31 letters and digits without look-alikes (no 0, 1, i, l, o).</summary>
    public const int CodeLength = 8;

    public const string Alphabet = "23456789abcdefghjkmnpqrstuvwxyz";

    private ShareLink(Guid id, string code, ShareTarget targetType, Guid targetId, DateTimeOffset createdAt)
    {
        Id = id;
        Code = code;
        TargetType = targetType;
        TargetId = targetId;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }

    public string Code { get; private set; }

    public ShareTarget TargetType { get; private set; }

    public Guid TargetId { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public static ShareLink Create(ShareTarget targetType, Guid targetId, DateTimeOffset now) =>
        new(Guid.NewGuid(), NewCode(), targetType, targetId, now);

    public static string NewCode() =>
        new(Enumerable.Range(0, CodeLength).Select(_ => Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)]).ToArray());
}

/// <summary>Someone else's playlist kept in a listener's Library (L2-024 AC3); it stays read-only.</summary>
public sealed class SavedPlaylist
{
    private SavedPlaylist(Guid listenerId, Guid playlistId, DateTimeOffset savedAt)
    {
        ListenerId = listenerId;
        PlaylistId = playlistId;
        SavedAt = savedAt;
    }

    public Guid ListenerId { get; private set; }

    public Guid PlaylistId { get; private set; }

    public DateTimeOffset SavedAt { get; private set; }

    public static SavedPlaylist Create(Guid listenerId, Guid playlistId, DateTimeOffset now) => new(listenerId, playlistId, now);
}
