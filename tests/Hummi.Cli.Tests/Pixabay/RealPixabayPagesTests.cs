using Hummi.Cli.Pixabay;

namespace Hummi.Cli.Tests.Pixabay;

/// <summary>
/// The reader against pages trimmed from real Pixabay pages (Pages/*.html, saved 2026-10-28). They differ from
/// the schema.org conventions the first fixtures followed: the JSON-LD name ends in " by {artist} | Royalty-free
/// Music", a track without its own cover still has a generic og:image, and the licence page has no main element.
/// </summary>
public sealed class RealPixabayPagesTests
{
    private const string LicenceUrl = "https://pixabay.com/service/license-summary/";

    [Fact]
    public void L2_056_AC1_a_real_track_page_gives_the_title_as_shown_without_the_artist_and_site_suffix()
    {
        var parse = PixabayTrackPage.Parse(new Uri(RealPages.HighTimesUrl), RealPages.Read("203465.html"));

        Assert.Empty(parse.Missing);
        var page = parse.Page!;
        Assert.Equal(203465, page.PixabayId);
        Assert.Equal("☘️ High Times - (Happy 420)", page.Title);
        Assert.Equal("SoundUniverseStudio", page.Artist);
        Assert.Equal("https://pixabay.com/users/sounduniversestudio-43016639/", page.ArtistUrl);
        Assert.Equal(168, page.DurationSeconds);
        Assert.Equal("Reggae", page.Genre);
        Assert.Equal(
            ["Edm", "Stoner Song", "Funny Song", "Edm Music", "Male Voice", "420", "Reggae", "Rasta", "Cbd", "Jamaica", "Ai Generated"],
            page.Tags);
        Assert.Equal("https://cdn.pixabay.com/audio/2024/04/20/18-38-35-118_200x200.jpg", page.CoverUrl);
        Assert.Equal(
            "https://cdn.pixabay.com/download/audio/2024/04/20/audio_8b1c1802d1.mp3?filename=sounduniversestudio-high-times-happy-420-203465.mp3",
            page.AudioUrl);
        Assert.Equal(PixabayTrackPage.ContentLicense, page.LicenceName);
        Assert.Equal(LicenceUrl, page.LicenceUrl);
    }

    [Fact]
    public void L2_056_AC1_a_title_that_itself_contains_a_bar_keeps_it()
    {
        var parse = PixabayTrackPage.Parse(new Uri(RealPages.DanceLikeUsykUrl), RealPages.Read("211087.html"));

        Assert.Empty(parse.Missing);
        var page = parse.Page!;
        Assert.Equal("Dance Like Usyk | Soca|Suno Music Show YouTube", page.Title);
        Assert.Equal("SunoMusicShowYouTube", page.Artist);
        Assert.Equal(252, page.DurationSeconds);
        Assert.Equal("Pop", page.Genre);
        Assert.Equal("https://cdn.pixabay.com/audio/2024/05/21/19-22-08-196_200x200.png", page.CoverUrl);
    }

    [Fact]
    public void L2_057_AC3_a_real_track_without_its_own_cover_has_no_cover_url_not_the_generic_gradient()
    {
        var parse = PixabayTrackPage.Parse(new Uri(RealPages.DreamingOfReggaeUrl), RealPages.Read("217732.html"));

        Assert.Empty(parse.Missing);
        var page = parse.Page!;
        Assert.Equal("Dreaming Of Reggae", page.Title);
        Assert.Equal("Figaro-Reggae-Music", page.Artist);
        Assert.Equal(239, page.DurationSeconds);
        Assert.Equal("Reggae", page.Genre);
        Assert.Null(page.CoverUrl);
    }

    [Theory]
    [InlineData("https://cdn.pixabay.com/gradients/cfd2f8-5ea69c_200x200.png")]
    [InlineData("https://pixabay.com/static/img/blank.gif")]
    [InlineData("https://pixabay.com/static/img/logo_square.png")]
    [InlineData("https://cdn.pixabay.com/user/2024/04/14/01-35-28-196_96x96.jpg")]
    public void L2_057_AC3_a_generic_pixabay_or_site_image_is_never_taken_as_a_cover(string image)
    {
        var html = PixabayPages.OpenGraph(7).Replace(PixabayPages.CoverUrl(7), image, StringComparison.Ordinal);

        var parse = PixabayTrackPage.Parse(new Uri(PixabayPages.SourceUrl(7)), html);

        Assert.Empty(parse.Missing);
        Assert.Null(parse.Page!.CoverUrl);
    }

