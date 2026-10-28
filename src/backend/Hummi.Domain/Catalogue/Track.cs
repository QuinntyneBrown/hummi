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

    public Genre? Genre { get; private set; }

    /// <summary>The album the track was released on, if any, and its position there from 1.</summary>
    public Guid? AlbumId { get; private set; }

    public int AlbumPosition { get; private set; }

    /// <summary>Exactly one licence (L2-012); the Pixabay Content License for imported tracks.</summary>
    public Licence Licence { get; private set; }

    /// <summary>Precomputed amplitude peaks, 0 to 100, drawn as the waveform; empty until computed.</summary>
    public byte[] Waveform { get; private set; } = [];

    public int DurationSeconds { get; private set; }

    public string? CoverUrl { get; private set; }

    /// <summary>The track's page at its source, e.g. its Pixabay Music page (ADR 0021); null when unknown.</summary>
    public string? SourceUrl { get; private set; }

    /// <summary>The audio file's extension with its dot: ".mp3" for imported tracks, ".wav" for older rows.</summary>
    public string AudioExtension { get; private set; } = ".mp3";

    public DateTimeOffset AddedAt { get; private set; }

    public long PlayCount { get; private set; }

    public bool Withdrawn { get; private set; }

    public bool IsPlayable => !Withdrawn;

    /// <summary>Location of the audio file, relative to the media root.</summary>
    public string AudioPath => $"tracks/{Id}{AudioExtension}";

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
        int albumPosition = 0,
        string? sourceUrl = null,
        string audioExtension = ".mp3")
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        if (audioExtension is not ['.', _, ..])
        {
            throw new ArgumentException("An audio extension starts with a dot, e.g. .mp3.", nameof(audioExtension));
        }

        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(durationSeconds);
        if (!Enum.IsDefined(licence))
        {
            throw new ArgumentOutOfRangeException(nameof(licence), licence, "A track carries one of the Hummi licences.");
        }

        return new Track(Guid.NewGuid(), slug ?? Catalogue.Slug.From(title), title.Trim(), artistId, durationSeconds, coverUrl, addedAt, genreId, licence)
        {
            AlbumId = albumId,
            AlbumPosition = albumId is null ? 0 : albumPosition,
            SourceUrl = string.IsNullOrWhiteSpace(sourceUrl) ? null : sourceUrl.Trim(),
            AudioExtension = audioExtension.ToLowerInvariant(),
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
