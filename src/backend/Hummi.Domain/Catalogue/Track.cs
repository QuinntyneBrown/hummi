namespace Hummi.Domain.Catalogue;

/// <summary>
/// A playable recording. Its audio lives on the media volume at <see cref="AudioPath"/>; a withdrawn
/// track stays in the catalogue for its history but can no longer be streamed or played.
/// </summary>
public sealed class Track
{
    private Track(Guid id, string slug, string title, Guid artistId, int durationSeconds, string? coverUrl, DateTimeOffset addedAt, Guid? genreId, Licence licence)
    {
        GenreId = genreId;
        Id = id;
        Slug = slug;
        Title = title;
        ArtistId = artistId;
        DurationSeconds = durationSeconds;
        CoverUrl = coverUrl;
        AddedAt = addedAt;
        Licence = licence;
    }

    public Guid Id { get; private set; }

    /// <summary>The track's segment of <c>/tracks/{slug}</c>.</summary>
    public string Slug { get; private set; }

    public string Title { get; private set; }

    public Guid ArtistId { get; private set; }

    public Artist? Artist { get; private set; }

    /// <summary>The genre the track is listed under; null until it is classified.</summary>
    public Guid? GenreId { get; private set; }

    /// <summary>The album the track was released on, if any, and its position there from 1.</summary>
    public Guid? AlbumId { get; private set; }

    public int AlbumPosition { get; private set; }

    /// <summary>Exactly one of the three open licences (L2-012).</summary>
    public Licence Licence { get; private set; }

    /// <summary>Precomputed amplitude peaks, 0 to 100, drawn as the waveform; empty until computed.</summary>
    public byte[] Waveform { get; private set; } = [];

    public int DurationSeconds { get; private set; }

    public string? CoverUrl { get; private set; }

    public DateTimeOffset AddedAt { get; private set; }

    public long PlayCount { get; private set; }

    public bool Withdrawn { get; private set; }

    public bool IsPlayable => !Withdrawn;

    /// <summary>Location of the audio file, relative to the media root.</summary>
    public string AudioPath => $"tracks/{Id}.wav";

    public static Track Create(
        string title,
        Guid artistId,
        int durationSeconds,
        string? coverUrl,
        DateTimeOffset addedAt,
        Guid? genreId = null,
        Licence licence = Licence.Cc0,
        string? slug = null,
        Guid? albumId = null,
        int albumPosition = 0)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(durationSeconds);
        if (!Enum.IsDefined(licence))
        {
            throw new ArgumentOutOfRangeException(nameof(licence), licence, "A track carries one of the three Hummi licences.");
        }

        return new Track(Guid.NewGuid(), slug ?? Catalogue.Slug.From(title), title.Trim(), artistId, durationSeconds, coverUrl, addedAt, genreId, licence)
        {
            AlbumId = albumId,
            AlbumPosition = albumId is null ? 0 : albumPosition,
        };
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

    public void SetWaveform(byte[] peaks)
    {
        if (peaks.Any(p => p > 100))
        {
            throw new ArgumentOutOfRangeException(nameof(peaks), "Peaks run from 0 to 100.");
        }

        Waveform = [.. peaks];
    }

    public void Withdraw() => Withdrawn = true;
}
