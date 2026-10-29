using Hummi.Domain.Catalogue;

namespace Hummi.Application.Catalogue;

/// <summary>
/// Puts a Pixabay track under one of Hummi's ten fixed genres (ADR 0006) only when its Pixabay genre or one of
/// its tags names that genre exactly (L2-057 AC2): the genre's name or slug, case-insensitively, or one of a few
/// spellings Pixabay uses for the same thing. The Pixabay genre is tried first, then the tags in order.
/// </summary>
public static class GenreMatch
{
    private static readonly Dictionary<string, string> Aliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["steel drum"] = "steelpan",
        ["steel drums"] = "steelpan",
        ["steel pan"] = "steelpan",
        ["steel pans"] = "steelpan",
        ["calypso"] = "steelpan",
        ["children"] = "kids",
        ["island-chill"] = "island-chill",
    };

    private static readonly Dictionary<string, string> Names = Genre.All()
        .SelectMany(g => new[] { (g.Name, g.Slug), (g.Slug, g.Slug) })
        .Concat(Aliases.Select(a => (a.Key, a.Value)))
        .GroupBy(pair => pair.Item1, StringComparer.OrdinalIgnoreCase)
        .ToDictionary(g => g.Key, g => g.First().Item2, StringComparer.OrdinalIgnoreCase);

    /// <summary>The slug of the matching genre, or null for an unclassified track.</summary>
    public static string? Slug(string? genre, IEnumerable<string> tags) =>
        new[] { genre }.Concat(tags)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Select(name => Names.GetValueOrDefault(name!.Trim()))
            .FirstOrDefault(slug => slug is not null);
}
