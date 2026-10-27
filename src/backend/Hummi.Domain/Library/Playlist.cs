namespace Hummi.Domain.Library;

/// <summary>A playlist name: trimmed, 1 to 60 characters (L2-021 AC3, AC4).</summary>
public static class PlaylistName
{
    public const int MaxLength = 60;

    /// <summary>The trimmed name, or null when it is empty or too long.</summary>
    public static string? Parse(string? name)
    {
        var trimmed = (name ?? string.Empty).Trim();
        return trimmed.Length is 0 or > MaxLength ? null : trimmed;
    }
}

/// <summary>
/// A listener's playlist (L2-020 to L2-023): a name, private or public, and ordered entries. The same track
/// may appear twice when the owner chooses Add again. Only the owner changes it.
/// </summary>
public sealed class Playlist
{
    private readonly List<PlaylistEntry> entries = [];

    private Playlist(Guid id, Guid ownerId, string name, bool isPublic, DateTimeOffset createdAt)
    {
        Id = id;
        OwnerId = ownerId;
        Name = name;
        IsPublic = isPublic;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }

    public Guid OwnerId { get; private set; }

    public string Name { get; private set; }

    public bool IsPublic { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public IReadOnlyList<PlaylistEntry> Entries => entries;

    /// <summary>A new playlist; the name must already be valid (<see cref="PlaylistName.Parse"/>).</summary>
    public static Playlist Create(Guid ownerId, string name, bool isPublic, DateTimeOffset now) =>
        new(Guid.NewGuid(), ownerId, name, isPublic, now);

    public bool Contains(Guid trackId) => entries.Any(e => e.TrackId == trackId);

    public void Rename(string name, bool isPublic)
    {
        Name = name;
        IsPublic = isPublic;
    }

    /// <summary>Appends the track and returns its 1-based position.</summary>
    public int AddTrack(Guid trackId, DateTimeOffset now)
    {
        var position = entries.Count == 0 ? 1 : entries.Max(e => e.Position) + 1;
        entries.Add(PlaylistEntry.Create(Id, trackId, position, now));
        return entries.Count;
    }

    /// <summary>Removes every entry of the track (Save with the playlist unchecked).</summary>
    public void RemoveTrack(Guid trackId) => entries.RemoveAll(e => e.TrackId == trackId);

    /// <summary>Removes the given entries (multi-select Remove from playlist).</summary>
    public void RemoveEntries(IReadOnlyCollection<Guid> entryIds) => entries.RemoveAll(e => entryIds.Contains(e.Id));
}

/// <summary>One track at one position of a playlist.</summary>
public sealed class PlaylistEntry
{
    private PlaylistEntry(Guid id, Guid playlistId, Guid trackId, int position, DateTimeOffset addedAt)
    {
        Id = id;
        PlaylistId = playlistId;
        TrackId = trackId;
        Position = position;
        AddedAt = addedAt;
    }

    public Guid Id { get; private set; }

    public Guid PlaylistId { get; private set; }

    public Guid TrackId { get; private set; }

    public int Position { get; private set; }

    public DateTimeOffset AddedAt { get; private set; }

    internal static PlaylistEntry Create(Guid playlistId, Guid trackId, int position, DateTimeOffset now) =>
        new(Guid.NewGuid(), playlistId, trackId, position, now);
}
