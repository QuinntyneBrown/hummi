using Hummi.Application.Discovery;
using Hummi.Application.Tests.Accounts;
using Hummi.Application.Tests.Playback;
using Hummi.Domain.Accounts;
using Hummi.Domain.Catalogue;

namespace Hummi.Application.Tests.Discovery;

public sealed class HomeQueryTests
{
    private readonly TestDb db = new();
    private readonly FakeClock clock = new(TestDb.Now.AddDays(10));

    private Task<Common.Result<HomeShelfDto>> Shelf(string key) =>
        new GetHomeShelfQueryHandler(db, clock).Handle(new GetHomeShelfQuery(key), default);

    [Fact]
    public async Task L2_001_AC4_recently_added_is_newest_first_and_top_10_is_by_plays()
    {
        db.AddTracks("Kaiso Collective", ("Feathers Up", 5), ("Road March Riddim", 9), ("Wine Slow", 1));

        var recent = (await Shelf("recently-added")).Value!;
        var top = (await Shelf("top-10")).Value!;

        Assert.Equal(["Wine Slow", "Road March Riddim", "Feathers Up"], recent.Tracks.Select(t => t.Title));
        Assert.Equal(["Road March Riddim", "Feathers Up", "Wine Slow"], top.Tracks.Select(t => t.Title));
        Assert.Equal(200, top.Tracks[0].DurationSeconds);
    }

    [Fact]
    public async Task Shelves_leave_out_withdrawn_tracks_and_are_capped()
    {
        var tracks = db.AddTracks("Lady Tamboo", Enumerable.Range(1, 12).Select(i => ($"Track {i}", (long)i)).ToArray());
        tracks[11].Withdraw();
        await db.SaveChangesAsync();

        Assert.Equal(GetHomeShelfQueryHandler.RecentlyAddedCount, (await Shelf("recently-added")).Value!.Tracks.Count);
        var top = (await Shelf("top-10")).Value!;
        Assert.Equal(10, top.Tracks.Count);
        Assert.Equal("Track 11", top.Tracks[0].Title);
    }

    [Fact]
    public async Task L2_001_AC6_tracks_added_in_the_last_7_days_are_new()
    {
        // AddTracks adds one a day from TestDb.Now; the clock is 10 days later, so days 3 to 9 are new.
        db.AddTracks("Shanique", Enumerable.Range(0, 10).Select(i => ($"Day {i}", 0L)).ToArray());

        var recent = (await Shelf("recently-added")).Value!;

        Assert.Equal(6, recent.NewTrackIds.Count);
        Assert.Equal(7, (await Shelf("top-10")).Value!.NewTrackIds.Count);
    }

    [Fact]
    public async Task L2_001_AC4_a_genre_shelf_lists_that_genre_and_an_unknown_key_is_404()
    {
        var soca = Genre.All()[0];
        var artist = Artist.Create("Kaiso Collective");
        db.Genres.Add(soca);
        db.Artists.Add(artist);
        db.Tracks.Add(Track.Create("Feathers Up", artist.Id, 222, null, TestDb.Now, genreId: soca.Id));
        db.Tracks.Add(Track.Create("Lullaby", artist.Id, 100, null, TestDb.Now));
        await db.SaveChangesAsync();

        Assert.Equal(["Feathers Up"], (await Shelf("soca")).Value!.Tracks.Select(t => t.Title));
        Assert.Equal(404, (await Shelf("parang")).Error!.Status);
    }

    [Fact]
    public async Task L2_001_AC1_the_billboard_is_the_featured_album_in_album_order()
    {
        var artist = Artist.Create("Kaiso Collective");
        var album = Album.Create("Mas on the Avenue", artist.Id, 2026);
        var other = Album.Create("Older", artist.Id, 2026);
        db.Artists.Add(artist);
        db.Albums.AddRange(album, other);
        var a = Track.Create("Feathers Up", artist.Id, 222, null, TestDb.Now, albumId: album.Id, albumPosition: 1);
        var b = Track.Create("J’ouvert Morning", artist.Id, 238, null, TestDb.Now, albumId: album.Id, albumPosition: 2);
        var c = Track.Create("Elsewhere", artist.Id, 100, null, TestDb.Now, albumId: other.Id, albumPosition: 1);
        db.Tracks.AddRange(b, a, c);
        album.Publish([a, b]);
        other.Publish([c]);
        album.Feature("New album · Carnival 2025", "Twelve road-ready tracks.");
        await db.SaveChangesAsync();

        var featured = (await new GetFeaturedAlbumQueryHandler(db).Handle(new GetFeaturedAlbumQuery(), default)).Value!;

        Assert.Equal("Mas on the Avenue", featured.Title);
        Assert.Equal("New album · Carnival 2025", featured.Kicker);
        Assert.Equal("kaiso-collective", featured.ArtistSlug);
        Assert.Equal(2, featured.TrackCount);
        Assert.Equal(460, featured.DurationSeconds);
        Assert.Equal(["Feathers Up", "J’ouvert Morning"], featured.Tracks.Select(t => t.Title));
    }

    [Fact]
    public async Task L2_002_AC1_a_listener_without_plays_has_no_history_and_a_visitor_does()
    {
        var nadia = Listener.Create("Nadia", "nadia@example.com", "hash", TestDb.Now);
        db.Listeners.Add(nadia);
        var track = db.AddTracks("Shanique", ("Red Light Riddim", 0))[0];
        var handler = new GetHomeSummaryQueryHandler(db);

        Assert.True((await handler.Handle(new(null), default)).Value!.HasHistory);
        Assert.False((await handler.Handle(new(nadia.Id), default)).Value!.HasHistory);

        db.PlayEvents.Add(track.RegisterPlay(nadia.Id, TestDb.Now));
        await db.SaveChangesAsync();
        Assert.True((await handler.Handle(new(nadia.Id), default)).Value!.HasHistory);
    }
}
