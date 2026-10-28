using System.Text.RegularExpressions;

namespace Hummi.Cli.Pixabay;

/// <summary>
/// Reads Pixabay pages from a folder of pages saved from a normal browser, and fetches files through
/// <paramref name="files"/>. pixabay.com answers plain HTTP requests with a bot check, while its CDN serves audio
/// and covers to them (checked 2026-10-28), so <c>hummi import --pages {folder}</c> imports from saved pages and
/// never tries to get past the check (ADR 0021). A track page is saved as <c>{id}.html</c> (the number at the end
/// of its address); any other page, such as the licence summary, as its last path segment
/// (<c>license-summary.html</c>). A page with no saved file reads as "could not be fetched".
/// </summary>
public sealed partial class SavedPagesPixabayWeb(string folder, IPixabayWeb files) : IPixabayWeb
{
    /// <summary>The file a page is saved as, or null for an address that is not a pixabay.com page.</summary>
    public static string? FileNameOf(Uri url)
    {
        if (PixabayTrackPage.IdOf(url) is { } id)
        {
            return $"{id}.html";
        }

        if (url.Scheme != Uri.UriSchemeHttps || url.Host is not ("pixabay.com" or "www.pixabay.com"))
        {
            return null;
        }

        var segment = url.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries).LastOrDefault();
        return segment is not null && Segment().IsMatch(segment) ? $"{segment}.html" : null;
    }

    public async Task<string?> GetPageAsync(Uri url, CancellationToken cancellationToken = default)
    {
        if (FileNameOf(url) is not { } name)
        {
            return null;
        }

        var path = Path.Combine(folder, name);
        return File.Exists(path) ? await File.ReadAllTextAsync(path, cancellationToken) : null;
    }

    public Task<byte[]?> GetFileAsync(Uri url, CancellationToken cancellationToken = default) => files.GetFileAsync(url, cancellationToken);

    [GeneratedRegex("^[a-z0-9-]+$")]
    private static partial Regex Segment();
}
