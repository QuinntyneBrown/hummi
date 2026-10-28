using Hummi.Application.Catalogue;
using Hummi.Application.Tests.Playback;
using Hummi.Domain.Catalogue;

namespace Hummi.Application.Tests.Catalogue;

public sealed class CatalogueHandlerTests
{
    /// <summary>The demo shape of the mocks: Kaiso Collective's album Mas on the Avenue, and Lady Tamboo in the same genre.</summary>
    private sealed class Catalogue : IDisposable
    {
        public TestDb Db { get; } = new();

        public Artist Kaiso { get; }

        public Album MasOnTheAvenue { get; }

        public Track FeathersUp { get; }

        public Track JouvertMorning { get; }

        public Track RoadMarch { get; }

        public Catalogue()
        {
            Db.Genres.AddRange(Genre.All());
            Db.SaveChanges();
            var soca = Db.Genres.Single(g => g.Slug == "soca").Id;
            Kaiso = Artist.Create("Kaiso Collective", "openmusic-3b", "A soca band generated with an open-weights model.");
            var tamboo = Artist.Create("Lady Tamboo");
            MasOnTheAvenue = Album.Create("Mas on the Avenue", Kaiso.Id, 2026);
            FeathersUp = Track.Create("Feathers Up", Kaiso.Id, 222, "https://covers.example/feathers.jpg", TestDb.Now, soca, albumId: MasOnTheAvenue.Id, albumPosition: 1);
            JouvertMorning = Track.Create("J’ouvert Morning", Kaiso.Id, 238, null, TestDb.Now.AddDays(1), soca, albumId: MasOnTheAvenue.Id, albumPosition: 2);
            RoadMarch = Track.Create("Road March Riddim", tamboo.Id, 245, null, TestDb.Now.AddDays(2), soca, Licence.CcBy4);
            FeathersUp.SetWaveform(new byte[] { 10, 80, 40 });
            for (var i = 0; i < 3; i++)
            {
                FeathersUp.RegisterPlay(null, TestDb.Now);
            }

            JouvertMorning.RegisterPlay(null, TestDb.Now);
            MasOnTheAvenue.Publish([FeathersUp, JouvertMorning]);
            Db.Artists.AddRange(Kaiso, tamboo);
            Db.Albums.Add(MasOnTheAvenue);
            Db.Tracks.AddRange(FeathersUp, JouvertMorning, RoadMarch);
            Db.SaveChanges();
        }

        public void Dispose() => Db.Dispose();
    }

    [Fact]
    public async Task L2_008_the_track_detail_names_artist_album_genre_model_licence_plays_and_waveform()
    {
        using var c = new Catalogue();

        var track = (await new GetTrackQueryHandler(c.Db).Handle(new GetTrackQuery("feathers-up"), default)).Value!;

        Assert.Equal("Feathers Up", track.Title);
        Assert.Equal("feathers-up", track.Slug);
        Assert.Equal(c.FeathersUp.Id.ToString(), track.Id);
        Assert.Equal(222, track.DurationSeconds);
        Assert.Equal(new ArtistRefDto("kaiso-collective", "Kaiso Collective"), track.Artist);
        Assert.Equal(new AlbumRefDto("mas-on-the-avenue", "Mas on the Avenue"), track.Album);
        Assert.Equal("Soca", track.Genre);
        Assert.Equal("openmusic-3b", track.GeneratedWith);
        Assert.Equal(Licence.Cc0, track.Licence);
        Assert.Equal("CC0 1.0 (public domain)", track.LicenceLabel);
        Assert.Equal(3, track.Plays);
        Assert.True(track.Playable);
        Assert.Equal([10, 80, 40], track.Waveform);
    }

    [Fact]
    public async Task L2_008_AC3_a_pixabay_track_has_its_source_and_licence_and_no_model()
    {
        using var c = new Catalogue();
        var uploader = Artist.Create("SoundUniverseStudio");
        c.Db.Artists.Add(uploader);
        c.Db.Tracks.Add(Track.Create(
            "High Times", uploader.Id, 180, null, TestDb.Now, licence: Licence.Pixabay,
            sourceUrl: "https://pixabay.com/music/reggae-shamrock-high-times-happy-420-203465/"));
        c.Db.SaveChanges();

        var track = (await new GetTrackQueryHandler(c.Db).Handle(new GetTrackQuery("high-times"), default)).Value!;
        var artist = (await new GetArtistQueryHandler(c.Db).Handle(new GetArtistQuery("sounduniversestudio"), default)).Value!;

        Assert.Null(track.GeneratedWith);
        Assert.Equal(Licence.Pixabay, track.Licence);
        Assert.Equal("Pixabay Content License", track.LicenceLabel);
        Assert.Equal("https://pixabay.com/music/reggae-shamrock-high-times-happy-420-203465/", track.SourceUrl);
        Assert.Null(track.Album);
        Assert.Null(track.Genre);
        Assert.Null(artist.ModelName);
        Assert.Equal(string.Empty, artist.Description);
    }

