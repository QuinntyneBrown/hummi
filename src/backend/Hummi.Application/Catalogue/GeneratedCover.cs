using System.Globalization;
using System.Text;

namespace Hummi.Application.Catalogue;

/// <summary>
/// The cover of a track whose source gives none (ADR 0021, L2-057 AC3): an SVG drawn with the design-system
/// cover gradient of its genre (tokens <c>--color-cover-{n}-from/to</c>), rings placed by a hash of its title
/// and the title's initials. The same title and tone always give the same image. Returned as a
/// <c>data:</c> URL that fits the 2,048-character cover column.
/// </summary>
public static class GeneratedCover
{
    /// <summary>The six cover gradients of docs/design-system/tokens/tokens.css, as (from, to).</summary>
    private static readonly (string From, string To)[] Gradients =
    [
        ("#c4381f", "#24182b"),
        ("#1b5f9e", "#34263c"),
        ("#8a5300", "#8a2513"),
        ("#1b6b3c", "#24182b"),
        ("#4a3a52", "#a82e18"),
        ("#a0221b", "#34263c"),
    ];

    /// <summary>--color-fg-on-media.</summary>
    private const string OnMedia = "#fffcf6";

    private const int MaxLabel = 80;

    /// <summary>The cover for a title; tone is the genre's cover gradient 1 to 6, or null for an unclassified track.</summary>
    public static string DataUrl(string title, int? tone)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        var hash = Hash(title.Trim());
        var (from, to) = Gradients[ToneFor(title, tone) - 1];
        var cx = 150 + (int)(hash % 121) - 60;
        var cy = 110 + (int)((hash >> 8) % 81) - 40;
        var r = 40 + (int)((hash >> 16) % 41);
        var label = Escape(title.Trim().Length > MaxLabel ? title.Trim()[..MaxLabel] : title.Trim());
        var svg = new StringBuilder()
            .Append("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 300\" role=\"img\" aria-label=\"").Append(label).Append("\">")
            .Append("<defs><linearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">")
            .Append("<stop offset=\"0\" stop-color=\"").Append(from).Append("\"/>")
            .Append("<stop offset=\"1\" stop-color=\"").Append(to).Append("\"/></linearGradient></defs>")
            .Append("<rect width=\"300\" height=\"300\" fill=\"url(#g)\"/>")
            .Append("<g fill=\"none\" stroke=\"").Append(OnMedia).Append("\" stroke-opacity=\".2\" stroke-width=\"6\">");
        for (var ring = 0; ring < 3; ring++)
        {
            svg.Append(CultureInfo.InvariantCulture, $"<circle cx=\"{cx}\" cy=\"{cy}\" r=\"{r + (ring * 30)}\"/>");
        }

        svg.Append("</g><text x=\"28\" y=\"268\" fill=\"").Append(OnMedia)
            .Append("\" font-family=\"DM Sans,system-ui,sans-serif\" font-size=\"64\" font-weight=\"700\">")
            .Append(Initials(title)).Append("</text></svg>");
        return "data:image/svg+xml," + Uri.EscapeDataString(svg.ToString());
    }

    /// <summary>The gradient 1 to 6: the genre's tone when known, else one picked by the title's hash.</summary>
    public static int ToneFor(string title, int? tone) =>
        tone is >= 1 and <= 6 ? tone.Value : (int)(Hash(title.Trim()) % 6) + 1;

    /// <summary>The first letter or digit of the first two words that have one, upper-cased.</summary>
    private static string Initials(string title)
    {
        var letters = title.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(word => word.FirstOrDefault(char.IsLetterOrDigit))
            .Where(c => c != default)
            .Take(2)
            .Select(char.ToUpperInvariant)
            .ToArray();
        return letters.Length == 0 ? "♪" : new string(letters);
    }

    /// <summary>FNV-1a over the title's UTF-16 code units, so the cover never depends on the process.</summary>
    private static uint Hash(string text)
    {
        var hash = 2166136261u;
        foreach (var c in text)
        {
            hash = unchecked((hash ^ c) * 16777619u);
        }

        return hash;
    }

    private static string Escape(string text) => text
        .Replace("&", "&amp;", StringComparison.Ordinal)
        .Replace("<", "&lt;", StringComparison.Ordinal)
        .Replace(">", "&gt;", StringComparison.Ordinal)
        .Replace("\"", "&quot;", StringComparison.Ordinal);
}
