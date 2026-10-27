using Hummi.Application.Discovery;
using Hummi.Application.Tests.Playback;
using Hummi.Domain.Catalogue;

namespace Hummi.Application.Tests.Discovery;

public sealed class DiscoveryHandlerTests
{
    private static TestDb WithGenres()
    {
        var db = new TestDb();
        db.Genres.AddRange(Genre.All());
        db.SaveChanges();
        return db;
    }

    private static Guid Soca(TestDb db) => db.Genres.Single(g => g.Slug == "soca").Id;

    private static Track[] AddSoca(TestDb db, params (string Title, long Plays)[] tracks)
    {
        var artist = Artist.Create("Kaiso Collective");
        db.Artists.Add(artist);
        var soca = Soca(db);
        var genred = tracks.Select((t, i) => Track.Create(t.Title, artist.Id, 200, null, TestDb.Now.AddDays(i), soca)).ToArray();
        for (var i = 0; i < genred.Length; i++)
        {
            for (var p = 0; p < tracks[i].Plays; p++)
            {
                genred[i].RegisterPlay(null, TestDb.Now);
            }
        }

        db.Tracks.AddRange(genred);
        db.SaveChanges();
        return genred;
    }

    [Fact]
    public async Task L2_003_the_directory_lists_the_ten_genres_in_order_with_counts_and_seven_moods()
    {
        using var db = WithGenres();
        var tracks = AddSoca(db, ("Feathers Up", 0), ("Wine Slow", 0), ("Big Truck Energy", 0));
        tracks[2].Withdraw();
        db.AddTracks("Unclassified", ("Loose Track", 0));
        await db.SaveChangesAsync();

        var directory = (await new GetGenreDirectoryQueryHandler(db).Handle(new GetGenreDirectoryQuery(), default)).Value!;

        Assert.Equal(10, directory.GenreCount);
        Assert.Equal(3, directory.OpenlyLicensedTrackCount);
        Assert.Equal(
            ["Soca", "Kids", "Steelpan & Calypso", "Dancehall", "Island chill", "Parang", "Chutney", "Reggae", "Zouk", "Rapso"],
            directory.Genres.Select(g => g.Name));
        Assert.Equal(2, directory.Genres[0].TrackCount);
        Assert.Equal(0, directory.Genres[1].TrackCount);
        Assert.Equal(Genre.MoodCount, directory.Moods.Count);
        Assert.Equal("soca", directory.Moods[0].Slug);
    }

    [Fact]
    public async Task L2_004_a_genre_lists_its_published_tracks_newest_first_with_its_count_and_description()
    {
        using var db = WithGenres();
        var tracks = AddSoca(db, ("Feathers Up", 5), ("Wine Slow", 1), ("Big Truck Energy", 9));
        tracks[0].Withdraw();
        await db.SaveChangesAsync();

        var page = (await new GetGenreTracksQueryHandler(db).Handle(new GetGenreTracksQuery("soca"), default)).Value!;

        Assert.Equal("Soca", page.Name);
        Assert.Equal("road-march riddims, J’ouvert mornings and fete anthems", page.Description);
        Assert.Equal(2, page.TrackCount);
        Assert.Equal(["Big Truck Energy", "Wine Slow"], page.Tracks.Select(t => t.Title));
        Assert.Equal(GenreTrackSort.Newest, page.Sort);
    }

    [Fact]
    public async Task L2_015_track_summaries_name_their_genre_for_playing_from_and_then_more()
    {
        using var db = WithGenres();
        AddSoca(db, ("Feathers Up", 0));

        var page = (await new GetGenreTracksQueryHandler(db).Handle(new GetGenreTracksQuery("soca"), default)).Value!;

        Assert.Equal("soca", page.Tracks[0].GenreSlug);
        Assert.Equal("Soca", page.Tracks[0].GenreName);
    }

    [Fact]
    public async Task L2_004_most_played_orders_by_play_count()
    {
        using var db = WithGenres();
        AddSoca(db, ("Feathers Up", 5), ("Wine Slow", 1), ("Big Truck Energy", 9));

        var page = (await new GetGenreTracksQueryHandler(db).Handle(new GetGenreTracksQuery("soca", GenreTrackSort.MostPlayed), default)).Value!;

        Assert.Equal(["Big Truck Energy", "Feathers Up", "Wine Slow"], page.Tracks.Select(t => t.Title));
    }

    [Fact]
    public async Task L2_004_a_genre_with_no_tracks_returns_an_empty_page()
    {
        using var db = WithGenres();

        var page = (await new GetGenreTracksQueryHandler(db).Handle(new GetGenreTracksQuery("kids"), default)).Value!;

        Assert.Equal(0, page.TrackCount);
        Assert.Empty(page.Tracks);
    }

    [Fact]
    public async Task Pages_hold_at_most_the_page_size()
    {
        using var db = WithGenres();
        AddSoca(db, Enumerable.Range(1, GetGenreTracksQueryHandler.PageSize + 3).Select(i => ($"Track {i}", 0L)).ToArray());
        var handler = new GetGenreTracksQueryHandler(db);

        var first = (await handler.Handle(new GetGenreTracksQuery("soca"), default)).Value!;
        var second = (await handler.Handle(new GetGenreTracksQuery("soca", Page: 2), default)).Value!;

        Assert.Equal(GetGenreTracksQueryHandler.PageSize, first.Tracks.Count);
        Assert.Equal(3, second.Tracks.Count);
        Assert.Equal(GetGenreTracksQueryHandler.PageSize + 3, second.TrackCount);
    }

    [Fact]
    public async Task An_unknown_genre_is_404_and_an_unknown_sort_or_page_is_422()
    {
        using var db = WithGenres();
        var handler = new GetGenreTracksQueryHandler(db);

        var unknown = await handler.Handle(new GetGenreTracksQuery("polka"), default);
        var badSort = await handler.Handle(new GetGenreTracksQuery("soca", "loudest"), default);
        var badPage = await handler.Handle(new GetGenreTracksQuery("soca", Page: 0), default);

        Assert.Equal("GENRE_NOT_FOUND", unknown.Error!.Code);
        Assert.Equal(404, unknown.Error.Status);
        Assert.Equal(422, badSort.Error!.Status);
        Assert.Contains("sort", badSort.Error.Errors!.Keys);
        Assert.Contains("page", badPage.Error!.Errors!.Keys);
    }
}
