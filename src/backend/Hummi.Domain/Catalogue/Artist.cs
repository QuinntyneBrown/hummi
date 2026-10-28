namespace Hummi.Domain.Catalogue;

/// <summary>
/// A named creator whose tracks are in the catalogue: a Pixabay uploader, or a generator persona made with one
/// open-weights model (<see cref="ModelName"/>). <see cref="MonthlyListeners"/> is recomputed by a background job.
/// </summary>
public sealed class Artist
{
    private Artist(Guid id, string slug, string name, string? modelName, string description)
    {
        Id = id;
        Slug = slug;
        Name = name;
        ModelName = modelName;
        Description = description;
    }

    public Guid Id { get; private set; }

    /// <summary>The artist's segment of <c>/artists/{slug}</c>.</summary>
    public string Slug { get; private set; }

    public string Name { get; private set; }

    /// <summary>The open-weights model the artist's tracks are generated with; null when unknown, as for every Pixabay uploader.</summary>
    public string? ModelName { get; private set; }

    public string Description { get; private set; }

    /// <summary>Distinct signed-in listeners of the artist's tracks in the last 30 days.</summary>
    public int MonthlyListeners { get; private set; }

    public static Artist Create(string name, string? modelName = null, string description = "", string? slug = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        var model = string.IsNullOrWhiteSpace(modelName) ? null : modelName.Trim();
        return new Artist(Guid.NewGuid(), slug ?? Catalogue.Slug.From(name), name.Trim(), model, description.Trim());
    }

    public void SetMonthlyListeners(int count)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(count);
        MonthlyListeners = count;
    }
}