    [Fact]
    public async Task L2_008_AC4_more_from_lists_the_artists_other_playable_tracks_and_no_similar_shelf()
    {
        using var c = new Catalogue();

        var track = (await new GetTrackQueryHandler(c.Db).Handle(new GetTrackQuery("feathers-up"), default)).Value!;

        Assert.Equal(["J’ouvert Morning"], track.MoreFromArtist.Select(t => t.Title));
        Assert.Equal("jouvert-morning", track.MoreFromArtist[0].Slug);
        Assert.Empty(track.Similar);
    }

    [Fact]
    public async Task L2_009_a_withdrawn_track_is_not_playable_and_lists_similar_playable_tracks()
    {
        using var c = new Catalogue();
        c.FeathersUp.Withdraw();
        c.Db.SaveChanges();

        var track = (await new GetTrackQueryHandler(c.Db).Handle(new GetTrackQuery("feathers-up"), default)).Value!;

        Assert.False(track.Playable);
        Assert.Equal("CC0 1.0 (public domain)", track.LicenceLabel);
        Assert.Empty(track.MoreFromArtist);
        Assert.Equal(["J’ouvert Morning", "Road March Riddim"], track.Similar.Select(t => t.Title));
    }

    [Fact]
    public async Task L2_009_similar_tracks_leave_out_withdrawn_ones()
    {
        using var c = new Catalogue();
        c.FeathersUp.Withdraw();
        c.RoadMarch.Withdraw();
        c.Db.SaveChanges();

        var track = (await new GetTrackQueryHandler(c.Db).Handle(new GetTrackQuery("feathers-up"), default)).Value!;

        Assert.Equal(["J’ouvert Morning"], track.Similar.Select(t => t.Title));
    }

    [Fact]
    public async Task L2_009_AC3_an_unknown_track_is_404()
    {
        using var c = new Catalogue();

        var result = await new GetTrackQueryHandler(c.Db).Handle(new GetTrackQuery("no-such-track"), default);

        Assert.Equal(404, result.Error!.Status);
        Assert.Equal("TRACK_NOT_FOUND", result.Error.Code);
    }

    [Fact]
    public async Task L2_010_the_artist_detail_has_listeners_model_description_popular_and_releases()
    {
        using var c = new Catalogue();
        c.Kaiso.SetMonthlyListeners(48_210);
        c.Db.SaveChanges();

        var artist = (await new GetArtistQueryHandler(c.Db).Handle(new GetArtistQuery("kaiso-collective"), default)).Value!;

        Assert.Equal("Kaiso Collective", artist.Name);
        Assert.Equal("kaiso-collective", artist.Slug);
        Assert.Equal(48_210, artist.MonthlyListeners);
        Assert.Equal("openmusic-3b", artist.ModelName);
        Assert.Equal("A soca band generated with an open-weights model.", artist.Description);
        Assert.False(artist.Following);
        Assert.Equal(["Feathers Up", "J’ouvert Morning"], artist.Popular.Select(t => t.Title));
        Assert.Equal("https://covers.example/feathers.jpg", artist.CoverUrl);
        var release = Assert.Single(artist.Releases);
        Assert.Equal(new AlbumTileDto("mas-on-the-avenue", "Mas on the Avenue", 2026, 2, "https://covers.example/feathers.jpg"), release);
    }

    [Fact]
    public async Task L2_010_popular_holds_at_most_five_playable_tracks_by_plays()
    {
        using var c = new Catalogue();
        var more = Enumerable.Range(1, 6).Select(i => Track.Create($"Extra {i}", c.Kaiso.Id, 200, null, TestDb.Now)).ToArray();
        for (var i = 0; i < more.Length; i++)
        {
            for (var p = 0; p < 10 + i; p++)
            {
                more[i].RegisterPlay(null, TestDb.Now);
            }
        }

        more[5].Withdraw();
        c.Db.Tracks.AddRange(more);
        c.Db.SaveChanges();

        var artist = (await new GetArtistQueryHandler(c.Db).Handle(new GetArtistQuery("kaiso-collective"), default)).Value!;

        Assert.Equal(GetArtistQueryHandler.PopularCount, artist.Popular.Count);
        Assert.Equal(["Extra 5", "Extra 4", "Extra 3", "Extra 2", "Extra 1"], artist.Popular.Select(t => t.Title));
    }

    [Fact]
    public async Task L2_010_AC3_an_artist_with_no_published_tracks_has_empty_popular_and_releases()
    {
        using var c = new Catalogue();
        c.Db.Artists.Add(Artist.Create("Quiet Newcomer"));
        c.Db.Albums.Add(Album.Create("Unreleased", c.Kaiso.Id, 2027));
        c.Db.SaveChanges();

        var newcomer = (await new GetArtistQueryHandler(c.Db).Handle(new GetArtistQuery("quiet-newcomer"), default)).Value!;
        var kaiso = (await new GetArtistQueryHandler(c.Db).Handle(new GetArtistQuery("kaiso-collective"), default)).Value!;

        Assert.Empty(newcomer.Popular);
        Assert.Empty(newcomer.Releases);
        Assert.Single(kaiso.Releases);
    }

