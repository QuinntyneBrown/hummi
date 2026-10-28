using Hummi.Cli.Pixabay;
using Hummi.Cli.Tests.Pixabay;
using Microsoft.Extensions.Configuration;

namespace Hummi.Cli.Tests;

public sealed class CliAppTests
{
    private static readonly IConfiguration Empty = new ConfigurationBuilder().Build();

    [Fact]
    public void Reset_is_refused_outside_Development()
    {
        var exitCode = CliApp.Run(["reset"], new StringWriter(), Empty, "Production");

        Assert.Equal(ExitCodes.Refused, exitCode);
    }

    [Fact]
    public void An_unknown_command_prints_usage()
    {
        var output = new StringWriter();

        var exitCode = CliApp.Run([], output, Empty, "Development");

        Assert.Equal(ExitCodes.Usage, exitCode);
        Assert.Contains("Usage", output.ToString());
    }

    [Fact]
    public void L2_056_AC5_import_fills_the_manifest_and_reports_what_it_did()
    {
        var root = Directory.CreateTempSubdirectory("hummi-cli-").FullName;
        try
        {
            var manifestPath = Path.Combine(root, "pixabay-manifest.json");
            new PixabayManifest { Sources = [PixabayPages.SourceUrl(1), "https://example.com/x-2/"] }.Save(manifestPath);
            var web = new FakePixabayWeb();
            web.Pages[PixabayPages.SourceUrl(1)] = PixabayPages.JsonLd(1);
            web.Pages[PixabayPages.LicenceUrl] = PixabayPages.Licence;
            web.Files[PixabayPages.AudioUrl(1)] = [1, 2, 3];
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?> { ["MediaStorage:RootPath"] = Path.Combine(root, "media") })
                .Build();
            var output = new StringWriter();

            var exitCode = CliApp.Run(["import", "--manifest", manifestPath], output, configuration, "Development", web);

            Assert.Equal(ExitCodes.Refused, exitCode);
            Assert.Contains("Imported 1 track, 0 already present, 0 restored, 1 refused.", output.ToString());
            Assert.Contains("https://example.com/x-2/: not a Pixabay music track page", output.ToString());
            Assert.Equal("Fixture Song", Assert.Single(PixabayManifest.Load(manifestPath).Tracks).Title);
            Assert.True(File.Exists(Path.Combine(root, "media", "pixabay", "1.mp3")));
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }

    [Fact]
    public void L2_056_the_committed_manifest_lists_real_pixabay_track_pages_and_only_pixabay_tracks()
    {
        var manifest = PixabayManifest.Load(PixabayManifest.DefaultPath);

        Assert.NotEmpty(manifest.Sources);
        Assert.All(manifest.Sources, source => Assert.NotNull(PixabayTrackPage.IdOf(new Uri(source))));
        Assert.All(manifest.Tracks, track =>
        {
            Assert.Contains(track.SourceUrl, manifest.Sources);
            Assert.Equal(PixabayTrackPage.ContentLicense, track.Licence.Name);
            Assert.False(string.IsNullOrWhiteSpace(track.Licence.Text));
            Assert.Matches("^[0-9a-f]{64}$", track.AudioSha256);
        });
    }
}
