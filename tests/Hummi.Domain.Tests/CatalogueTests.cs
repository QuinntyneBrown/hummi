using Hummi.Domain.Catalogue;

namespace Hummi.Domain.Tests;

public sealed class CatalogueTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 27, 9, 0, 0, TimeSpan.Zero);

    [Theory]
    [InlineData("Feathers Up", "feathers-up")]
    [InlineData("J’ouvert Morning", "jouvert-morning")]
    [InlineData("Chrome & Copper", "chrome-copper")]
    [InlineData("  Mango & Co.  ", "mango-co")]
    public void Slugs_are_lowercase_words_joined_by_hyphens(string text, string slug) =>
        Assert.Equal(slug, Slug.From(text));

    [Fact]
    public void A_track_takes_its_slug_from_its_title_unless_given_one()
    {
        var artist = Guid.NewGuid();

        Assert.Equal("feathers-up", Track.Create("Feathers Up", artist, 222, null, Now).Slug);
        Assert.Equal("feathers-up-2", Track.Create("Feathers Up", artist, 222, null, Now, slug: "feathers-up-2").Slug);
    }

    [Fact]
    public void L2_012_AC4_a_track_has_exactly_one_licence()
    {
        var artist = Guid.NewGuid();

        Assert.Equal(Licence.Cc0, Track.Create("Feathers Up", artist, 222, null, Now).Licence);
        Assert.Equal(Licence.CcBySa4, Track.Create("Fisherman Dawn", artist, 288, null, Now, licence: Licence.CcBySa4).Licence);
        Assert.Throws<ArgumentOutOfRangeException>(() => Track.Create("Wine Slow", artist, 214, null, Now, licence: (Licence)7));
        Assert.Equal(Licence.Pixabay, Track.Create("High Times", artist, 180, null, Now, licence: Licence.Pixabay).Licence);
        Assert.Equal(4, Enum.GetValues<Licence>().Length);
    }

    [Theory]
    [InlineData(Licence.Cc0, "CC0 1.0 (public domain)")]
    [InlineData(Licence.CcBy4, "CC BY 4.0")]
    [InlineData(Licence.CcBySa4, "CC BY-SA 4.0")]
    [InlineData(Licence.Pixabay, "Pixabay Content License")]
    public void Each_licence_has_the_label_the_pages_show(Licence licence, string label) =>
        Assert.Equal(label, LicenceLabels.Of(licence));

    [Fact]
    public void An_artist_has_a_slug_model_and_description()
    {
        var artist = Artist.Create("Kaiso Collective", "openmusic-3b", "A soca band.");

        Assert.Equal("kaiso-collective", artist.Slug);
        Assert.Equal("openmusic-3b", artist.ModelName);
        Assert.Equal("A soca band.", artist.Description);
        Assert.Equal(0, artist.MonthlyListeners);
    }

    [Fact]
    public void L2_010_AC1_an_artist_from_pixabay_has_no_model_and_no_description()
    {
        var artist = Artist.Create("SoundUniverseStudio", modelName: null);

        Assert.Null(artist.ModelName);
        Assert.Equal(string.Empty, artist.Description);
    }

    [Fact]
    public void L2_057_AC1_a_pixabay_track_keeps_its_source_and_mp3_audio()
    {
        var track = Track.Create(
            "High Times", Guid.NewGuid(), 180, null, Now, licence: Licence.Pixabay,
            sourceUrl: "https://pixabay.com/music/reggae-shamrock-high-times-happy-420-203465/");

        Assert.Equal("https://pixabay.com/music/reggae-shamrock-high-times-happy-420-203465/", track.SourceUrl);
        Assert.Equal(".mp3", track.AudioExtension);
        Assert.Equal($"tracks/{track.Id}.mp3", track.AudioPath);
        Assert.Throws<ArgumentException>(() => Track.Create("High Times", Guid.NewGuid(), 180, null, Now, audioExtension: "mp3"));
    }

    [Fact]
    public void Monthly_listeners_cannot_be_negative()
    {
        var artist = Artist.Create("Kaiso Collective");

        artist.SetMonthlyListeners(48_210);

        Assert.Equal(48_210, artist.MonthlyListeners);
        Assert.Throws<ArgumentOutOfRangeException>(() => artist.SetMonthlyListeners(-1));
    }

    [Fact]
    public void L2_011_AC3_an_album_is_published_only_with_at_least_one_track()
    {
        var artist = Artist.Create("Kaiso Collective");
        var album = Album.Create("Mas on the Avenue", artist.Id, 2026);
        var track = Track.Create("Feathers Up", artist.Id, 222, null, Now, albumId: album.Id, albumPosition: 1);

        Assert.Throws<InvalidOperationException>(() => album.Publish([]));
        Assert.False(album.Published);

        album.Publish([track]);

        Assert.True(album.Published);
        Assert.Equal("mas-on-the-avenue", album.Slug);
    }

    [Fact]
    public void An_album_cannot_publish_another_albums_tracks()
    {
        var artist = Artist.Create("Kaiso Collective");
        var album = Album.Create("Mas on the Avenue", artist.Id, 2026);
        var stray = Track.Create("Wine Slow", artist.Id, 214, null, Now);

        Assert.Throws<InvalidOperationException>(() => album.Publish([stray]));
    }

    [Fact]
    public void A_track_keeps_its_waveform_peaks_between_0_and_100()
    {
        var track = Track.Create("Feathers Up", Guid.NewGuid(), 222, null, Now);

        track.SetWaveform(new byte[] { 0, 50, 100 });

        Assert.Equal(new byte[] { 0, 50, 100 }, track.Waveform);
        Assert.Throws<ArgumentOutOfRangeException>(() => track.SetWaveform(new byte[] { 101 }));
    }
}
