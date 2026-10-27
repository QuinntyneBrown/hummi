namespace Hummi.Domain.Catalogue;

/// <summary>
/// Tracks one artist released together. A track joins an album through its <c>AlbumId</c> and
/// <c>AlbumPosition</c>; the album is listed only once published, and publishing needs at least one track (L2-011).
/// </summary>
public sealed class Album
{
    private Album(Guid id, string slug, string title, Guid artistId, int year)
    {
        Id = id;
        Slug = slug;
        Title = title;
        ArtistId = artistId;
        Year = year;
    }

    public Guid Id { get; private set; }

    /// <summary>The album's segment of <c>/albums/{slug}</c>.</summary>
    public string Slug { get; private set; }

    public string Title { get; private set; }

    public Guid ArtistId { get; private set; }

    public int Year { get; private set; }

    public bool Published { get; private set; }

    /// <summary>The billboard's kicker, for example "New album · Carnival 2025" (L2-001 AC1); null when not featured.</summary>
    public string? Kicker { get; private set; }

    /// <summary>The billboard's one-sentence blurb.</summary>
    public string? Blurb { get; private set; }

    public static Album Create(string title, Guid artistId, int year, string? slug = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentOutOfRangeException.ThrowIfLessThan(year, 1900);
        return new Album(Guid.NewGuid(), slug ?? Catalogue.Slug.From(title), title.Trim(), artistId, year);
    }

    /// <summary>Puts the album on the Home billboard with its kicker and blurb.</summary>
    public void Feature(string kicker, string blurb)
    {
        Kicker = kicker.Trim();
        Blurb = blurb.Trim();
    }

    /// <summary>Lists the album; the tracks given are its tracks and must all belong to it.</summary>
    public void Publish(IReadOnlyCollection<Track> tracks)
    {
        if (tracks.Count == 0)
        {
            throw new InvalidOperationException("An album needs at least one track to be published.");
        }

        if (tracks.Any(t => t.AlbumId != Id))
        {
            throw new InvalidOperationException("Only the album's own tracks can publish it.");
        }

        Published = true;
    }
}
