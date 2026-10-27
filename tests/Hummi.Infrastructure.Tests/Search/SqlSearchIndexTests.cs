using Hummi.Application.Abstractions;
using Hummi.Domain.Catalogue;
using Hummi.Infrastructure.Persistence;
using Hummi.Infrastructure.Search;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Infrastructure.Tests.Search;

public sealed class SqlSearchIndexTests
{
    private static HummiDbContext Db() =>
        new(new DbContextOptionsBuilder<HummiDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static Track Add(HummiDbContext db, Artist artist, string title, int plays = 0)
    {
        var track = Track.Create(title, artist.Id, 200, null, DateTimeOffset.UnixEpoch);
        for (var i = 0; i < plays; i++)
        {
            track.RegisterPlay(null, DateTimeOffset.UnixEpoch);
        }

        db.Tracks.Add(track);
        return track;
    }

    [Fact]
    public async Task L2_006_matches_titles_and_names_case_insensitively_prefix_first_then_most_played()
    {
        using var db = Db();
        var steel = Artist.Create("Laventille Steel Orchestra");
        var players = Artist.Create("Panorama Players");
        var kaiso = Artist.Create("Kaiso Collective");
        db.Artists.AddRange(steel, players, kaiso);
        Add(db, steel, "Chrome and Copper Pan", plays: 9);
        Add(db, steel, "Panyard Nights", plays: 1);
        Add(db, players, "Steel Lullaby");
        Add(db, kaiso, "Feathers Up");
        await db.SaveChangesAsync();

        var hits = await new SqlSearchIndex(db).SearchAsync("PAN", 3, 7, default);

        Assert.Equal(["Panyard Nights", "Chrome and Copper Pan"], hits.Tracks.Select(t => t.Title));
        Assert.Equal("Laventille Steel Orchestra", hits.Tracks[0].ArtistName);
        Assert.Equal(["Panorama Players"], hits.Artists.Select(a => a.Name));
        Assert.Equal("panorama-players", hits.Artists[0].Slug);
    }

    [Fact]
    public async Task Withdrawn_tracks_and_artists_without_published_tracks_are_not_found()
    {
        using var db = Db();
        var steel = Artist.Create("Pan Masters");
        var silent = Artist.Create("Pan Silent");
        db.Artists.AddRange(steel, silent);
        Add(db, steel, "Pan Song");
        Add(db, silent, "Hidden").Withdraw();
        Add(db, steel, "Pan Gone").Withdraw();
        await db.SaveChangesAsync();

        var hits = await new SqlSearchIndex(db).SearchAsync("pan", 3, 7, default);

        Assert.Equal(["Pan Song"], hits.Tracks.Select(t => t.Title));
        Assert.Equal(["Pan Masters"], hits.Artists.Select(a => a.Name));
    }

    [Fact]
    public async Task Takes_at_most_the_requested_counts_and_treats_wildcards_literally()
    {
        using var db = Db();
        var artist = Artist.Create("Kaiso Collective");
        db.Artists.Add(artist);
        for (var i = 0; i < 9; i++)
        {
            Add(db, artist, $"Kaiso {i}");
        }

        Add(db, artist, "100% Soca");
        await db.SaveChangesAsync();

        var index = new SqlSearchIndex(db);
        var many = await index.SearchAsync("kaiso", 3, 7, default);
        var percent = await index.SearchAsync("0%", 3, 7, default);
        var underscore = await index.SearchAsync("_", 3, 7, default);

        Assert.Equal(7, many.Tracks.Count);
        Assert.Equal(["100% Soca"], percent.Tracks.Select(t => t.Title));
        Assert.Empty(underscore.Tracks);
    }

    [Fact]
    public async Task L2_007_a_database_failure_becomes_search_unavailable()
    {
        var db = Db();
        db.Dispose();

        await Assert.ThrowsAsync<SearchUnavailableException>(() => new SqlSearchIndex(db).SearchAsync("pan", 3, 7, default));
    }
}
