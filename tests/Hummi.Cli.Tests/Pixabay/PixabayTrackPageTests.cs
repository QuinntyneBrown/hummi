using Hummi.Cli.Pixabay;

namespace Hummi.Cli.Tests.Pixabay;

public sealed class PixabayTrackPageTests
{
    private static readonly Uri Source = new(PixabayPages.SourceUrl(203465));

    [Fact]
    public void L2_056_AC1_a_json_ld_page_gives_every_field()
    {
        var parse = PixabayTrackPage.Parse(Source, PixabayPages.JsonLd(203465));

        Assert.Empty(parse.Missing);
        var page = parse.Page!;
        Assert.Equal(203465, page.PixabayId);
        Assert.Equal("Fixture Song", page.Title);
        Assert.Equal("fixture_artist", page.Artist);
        Assert.Equal("https://pixabay.com/users/fixture_artist-123/", page.ArtistUrl);
        Assert.Equal(171, page.DurationSeconds);
        Assert.Equal("Beats", page.Genre);
        Assert.Equal(["reggae", "summer", "chill"], page.Tags);
        Assert.Equal(PixabayPages.CoverUrl(203465), page.CoverUrl);
        Assert.Equal(PixabayPages.AudioUrl(203465), page.AudioUrl);
        Assert.Equal(PixabayPages.LicenceUrl, page.LicenceUrl);
        Assert.Equal(PixabayTrackPage.ContentLicense, page.LicenceName);
    }

    [Fact]
    public void L2_056_AC1_open_graph_tags_are_read_when_there_is_no_json_ld()
    {
        var parse = PixabayTrackPage.Parse(new Uri(PixabayPages.SourceUrl(7)), PixabayPages.OpenGraph(7));

        Assert.Empty(parse.Missing);
        var page = parse.Page!;
        Assert.Equal("Fixture & Friends", page.Title);
        Assert.Equal("other_artist", page.Artist);
        Assert.Equal("https://pixabay.com/users/other_artist-9/", page.ArtistUrl);
        Assert.Equal(125, page.DurationSeconds);
        Assert.Null(page.Genre);
        Assert.Empty(page.Tags);
        Assert.Equal(PixabayPages.CoverUrl(7), page.CoverUrl);
        Assert.Equal(PixabayPages.AudioUrl(7), page.AudioUrl);
    }

    [Fact]
    public void L2_056_AC2_a_page_without_a_cover_is_still_complete()
    {
        var parse = PixabayTrackPage.Parse(Source, PixabayPages.JsonLd(203465, cover: false));

        Assert.Empty(parse.Missing);
        Assert.Null(parse.Page!.CoverUrl);
    }

    [Theory]
    [InlineData("title")]
    [InlineData("artist")]
    [InlineData("duration")]
    [InlineData("audio file")]
    [InlineData("Pixabay Content License")]
    public void L2_056_AC2_a_page_missing_a_required_field_names_it_and_gives_no_track(string field)
    {
        var html = field switch
        {
            "title" => PixabayPages.JsonLd(1, title: null),
            "artist" => PixabayPages.JsonLd(1, artist: null),
            "duration" => PixabayPages.JsonLd(1, duration: null),
            "audio file" => PixabayPages.JsonLd(1, audio: false),
            _ => PixabayPages.JsonLd(1, licence: "https://creativecommons.org/licenses/by/4.0/"),
        };

        var parse = PixabayTrackPage.Parse(new Uri(PixabayPages.SourceUrl(1)), html);

        Assert.Null(parse.Page);
        Assert.Equal([field], parse.Missing);
    }

    [Fact]
    public void L2_056_AC2_an_audio_file_outside_pixabay_is_not_accepted()
    {
        var html = PixabayPages.JsonLd(1).Replace(PixabayPages.AudioUrl(1), "https://example.com/song.mp3", StringComparison.Ordinal);

        var parse = PixabayTrackPage.Parse(new Uri(PixabayPages.SourceUrl(1)), html);

        Assert.Equal(["audio file"], parse.Missing);
    }

    [Theory]
    [InlineData("https://pixabay.com/music/reggae-shamrock-high-times-happy-420-203465/", 203465)]
    [InlineData("https://pixabay.com/music/island-zouk-caribbean-music-marimba-amp-steel-drum-3362/", 3362)]
    [InlineData("https://pixabay.com/music/search/soca/", null)]
    [InlineData("https://pixabay.com/sound-effects/rain-123/", null)]
    [InlineData("https://example.com/music/song-123/", null)]
    [InlineData("http://pixabay.com/music/song-123/", null)]
    public void L2_056_AC3_only_pixabay_music_track_pages_have_an_id(string url, int? id) =>
        Assert.Equal(id, PixabayTrackPage.IdOf(new Uri(url)));

    [Fact]
    public void L2_056_AC1_the_licence_text_is_the_main_content_line_by_line() =>
        Assert.Equal(PixabayPages.LicenceText, PixabayTrackPage.LicenceText(PixabayPages.Licence));
}
