namespace Hummi.Domain.Catalogue;

/// <summary>
/// A named generator persona whose tracks are in the catalogue, all made with one open-weights model
/// (<see cref="ModelName"/>). <see cref="MonthlyListeners"/> is recomputed by a background job.
/// </summary>
public sealed class Artist
{
    /// <summary>The model an artist uses when none is named.</summary>
    public const string DefaultModel = "openmusic-3b";

    private Artist(Guid id, string slug, string name, string modelName, string description)
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

    /// <summary>The open-weights model the artist's tracks are generated with, e.g. openmusic-3b.</summary>
    public string ModelName { get; private set; }

    public string Description { get; private set; }

    /// <summary>Distinct signed-in listeners of the artist's tracks in the last 30 days.</summary>
    public int MonthlyListeners { get; private set; }

    public static Artist Create(string name, string modelName = DefaultModel, string description = "", string? slug = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(modelName);
        return new Artist(Guid.NewGuid(), slug ?? Catalogue.Slug.From(name), name.Trim(), modelName.Trim(), description.Trim());
    }

    public void SetMonthlyListeners(int count)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(count);
        MonthlyListeners = count;
    }
}
