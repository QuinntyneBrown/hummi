using System.Text;

namespace Hummi.Domain.Catalogue;

/// <summary>The URL segment of a catalogue page: lowercase letters and digits joined by single hyphens.</summary>
public static class Slug
{
    /// <summary>For example "J’ouvert Morning" becomes "jouvert-morning"; apostrophes join, other symbols split.</summary>
    public static string From(string text)
    {
        var slug = new StringBuilder(text.Length);
        foreach (var c in text.Trim().ToLowerInvariant())
        {
            if (char.IsAsciiLetterOrDigit(c))
            {
                slug.Append(c);
            }
            else if (c is not ('\'' or '’') && slug.Length > 0 && slug[^1] != '-')
            {
                slug.Append('-');
            }
        }

        return slug.ToString().TrimEnd('-');
    }
}
