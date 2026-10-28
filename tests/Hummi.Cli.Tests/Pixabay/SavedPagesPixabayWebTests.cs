using Hummi.Cli.Pixabay;
using Microsoft.Extensions.Configuration;

namespace Hummi.Cli.Tests.Pixabay;

public sealed class SavedPagesPixabayWebTests : IDisposable
{
    private const string HighTimesAudio = "https://cdn.pixabay.com/download/audio/2024/04/20/audio_8b1c1802d1.mp3?filename=sounduniversestudio-high-times-happy-420-203465.mp3";

    private readonly string root = Directory.CreateTempSubdirectory("hummi-pages-").FullName;

    public void Dispose() => Directory.Delete(root, recursive: true);

    [Theory]
    [InlineData("https://pixabay.com/music/reggae-shamrock-high-times-happy-420-203465/", "203465.html")]
    [InlineData("https://pixabay.com/service/license-summary/", "license-summary.html")]
    [InlineData("https://pixabay.com/", null)]
    [InlineData("https://example.com/service/license-summary/", null)]
    [InlineData("https://cdn.pixabay.com/download/audio/2024/04/20/audio_8b1c1802d1.mp3", null)]
    public void L2_056_AC6_a_page_is_saved_as_its_id_or_its_last_path_segment(string url, string? file) =>
        Assert.Equal(file, SavedPagesPixabayWeb.FileNameOf(new Uri(url)));

    [Fact]
    public async Task L2_056_AC6_pages_come_from_the_folder_and_files_from_the_inner_source()
    {
        var pages = Directory.CreateDirectory(Path.Combine(root, "pages")).FullName;
        await File.WriteAllTextAsync(Path.Combine(pages, "203465.html"), "saved track page");
        var inner = new FakePixabayWeb();
        inner.Pages[RealPages.HighTimesUrl] = "fetched track page";
        inner.Files[HighTimesAudio] = [7];
        var web = new SavedPagesPixabayWeb(pages, inner);

        Assert.Equal("saved track page", await web.GetPageAsync(new Uri(RealPages.HighTimesUrl)));
        Assert.Null(await web.GetPageAsync(new Uri(RealPages.DreamingOfReggaeUrl)));
        Assert.Equal(new byte[] { 7 }, await web.GetFileAsync(new Uri(HighTimesAudio)));
        Assert.Equal([HighTimesAudio], inner.Fetched);
    }

    [Fact]
    public void L2_056_AC6_import_with_pages_reads_saved_pages_and_downloads_only_the_audio()
    {
        var pages = Directory.CreateDirectory(Path.Combine(root, "pages")).FullName;
        File.WriteAllText(Path.Combine(pages, "203465.html"), RealPages.Read("203465.html"));
        File.WriteAllText(Path.Combine(pages, "license-summary.html"), RealPages.Read("license-summary.html"));
        var manifestPath = Path.Combine(root, "pixabay-manifest.json");
        new PixabayManifest { Sources = [RealPages.HighTimesUrl, RealPages.DreamingOfReggaeUrl] }.Save(manifestPath);
        var web = new FakePixabayWeb();
        web.Files[HighTimesAudio] = [1, 2, 3];
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["MediaStorage:RootPath"] = Path.Combine(root, "media") })
            .Build();
        var output = new StringWriter();

        var exitCode = CliApp.Run(["import", "--manifest", manifestPath, "--pages", pages], output, configuration, "Development", web);

        Assert.Equal(ExitCodes.Refused, exitCode);
        Assert.Equal([HighTimesAudio], web.Fetched);
        var track = Assert.Single(PixabayManifest.Load(manifestPath).Tracks);
        Assert.Equal("☘️ High Times - (Happy 420)", track.Title);
        Assert.StartsWith("Content License Summary\n", track.Licence.Text, StringComparison.Ordinal);
        Assert.Contains($"Refused {RealPages.DreamingOfReggaeUrl}: the page could not be fetched", output.ToString());
        Assert.Contains($"Save the missing pages into {pages}", output.ToString());
        Assert.True(File.Exists(Path.Combine(root, "media", "pixabay", "203465.mp3")));
    }

    [Fact]
    public void L2_056_AC6_import_without_pages_explains_the_bot_check_when_a_page_cannot_be_fetched()
    {
        var manifestPath = Path.Combine(root, "pixabay-manifest.json");
        new PixabayManifest { Sources = [RealPages.HighTimesUrl] }.Save(manifestPath);
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["MediaStorage:RootPath"] = Path.Combine(root, "media") })
            .Build();
        var output = new StringWriter();

        CliApp.Run(["import", "--manifest", manifestPath], output, configuration, "Development", new FakePixabayWeb());

        Assert.Contains("answers plain requests with a bot check", output.ToString());
        Assert.Contains("--pages <folder>", output.ToString());
    }
}