    [Fact]
    public async Task An_unknown_artist_is_404()
    {
        using var c = new Catalogue();

        var result = await new GetArtistQueryHandler(c.Db).Handle(new GetArtistQuery("nobody"), default);

        Assert.Equal("ARTIST_NOT_FOUND", result.Error!.Code);
        Assert.Equal(404, result.Error.Status);
    }

    [Fact]
    public async Task L2_010_monthly_listeners_count_distinct_signed_in_listeners_of_the_last_30_days()
    {
        using var c = new Catalogue();
        var ana = Guid.NewGuid();
        var ben = Guid.NewGuid();
        var now = TestDb.Now.AddDays(40);
        c.Db.PlayEvents.AddRange(
            c.FeathersUp.RegisterPlay(ana, now.AddDays(-1)),
            c.JouvertMorning.RegisterPlay(ana, now.AddDays(-2)),
            c.FeathersUp.RegisterPlay(ben, now.AddDays(-29)),
            c.FeathersUp.RegisterPlay(Guid.NewGuid(), now.AddDays(-31)),
            c.FeathersUp.RegisterPlay(null, now.AddDays(-1)),
            c.RoadMarch.RegisterPlay(ana, now.AddDays(-1)));
        c.Db.SaveChanges();

        var updated = (await new RefreshMonthlyListenersCommandHandler(c.Db, new FixedClock(now)).Handle(new RefreshMonthlyListenersCommand(), default)).Value;

        Assert.Equal(2, c.Db.Artists.Single(a => a.Name == "Kaiso Collective").MonthlyListeners);
        Assert.Equal(1, c.Db.Artists.Single(a => a.Name == "Lady Tamboo").MonthlyListeners);
        Assert.Equal(2, updated);
    }

    [Fact]
    public async Task L2_010_an_artist_nobody_played_this_month_drops_to_zero_listeners()
    {
        using var c = new Catalogue();
        c.Kaiso.SetMonthlyListeners(48_210);
        c.Db.SaveChanges();

        await new RefreshMonthlyListenersCommandHandler(c.Db, new FixedClock(TestDb.Now)).Handle(new RefreshMonthlyListenersCommand(), default);

        Assert.Equal(0, c.Db.Artists.Single(a => a.Name == "Kaiso Collective").MonthlyListeners);
    }

    [Fact]
    public async Task L2_011_the_album_detail_lists_tracks_in_album_order_with_its_summary()
    {
        using var c = new Catalogue();

        var album = (await new GetAlbumQueryHandler(c.Db).Handle(new GetAlbumQuery("mas-on-the-avenue"), default)).Value!;

        Assert.Equal("Mas on the Avenue", album.Title);
        Assert.Equal(new ArtistRefDto("kaiso-collective", "Kaiso Collective"), album.Artist);
        Assert.Equal(["Feathers Up", "J’ouvert Morning"], album.Tracks.Select(t => t.Title));
        Assert.Equal("2026 · 2 tracks · 8 min · CC0 1.0 (public domain)", album.Summary);
        Assert.Equal("https://covers.example/feathers.jpg", album.CoverUrl);
    }

    [Theory]
    [InlineData(new[] { 60 }, Licence.Cc0, Licence.Cc0, "2026 · 1 track · 1 min · CC0 1.0 (public domain)")]
    [InlineData(new[] { 61, 60 }, Licence.CcBy4, Licence.CcBy4, "2026 · 2 tracks · 3 min · CC BY 4.0")]
    [InlineData(new[] { 30, 30 }, Licence.Cc0, Licence.CcBySa4, "2026 · 2 tracks · 1 min · mixed licences")]
    public void L2_011_the_summary_rounds_minutes_up_and_names_the_shared_licence(int[] seconds, Licence first, Licence second, string summary)
    {
        var licences = seconds.Select((_, i) => i == 0 ? first : second).ToArray();

        Assert.Equal(summary, AlbumSummary.Of(2026, seconds, licences));
    }

    [Fact]
    public async Task L2_011_AC3_an_unpublished_or_unknown_album_is_404()
    {
        using var c = new Catalogue();
        c.Db.Albums.Add(Album.Create("Unreleased", c.Kaiso.Id, 2027));
        c.Db.SaveChanges();

        var unpublished = await new GetAlbumQueryHandler(c.Db).Handle(new GetAlbumQuery("unreleased"), default);
        var unknown = await new GetAlbumQueryHandler(c.Db).Handle(new GetAlbumQuery("nothing"), default);

        Assert.Equal("ALBUM_NOT_FOUND", unpublished.Error!.Code);
        Assert.Equal(404, unknown.Error!.Status);
    }

    private sealed class FixedClock(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
