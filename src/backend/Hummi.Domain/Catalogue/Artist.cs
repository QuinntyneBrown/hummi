namespace Hummi.Domain.Catalogue;

/// <summary>A creator whose tracks are in the catalogue.</summary>
public sealed class Artist
{
    private Artist(Guid id, string name)
    {
        Id = id;
        Name = name;
    }

    public Guid Id { get; private set; }

    public string Name { get; private set; }

    public static Artist Create(string name)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        return new Artist(Guid.NewGuid(), name.Trim());
    }
}