    [Fact]
    public void L2_056_AC1_the_real_licence_page_gives_only_the_licence_text_without_menus_or_the_cookie_panel()
    {
        var text = PixabayTrackPage.LicenceText(RealPages.Read("license-summary.html"));

        Assert.NotNull(text);
        var lines = text.Split('\n');
        Assert.Equal("Content License Summary", lines[0]);
        Assert.Contains(
            "Welcome to Pixabay! Pixabay is a vibrant community of authors, artists and creators sharing royalty-free images, video, audio and other media. We refer to this collectively as \"Content\". By accessing and using Content, or by contributing Content, you agree to comply with our Content License.",
            lines);
        Assert.Contains("✓ Use Content for free", lines);
        Assert.Contains(
            "✕ You cannot sell or distribute Content (either in digital or physical form) on a Standalone basis. Standalone means where no creative effort has been applied to the Content and it remains in substantially the same form as it exists on our website.",
            lines);
        Assert.StartsWith("Please be aware that certain Content may be subject to additional intellectual property rights", lines[^1]);
        Assert.Equal(16, lines.Length);
        Assert.DoesNotContain("Privacy Preference Center", text);
        Assert.DoesNotContain("Explore", text);
        Assert.DoesNotContain("FAQ", text);
        Assert.DoesNotContain("Over 6.3 million", text);
    }

    [Fact]
    public async Task L2_056_AC1_real_pages_import_into_manifest_tracks()
    {
        var mediaRoot = Directory.CreateTempSubdirectory("hummi-real-").FullName;
        try
        {
            var web = new FakePixabayWeb();
            web.Pages[RealPages.HighTimesUrl] = RealPages.Read("203465.html");
            web.Pages[RealPages.DreamingOfReggaeUrl] = RealPages.Read("217732.html");
            web.Pages[LicenceUrl] = RealPages.Read("license-summary.html");
            web.Files["https://cdn.pixabay.com/download/audio/2024/04/20/audio_8b1c1802d1.mp3?filename=sounduniversestudio-high-times-happy-420-203465.mp3"] = [1, 2, 3];
            web.Files["https://cdn.pixabay.com/download/audio/2024/06/17/audio_101a5d9496.mp3?filename=figaro-reggae-music-dreaming-of-reggae-217732.mp3"] = [4, 5, 6];
            var manifest = new PixabayManifest { Sources = [RealPages.HighTimesUrl, RealPages.DreamingOfReggaeUrl] };

            var report = await new PixabayImporter(web, mediaRoot, new FixedClock(DateTimeOffset.UnixEpoch)).ImportAsync(manifest);

            Assert.Equal(2, report.Imported);
            Assert.Empty(report.Refused);
            Assert.Equal(["☘️ High Times - (Happy 420)", "Dreaming Of Reggae"], manifest.Tracks.Select(t => t.Title));
            Assert.Equal(["pixabay/203465.mp3", "pixabay/217732.mp3"], manifest.Tracks.Select(t => t.AudioFile));
            Assert.NotNull(manifest.Tracks[0].CoverUrl);
            Assert.Null(manifest.Tracks[1].CoverUrl);
            Assert.All(manifest.Tracks, t => Assert.DoesNotContain("Privacy Preference Center", t.Licence.Text));
        }
        finally
        {
            Directory.Delete(mediaRoot, recursive: true);
        }
    }
}

/// <summary>Pages trimmed from real Pixabay pages, copied next to the test assembly from Pixabay/Pages.</summary>
public static class RealPages
{
    public const string HighTimesUrl = "https://pixabay.com/music/reggae-shamrock-high-times-happy-420-203465/";

    public const string DanceLikeUsykUrl = "https://pixabay.com/music/pop-dance-like-usyk-socasuno-music-show-youtube-211087/";

    public const string DreamingOfReggaeUrl = "https://pixabay.com/music/reggae-dreaming-of-reggae-217732/";

    public static string Read(string file) => File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Pixabay", "Pages", file));
}
