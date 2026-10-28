using System.Security.Cryptography;
using Hummi.Cli.Pixabay;

namespace Hummi.Cli.Tests.Pixabay;

/// <summary>Imports through a fake web into a throwaway media directory; nothing touches the network.</summary>
public sealed class PixabayImporterTests : IDisposable
{
    private static readonly byte[] Mp3 = [0x49, 0x44, 0x33, 4, 0, 0, 0, 0, 0, 1, 2, 3];

    private readonly string mediaRoot = Directory.CreateTempSubdirectory("hummi-import-").FullName;
    private readonly FakePixabayWeb web = new();
    private readonly FixedClock clock = new(new DateTimeOffset(2026, 10, 28, 9, 0, 0, TimeSpan.Zero));

    public void Dispose() => Directory.Delete(mediaRoot, recursive: true);

    private PixabayImporter Importer() => new(web, mediaRoot, clock);

    private void Publish(int id, string? html = null)
    {
        web.Pages[PixabayPages.SourceUrl(id)] = html ?? PixabayPages.JsonLd(id);
        web.Pages[PixabayPages.LicenceUrl] = PixabayPages.Licence;
        web.Files[PixabayPages.AudioUrl(id)] = Mp3;
    }

    [Fact]
    public async Task L2_056_AC1_a_source_becomes_a_manifest_track_with_its_audio_cached()
    {
        Publish(203465);
        var manifest = new PixabayManifest { Sources = [PixabayPages.SourceUrl(203465)] };

        var report = await Importer().ImportAsync(manifest);

        Assert.Equal(1, report.Imported);
        Assert.Empty(report.Refused);
        var track = Assert.Single(manifest.Tracks);
        Assert.Equal(203465, track.PixabayId);
        Assert.Equal(PixabayPages.SourceUrl(203465), track.SourceUrl);
        Assert.Equal("Fixture Song", track.Title);
        Assert.Equal("fixture_artist", track.Artist);
        Assert.Equal(171, track.DurationSeconds);
        Assert.Equal(PixabayPages.AudioUrl(203465), track.AudioUrl);
        Assert.Equal("pixabay/203465.mp3", track.AudioFile);
        Assert.Equal(Mp3.Length, track.AudioBytes);
        Assert.Equal(Convert.ToHexStringLower(SHA256.HashData(Mp3)), track.AudioSha256);
        Assert.Equal(new ManifestLicence(PixabayTrackPage.ContentLicense, PixabayPages.LicenceUrl, PixabayPages.LicenceText), track.Licence);
        Assert.Equal(clock.GetUtcNow(), track.ImportedAt);
        Assert.Equal(Mp3, File.ReadAllBytes(Path.Combine(mediaRoot, "pixabay", "203465.mp3")));
    }

    [Fact]
    public async Task L2_056_AC2_an_incomplete_page_is_refused_with_what_is_missing_and_adds_nothing()
    {
        Publish(1, PixabayPages.JsonLd(1, artist: null, duration: null));
        var manifest = new PixabayManifest { Sources = [PixabayPages.SourceUrl(1)] };

        var report = await Importer().ImportAsync(manifest);

        Assert.Empty(manifest.Tracks);
        Assert.Equal([$"{PixabayPages.SourceUrl(1)}: no artist, duration"], report.Refused);
        Assert.False(Directory.Exists(Path.Combine(mediaRoot, "pixabay")) && Directory.EnumerateFiles(Path.Combine(mediaRoot, "pixabay")).Any());
    }

    [Fact]
    public async Task L2_056_AC3_unreachable_or_foreign_sources_are_refused_and_the_rest_imported()
    {
        Publish(2);
        web.Pages[PixabayPages.SourceUrl(3)] = PixabayPages.JsonLd(3);
        var manifest = new PixabayManifest
        {
            Sources = ["https://example.com/music/song-1/", PixabayPages.SourceUrl(9), PixabayPages.SourceUrl(3), PixabayPages.SourceUrl(2)],
        };

        var report = await Importer().ImportAsync(manifest);

        Assert.Equal(1, report.Imported);
        Assert.Equal("Fixture Song", Assert.Single(manifest.Tracks).Title);
        Assert.Equal(
            [
                "https://example.com/music/song-1/: not a Pixabay music track page",
                $"{PixabayPages.SourceUrl(9)}: the page could not be fetched",
                $"{PixabayPages.SourceUrl(3)}: the audio file could not be fetched",
            ],
            report.Refused);
    }

    [Fact]
    public async Task L2_056_AC4_a_track_already_in_the_manifest_is_not_fetched_again()
    {
        Publish(4);
        var manifest = new PixabayManifest { Sources = [PixabayPages.SourceUrl(4)] };
        await Importer().ImportAsync(manifest);
        web.Fetched.Clear();

        var report = await Importer().ImportAsync(manifest);

        Assert.Equal(0, report.Imported);
        Assert.Equal(1, report.Present);
        Assert.Empty(web.Fetched);
        Assert.Single(manifest.Tracks);
    }

    [Fact]
    public async Task L2_056_AC4_missing_audio_is_downloaded_again_and_kept_only_if_its_checksum_matches()
    {
        Publish(5);
        Publish(6);
        var manifest = new PixabayManifest { Sources = [PixabayPages.SourceUrl(5), PixabayPages.SourceUrl(6)] };
        await Importer().ImportAsync(manifest);
        File.Delete(Path.Combine(mediaRoot, "pixabay", "5.mp3"));
        File.Delete(Path.Combine(mediaRoot, "pixabay", "6.mp3"));
        web.Files[PixabayPages.AudioUrl(6)] = [9, 9, 9];

        var report = await Importer().ImportAsync(manifest);

        Assert.Equal(1, report.Restored);
        Assert.True(File.Exists(Path.Combine(mediaRoot, "pixabay", "5.mp3")));
        Assert.False(File.Exists(Path.Combine(mediaRoot, "pixabay", "6.mp3")));
        Assert.Equal(["Fixture Song (6): the downloaded audio does not match its SHA-256"], report.Refused);
    }

    [Fact]
    public async Task L2_056_AC5_tracks_are_kept_in_source_order()
    {
        Publish(7);
        Publish(8);
        var manifest = new PixabayManifest { Sources = [PixabayPages.SourceUrl(8)] };
        await Importer().ImportAsync(manifest);
        manifest.Sources.Insert(0, PixabayPages.SourceUrl(7));

        await Importer().ImportAsync(manifest);

        Assert.Equal([7, 8], manifest.Tracks.Select(t => t.PixabayId));
    }

    [Fact]
    public async Task L2_056_AC5_the_manifest_round_trips_through_its_json_file()
    {
        Publish(10);
        var manifest = new PixabayManifest { Sources = [PixabayPages.SourceUrl(10)] };
        await Importer().ImportAsync(manifest);
        var path = Path.Combine(mediaRoot, "manifest.json");

        manifest.Save(path);
        var loaded = PixabayManifest.Load(path);

        Assert.Equal(manifest.Sources, loaded.Sources);
        Assert.Equal(manifest.Tracks, loaded.Tracks, (a, b) => a with { Tags = [] } == b with { Tags = [] } && a.Tags.SequenceEqual(b.Tags));
        Assert.Contains("\"sourceUrl\":", File.ReadAllText(path));
    }
}
