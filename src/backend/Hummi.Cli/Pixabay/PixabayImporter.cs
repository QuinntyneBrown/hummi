using System.Security.Cryptography;

namespace Hummi.Cli.Pixabay;

/// <summary>How an import went: tracks added, already present, audio restored, and each refusal with its reason.</summary>
public sealed record ImportReport(int Imported, int Present, int Restored, IReadOnlyList<string> Refused);

/// <summary>
/// Turns the manifest's Pixabay sources into manifest tracks and cached audio (L2-056, ADR 0021). A source
/// already imported is not fetched again; a page that does not describe a whole track is refused and reported,
/// never completed by guesswork. Audio goes to <c>{media root}/pixabay/{id}.mp3</c>.
/// </summary>
public sealed class PixabayImporter(IPixabayWeb web, string mediaRoot, TimeProvider clock)
{
    public const string CacheFolder = "pixabay";

    public async Task<ImportReport> ImportAsync(PixabayManifest manifest, CancellationToken cancellationToken = default)
    {
        var refused = new List<string>();
        var licenceTexts = new Dictionary<string, string?>();
        int imported = 0, present = 0, restored = 0;
        Directory.CreateDirectory(Path.Combine(mediaRoot, CacheFolder));

        foreach (var source in manifest.Sources.Distinct())
        {
            if (!Uri.TryCreate(source, UriKind.Absolute, out var url) || PixabayTrackPage.IdOf(url) is not { } id)
            {
                refused.Add($"{source}: not a Pixabay music track page");
                continue;
            }

            if (manifest.Tracks.Any(t => t.PixabayId == id || t.SourceUrl == source))
            {
                present++;
                continue;
            }

            if (await web.GetPageAsync(url, cancellationToken) is not { } html)
            {
                refused.Add($"{source}: the page could not be fetched");
                continue;
            }

            var parse = PixabayTrackPage.Parse(url, html);
            if (parse.Page is not { } page)
            {
                refused.Add($"{source}: no {string.Join(", ", parse.Missing)}");
                continue;
            }

            if (!licenceTexts.TryGetValue(page.LicenceUrl, out var licenceText))
            {
                licenceText = await web.GetPageAsync(new Uri(page.LicenceUrl), cancellationToken) is { } licenceHtml ? PixabayTrackPage.LicenceText(licenceHtml) : null;
                licenceTexts[page.LicenceUrl] = licenceText;
            }

            if (licenceText is null)
            {
                refused.Add($"{source}: the licence page could not be read");
                continue;
            }

            if (await web.GetFileAsync(new Uri(page.AudioUrl), cancellationToken) is not { Length: > 0 } audio)
            {
                refused.Add($"{source}: the audio file could not be fetched");
                continue;
            }

            var file = $"{CacheFolder}/{id}{AudioExtension(page.AudioUrl)}";
            await File.WriteAllBytesAsync(Path.Combine(mediaRoot, file), audio, cancellationToken);
            manifest.Tracks.Add(new ManifestTrack(
                id,
                source,
                page.Title,
                page.Artist,
                page.ArtistUrl,
                page.DurationSeconds,
                page.Genre,
                page.Tags,
                page.CoverUrl,
                page.AudioUrl,
                file,
                audio.LongLength,
                Sha256(audio),
                new ManifestLicence(page.LicenceName, page.LicenceUrl, licenceText),
                clock.GetUtcNow()));
            imported++;
        }

        foreach (var track in manifest.Tracks.Where(t => !File.Exists(Path.Combine(mediaRoot, t.AudioFile))))
        {
            var audio = await web.GetFileAsync(new Uri(track.AudioUrl), cancellationToken);
            if (audio is null || Sha256(audio) != track.AudioSha256)
            {
                refused.Add(audio is null
                    ? $"{track.Title} ({track.PixabayId}): the audio file could not be fetched"
                    : $"{track.Title} ({track.PixabayId}): the downloaded audio does not match its SHA-256");
                continue;
            }

            await File.WriteAllBytesAsync(Path.Combine(mediaRoot, track.AudioFile), audio, cancellationToken);
            restored++;
        }

        var order = manifest.Sources.Select((s, i) => (s, i)).GroupBy(x => x.s).ToDictionary(g => g.Key, g => g.First().i);
        manifest.Tracks = [.. manifest.Tracks.OrderBy(t => order.GetValueOrDefault(t.SourceUrl, int.MaxValue))];
        return new ImportReport(imported, present, restored, refused);
    }

    /// <summary>Lower-case hex SHA-256, as the manifest records it.</summary>
    public static string Sha256(byte[] bytes) => Convert.ToHexStringLower(SHA256.HashData(bytes));

    /// <summary>The extension of the audio URL when it is a known audio type, else .mp3 (Pixabay serves MP3).</summary>
    private static string AudioExtension(string audioUrl)
    {
        var extension = Path.GetExtension(new Uri(audioUrl).AbsolutePath).ToLowerInvariant();
        return extension is ".mp3" or ".ogg" or ".wav" ? extension : ".mp3";
    }
}
