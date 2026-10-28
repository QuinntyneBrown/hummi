using Hummi.Cli.Pixabay;

namespace Hummi.Cli.Tests.Pixabay;

/// <summary>Answers pages and files from memory; anything not registered cannot be fetched. Counts fetches.</summary>
public sealed class FakePixabayWeb : IPixabayWeb
{
    public Dictionary<string, string> Pages { get; } = [];

    public Dictionary<string, byte[]> Files { get; } = [];

    public List<string> Fetched { get; } = [];

    public Task<string?> GetPageAsync(Uri url, CancellationToken cancellationToken = default)
    {
        Fetched.Add(url.ToString());
        return Task.FromResult(Pages.GetValueOrDefault(url.ToString()));
    }

    public Task<byte[]?> GetFileAsync(Uri url, CancellationToken cancellationToken = default)
    {
        Fetched.Add(url.ToString());
        return Task.FromResult(Files.GetValueOrDefault(url.ToString()));
    }
}

/// <summary>A clock that always reads the same instant.</summary>
public sealed class FixedClock(DateTimeOffset now) : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => now;
}

/// <summary>
/// Track pages in the shape the parser reads: schema.org JSON-LD and Open Graph tags. The values are test
/// fixtures, not catalogue data.
/// </summary>
public static class PixabayPages
{
    public const string LicenceUrl = "https://pixabay.com/service/license-summary/";

    /// <summary>The text <see cref="Licence"/> reads as: one line per block, whitespace collapsed.</summary>
    public const string LicenceText = "Content License Summary\nAll content on Pixabay can be used for free for commercial and noncommercial use across print and digital, except in the cases mentioned in \"What is not allowed\".\nAttribution is not required.";

    public static string SourceUrl(int id) => $"https://pixabay.com/music/beats-fixture-song-{id}/";

    public static string AudioUrl(int id) => $"https://cdn.pixabay.com/audio/2026/01/01/audio_{id}.mp3";

    public static string CoverUrl(int id) => $"https://cdn.pixabay.com/audio/2026/01/01/cover_{id}.jpg";

    /// <summary>A complete page with JSON-LD; leave any value null to leave it out.</summary>
    public static string JsonLd(
        int id,
        string? title = "Fixture Song",
        string? artist = "fixture_artist",
        string? duration = "PT2M51S",
        string? genre = "Beats",
        string? keywords = "reggae, summer, chill",
        bool cover = true,
        bool audio = true,
        string? licence = LicenceUrl)
    {
        var fields = new List<string> { "\"@context\": \"https://schema.org\"", "\"@type\": \"MusicRecording\"" };
        if (title is not null) fields.Add($"\"name\": \"{title}\"");
        if (artist is not null) fields.Add($"\"byArtist\": {{ \"@type\": \"Person\", \"name\": \"{artist}\", \"url\": \"https://pixabay.com/users/{artist}-123/\" }}");
        if (duration is not null) fields.Add($"\"duration\": \"{duration}\"");
        if (genre is not null) fields.Add($"\"genre\": \"{genre}\"");
        if (keywords is not null) fields.Add($"\"keywords\": \"{keywords}\"");
        if (cover) fields.Add($"\"image\": \"{CoverUrl(id)}\"");
        if (audio) fields.Add($"\"audio\": {{ \"@type\": \"AudioObject\", \"contentUrl\": \"{AudioUrl(id)}\", \"encodingFormat\": \"audio/mpeg\" }}");
        if (licence is not null) fields.Add($"\"license\": \"{licence}\"");
        return $$"""
            <!DOCTYPE html><html><head>
            <title>{{title}} | Royalty-free Music - Pixabay</title>
            <script type="application/ld+json">{ {{string.Join(", ", fields)}} }</script>
            </head><body><main><h1>{{title}}</h1></main></body></html>
            """;
    }

    /// <summary>A page with Open Graph and music: meta tags only.</summary>
    public static string OpenGraph(int id) => $"""
        <!DOCTYPE html><html><head>
        <meta property="og:title" content="Fixture &amp; Friends | Royalty-free Music - Pixabay">
        <meta property="og:image" content="{CoverUrl(id)}">
        <meta property="og:audio" content="{AudioUrl(id)}">
        <meta property="music:duration" content="125">
        <meta name="author" content="other_artist">
        <link rel="license" href="{LicenceUrl}">
        </head><body><a href="https://pixabay.com/users/other_artist-9/">other_artist</a></body></html>
        """;

    public static string Licence => $"""
        <!DOCTYPE html><html><head><title>Content License Summary - Pixabay</title><style>p {"{"} color: red; {"}"}</style></head>
        <body><nav>Explore</nav><main><h1>Content License Summary</h1>
        <p>All content on Pixabay can be used for free for commercial and noncommercial use across print and digital, except in the cases mentioned in &quot;What is not allowed&quot;.</p>
        <p>Attribution is not required.</p></main><footer>Footer</footer></body></html>
        """;
}
