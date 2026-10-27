namespace Hummi.Domain.Catalogue;

/// <summary>
/// A playable recording. Its audio lives on the media volume at <see cref="AudioPath"/>; a withdrawn
/// track stays in the catalogue for its history but can no longer be streamed or played.
/// </summary>
public sealed class Track
{
    private Track(Guid id, string title, Guid artistId, int durationSeconds, string? coverUrl, DateTimeOffset addedAt)
    {
        Id = id;
        Title = title;
        ArtistId = artistId;
        DurationSeconds = durationSeconds;
        CoverUrl = coverUrl;
        AddedAt = addedAt;
    }

    public Guid Id { get; private set; }

    public string Title { get; private set; }

    public Guid ArtistId { get; private set; }

    public Artist? Artist { get; private set; }

    public int DurationSeconds { get; private set; }

    public string? CoverUrl { get; private set; }

    public DateTimeOffset AddedAt { get; private set; }

    public long PlayCount { get; private set; }

    public bool Withdrawn { get; private set; }

    public bool IsPlayable => !Withdrawn;

    /// <summary>Location of the audio file, relative to the media root.</summary>
    public string AudioPath => $"tracks/{Id}.wav";

    public static Track Create(string title, Guid artistId, int durationSeconds, string? coverUrl, DateTimeOffset addedAt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(durationSeconds);
        return new Track(Guid.NewGuid(), title.Trim(), artistId, durationSeconds, coverUrl, addedAt);
    }

    /// <summary>Counts a play that started now; a play counts as soon as playback starts.</summary>
    public PlayEvent RegisterPlay(Guid? listenerId, DateTimeOffset playedAt)
    {
        if (!IsPlayable)
        {
            throw new InvalidOperationException("A withdrawn track cannot be played.");
        }

        PlayCount++;
        return PlayEvent.Create(Id, listenerId, playedAt);
    }

    public void Withdraw() => Withdrawn = true;
}
