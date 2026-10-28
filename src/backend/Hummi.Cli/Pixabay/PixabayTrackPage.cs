using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml;

namespace Hummi.Cli.Pixabay;

/// <summary>What a page gave: the track, or null with the required fields it lacked.</summary>
public sealed record PageParse(PixabayTrackPage? Page, IReadOnlyList<string> Missing);

/// <summary>
/// The metadata of one Pixabay music track page, read from its schema.org JSON-LD and, where that is silent,
/// its Open Graph and <c>music:</c> meta tags (ADR 0021, L2-056). Nothing is filled in: a required field the
/// page does not give is reported as missing. Only files on Pixabay's own hosts are accepted. Checked against
/// real pages: the JSON-LD name reads "{title} by {artist} | Royalty-free Music", and a track without a cover of
/// its own still carries a generic og:image, so only an image under <c>cdn.pixabay.com/audio/</c> is a cover.
/// </summary>
public sealed partial record PixabayTrackPage(
    long PixabayId,
    string Title,
    string Artist,
    string? ArtistUrl,
    int DurationSeconds,
    string? Genre,
    IReadOnlyList<string> Tags,
    string? CoverUrl,
    string AudioUrl,
    string LicenceName,
    string LicenceUrl)
{
    public const string ContentLicense = "Pixabay Content License";

    private static readonly string[] SiteEndings = [" - Pixabay", " | Royalty-free Music", " | Pixabay"];

    /// <summary>The Pixabay id of a music track page (<c>https://pixabay.com/music/{slug}-{id}/</c>), else null.</summary>
    public static long? IdOf(Uri url)
    {
        if (url.Scheme != Uri.UriSchemeHttps || url.Host is not ("pixabay.com" or "www.pixabay.com"))
        {
            return null;
        }

        var match = TrackPath().Match(url.AbsolutePath);
        return match.Success && !url.AbsolutePath.StartsWith("/music/search/", StringComparison.Ordinal)
            ? long.Parse(match.Groups[1].Value, System.Globalization.CultureInfo.InvariantCulture)
            : null;
    }

    public static PageParse Parse(Uri source, string html)
    {
        JsonElement? ld = JsonLdNodes(html).Where(n => HasType(n, "MusicRecording") || HasType(n, "AudioObject") || HasType(n, "MusicComposition"))
            .Select(n => (JsonElement?)n).FirstOrDefault();
        var meta = MetaTags(html);

        var artistNode = ld is { } n ? First(n, "byArtist", "author", "creator") : null;
        var artist = (artistNode is { } a ? Text(a, "name") ?? AsString(a) : null) ?? meta.GetValueOrDefault("author") ?? meta.GetValueOrDefault("music:musician");
        var title = ShownTitle(Text(ld, "name"), artist) ?? ShownTitle(meta.GetValueOrDefault("og:title"), artist) ?? ShownTitle(TitleElement(html), artist);
        var artistUrl = artistNode is { } au ? Text(au, "url") : null;
        if (artistUrl is null && artist is not null)
        {
            artistUrl = UserLinks().Matches(html).Select(m => m.Groups[0].Value)
                .FirstOrDefault(href => href.Contains($"/users/{artist}-", StringComparison.OrdinalIgnoreCase));
        }

        var duration = (ld is { } d ? Text(d, "duration") : null) is { } iso ? Seconds(iso) : null;
        duration ??= int.TryParse(meta.GetValueOrDefault("music:duration"), out var s) && s > 0 ? s : null;

        var genre = ld is { } g ? Strings(g, "genre").FirstOrDefault() : null;
        var tags = ld is { } k ? Strings(k, "keywords").SelectMany(t => t.Split(',')).Select(t => t.Trim()).Where(t => t.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToList() : [];

        var cover = TrackCover(ld is { } i ? Url(First(i, "image", "thumbnailUrl")) : null) ?? TrackCover(meta.GetValueOrDefault("og:image"));
        var audio = OnPixabay(ld is { } au2 ? AudioOf(au2) : null)
            ?? OnPixabay(meta.GetValueOrDefault("og:audio:secure_url"))
            ?? OnPixabay(meta.GetValueOrDefault("og:audio:url"))
            ?? OnPixabay(meta.GetValueOrDefault("og:audio"));

        var licenceUrl = (ld is { } l ? Url(First(l, "license")) : null) ?? LicenceLink(html);
        var pixabayLicence = licenceUrl is not null && IsPixabayLicence(licenceUrl);

        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(title)) missing.Add("title");
        if (string.IsNullOrWhiteSpace(artist)) missing.Add("artist");
        if (duration is null) missing.Add("duration");
        if (audio is null) missing.Add("audio file");
        if (!pixabayLicence) missing.Add(ContentLicense);
        var id = IdOf(source);
        if (id is null) missing.Add("Pixabay id");
        if (missing.Count > 0)
        {
            return new PageParse(null, missing);
        }

        return new PageParse(
            new PixabayTrackPage(id!.Value, title!.Trim(), artist!.Trim(), artistUrl, duration!.Value, genre, tags, cover, audio!, ContentLicense, licenceUrl!),
            []);
    }

    /// <summary>
    /// The licence page's main text, one line per block, whitespace collapsed; null when it has none. The real
    /// licence summary has no <c>main</c>, so without one the text runs from the first heading to the footer,
    /// which leaves out the menus and the cookie-consent panel the page injects after it.
    /// </summary>
    public static string? LicenceText(string html)
    {
        var main = MainElement().Match(html) is { Success: true } m ? m.Groups[1].Value : HeadingToFooter(html);
        main = Noise().Replace(main, " ");
        main = BlockEnd().Replace(main, "\n");
        main = InlineTag().Replace(main, string.Empty);
        main = Tag().Replace(main, " ");
        var lines = WebUtility.HtmlDecode(main).Split('\n')
            .Select(line => Spaces().Replace(line, " ").Trim())
            .Where(line => line.Length > 0)
            .ToList();
        return lines.Count == 0 ? null : string.Join("\n", lines);
    }

    private static string HeadingToFooter(string html)
    {
        var body = BodyElement().Match(html) is { Success: true } b ? b.Groups[1].Value : html;
        if (HeadingStart().Match(body) is { Success: true } heading)
        {
            body = body[heading.Index..];
            if (FooterStart().Match(body) is { Success: true } footer)
            {
                body = body[..footer.Index];
            }
        }

        return body;
    }

    private static bool IsPixabayLicence(string url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var uri)
        && uri.Host is "pixabay.com" or "www.pixabay.com"
        && (uri.AbsolutePath.StartsWith("/service/license", StringComparison.Ordinal) || uri.AbsolutePath.StartsWith("/service/terms", StringComparison.Ordinal));

    private static string? OnPixabay(string? url) =>
        url is not null
        && Uri.TryCreate(WebUtility.HtmlDecode(url.Trim()), UriKind.Absolute, out var uri)
        && uri.Scheme == Uri.UriSchemeHttps
        && (uri.Host == "pixabay.com" || uri.Host.EndsWith(".pixabay.com", StringComparison.Ordinal))
            ? uri.ToString()
            : null;

    /// <summary>A track's own cover lives under cdn.pixabay.com/audio/; gradients, site images and avatars do not.</summary>
    private static string? TrackCover(string? url) =>
        OnPixabay(url) is { } cover
        && new Uri(cover) is { Host: "cdn.pixabay.com" } uri
        && uri.AbsolutePath.StartsWith("/audio/", StringComparison.Ordinal)
            ? cover
            : null;

    private static string? AudioOf(JsonElement node)
    {
        if (HasType(node, "AudioObject") && Text(node, "contentUrl") is { } own)
        {
            return own;
        }

        foreach (var name in new[] { "audio", "associatedMedia", "encoding" })
        {
            if (node.TryGetProperty(name, out var media))
            {
                var first = media.ValueKind == JsonValueKind.Array ? media.EnumerateArray().FirstOrDefault() : media;
                if (first.ValueKind == JsonValueKind.Object && Text(first, "contentUrl") is { } url)
                {
                    return url;
                }
            }
        }

        return Text(node, "contentUrl");
    }

    private static int? Seconds(string iso)
    {
        try
        {
            var seconds = (int)Math.Round(XmlConvert.ToTimeSpan(iso).TotalSeconds);
            return seconds > 0 ? seconds : null;
        }
        catch (FormatException)
        {
            return null;
        }
    }

    /// <summary>
    /// The title as the player shows it: Pixabay names a track "{title} by {artist} | Royalty-free Music" (and the
    /// document title adds " - Pixabay"). Only those exact endings are removed, so a title that itself contains a
    /// bar keeps it; " by {artist}" goes only when a site ending was there.
    /// </summary>
    private static string? ShownTitle(string? name, string? artist)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return null;
        }

        // Padded with a space so a name that is nothing but an ending (" | Royalty-free Music - Pixabay") empties.
        var title = " " + WebUtility.HtmlDecode(name).Trim();
        var siteEnding = false;
        string? ending;
        while ((ending = SiteEndings.FirstOrDefault(e => title.EndsWith(e, StringComparison.OrdinalIgnoreCase))) is not null)
        {
            title = title[..^ending.Length].TrimEnd();
            siteEnding = true;
        }

        var byArtist = $" by {artist?.Trim()}";
        if (siteEnding && !string.IsNullOrWhiteSpace(artist) && title.EndsWith(byArtist, StringComparison.OrdinalIgnoreCase))
        {
            title = title[..^byArtist.Length];
        }

        title = title.Trim();
        return title.Length > 0 ? title : null;
    }

    private static string? TitleElement(string html) => TitleTag().Match(html) is { Success: true } m ? m.Groups[1].Value : null;

    private static string? LicenceLink(string html)
    {
        foreach (Match link in LinkOrAnchor().Matches(html))
        {
            var attributes = Attributes(link.Value);
            if (attributes.GetValueOrDefault("href") is { } href && (attributes.GetValueOrDefault("rel") == "license" || href.Contains("/service/license", StringComparison.Ordinal)))
            {
                return WebUtility.HtmlDecode(href);
            }
        }

        return null;
    }

    private static Dictionary<string, string> MetaTags(string html)
    {
        var tags = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (Match tag in MetaTag().Matches(html))
        {
            var attributes = Attributes(tag.Value);
            if ((attributes.GetValueOrDefault("property") ?? attributes.GetValueOrDefault("name")) is { } key && attributes.GetValueOrDefault("content") is { } content)
            {
                tags.TryAdd(key, WebUtility.HtmlDecode(content));
            }
        }

        return tags;
    }

    private static Dictionary<string, string> Attributes(string tag) =>
        Attribute().Matches(tag).GroupBy(m => m.Groups[1].Value.ToLowerInvariant())
            .ToDictionary(g => g.Key, g => g.First().Groups[3].Success ? g.First().Groups[3].Value : g.First().Groups[4].Value);

    private static IEnumerable<JsonElement> JsonLdNodes(string html)
    {
        foreach (Match script in JsonLdScript().Matches(html))
        {
            JsonElement root;
            try
            {
                using var document = JsonDocument.Parse(script.Groups[1].Value);
                root = document.RootElement.Clone();
            }
            catch (JsonException)
            {
                continue;
            }

            foreach (var node in Flatten(root))
            {
                yield return node;
            }
        }
    }

    private static IEnumerable<JsonElement> Flatten(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray().SelectMany(Flatten))
            {
                yield return item;
            }
        }
        else if (element.ValueKind == JsonValueKind.Object)
        {
            yield return element;
            if (element.TryGetProperty("@graph", out var graph))
            {
                foreach (var item in Flatten(graph))
                {
                    yield return item;
                }
            }
        }
    }

    private static bool HasType(JsonElement node, string type) =>
        node.TryGetProperty("@type", out var value)
        && (value.ValueKind == JsonValueKind.String ? value.GetString() == type : value.ValueKind == JsonValueKind.Array && value.EnumerateArray().Any(v => v.GetString() == type));

    private static JsonElement? First(JsonElement node, params string[] names)
    {
        foreach (var name in names)
        {
            if (node.TryGetProperty(name, out var value) && value.ValueKind is not JsonValueKind.Null)
            {
                return value.ValueKind == JsonValueKind.Array ? value.EnumerateArray().FirstOrDefault() : value;
            }
        }

        return null;
    }

    private static string? Text(JsonElement? node, string name) =>
        node is { ValueKind: JsonValueKind.Object } n && n.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(value.GetString())
            ? WebUtility.HtmlDecode(value.GetString()!.Trim())
            : null;

    private static string? AsString(JsonElement node) =>
        node.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(node.GetString()) ? node.GetString()!.Trim() : null;

    private static string? Url(JsonElement? node) => node is { } n ? AsString(n) ?? Text(n, "url") ?? Text(n, "contentUrl") : null;

    private static IEnumerable<string> Strings(JsonElement node, string name)
    {
        if (!node.TryGetProperty(name, out var value))
        {
            return [];
        }

        return value.ValueKind switch
        {
            JsonValueKind.String => [value.GetString()!],
            JsonValueKind.Array => value.EnumerateArray().Where(v => v.ValueKind == JsonValueKind.String).Select(v => v.GetString()!),
            _ => [],
        };
    }

    [GeneratedRegex(@"^/music/[a-z0-9-]+-(\d+)/?$")]
    private static partial Regex TrackPath();

    [GeneratedRegex(@"<script[^>]*type\s*=\s*[""']application/ld\+json[""'][^>]*>(.*?)</script>", RegexOptions.Singleline | RegexOptions.IgnoreCase)]
    private static partial Regex JsonLdScript();

    [GeneratedRegex(@"<meta\s[^>]*>", RegexOptions.IgnoreCase)]
    private static partial Regex MetaTag();

    [GeneratedRegex(@"<(?:link|a)\s[^>]*>", RegexOptions.IgnoreCase)]
    private static partial Regex LinkOrAnchor();

    [GeneratedRegex(@"([\w:-]+)\s*=\s*(""([^""]*)""|'([^']*)')")]
    private static partial Regex Attribute();

    [GeneratedRegex(@"https://pixabay\.com/users/[\w.-]+-\d+/?", RegexOptions.IgnoreCase)]
    private static partial Regex UserLinks();

    [GeneratedRegex(@"<title[^>]*>(.*?)</title>", RegexOptions.Singleline | RegexOptions.IgnoreCase)]
    private static partial Regex TitleTag();

    [GeneratedRegex(@"<main[^>]*>(.*?)</main>", RegexOptions.Singleline | RegexOptions.IgnoreCase)]
    private static partial Regex MainElement();

    [GeneratedRegex(@"<body[^>]*>(.*?)</body>", RegexOptions.Singleline | RegexOptions.IgnoreCase)]
    private static partial Regex BodyElement();

    [GeneratedRegex(@"<(script|style|nav|header|footer|noscript)[^>]*>.*?</\1>", RegexOptions.Singleline | RegexOptions.IgnoreCase)]
    private static partial Regex Noise();

    [GeneratedRegex(@"</(p|h[1-6]|li|div|section|tr)>|<br\s*/?>", RegexOptions.IgnoreCase)]
    private static partial Regex BlockEnd();

    [GeneratedRegex(@"</?(a|abbr|b|code|em|i|label|mark|small|span|strong|sub|sup|u)\b[^>]*>", RegexOptions.IgnoreCase)]
    private static partial Regex InlineTag();

    [GeneratedRegex(@"<h1[\s>]", RegexOptions.IgnoreCase)]
    private static partial Regex HeadingStart();

    [GeneratedRegex(@"<footer[\s>]", RegexOptions.IgnoreCase)]
    private static partial Regex FooterStart();

    [GeneratedRegex(@"<[^>]+>")]
    private static partial Regex Tag();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Spaces();
}
