using Hummi.Application.Playback;
using Hummi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Cli.Tests;

/// <summary>Seeds an EF Core in-memory database and a throwaway media directory.</summary>
public sealed class DemoSeederTests : IDisposable
{
    private readonly string mediaRoot = Directory.CreateTempSubdirectory("hummi-seed-").FullName;
    private readonly HummiDbContext db = new(
        new DbContextOptionsBuilder<HummiDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    public void Dispose()
    {
        db.Dispose();
        Directory.Delete(mediaRoot, recursive: true);
    }

    [Fact]
    public async Task Seed_writes_the_demo_catalogue_with_an_audio_file_per_track()
    {
        var added = await DemoSeeder.SeedAsync(db, mediaRoot, TimeProvider.System);

        Assert.Equal(DemoSeeder.Tracks.Count, added);
        Assert.Equal(DemoSeeder.Tracks.Count, await db.Tracks.CountAsync());
        Assert.Contains(await db.Artists.ToListAsync(), a => a.Name == "Kaiso Collective");
        foreach (var track in await db.Tracks.ToListAsync())
        {
            var file = Path.Combine(mediaRoot, track.AudioPath);
            Assert.True(File.Exists(file), file);
            var header = File.ReadAllBytes(file).AsSpan(0, 12).ToArray();
            Assert.Equal("RIFF", System.Text.Encoding.ASCII.GetString(header, 0, 4));
            Assert.Equal("WAVE", System.Text.Encoding.ASCII.GetString(header, 8, 4));
        }
    }

    [Fact]
    public async Task Seeded_plays_order_the_top_ten()
    {
        await DemoSeeder.SeedAsync(db, mediaRoot, TimeProvider.System);

        var home = (await new GetHomeQueryHandler(db).Handle(new GetHomeQuery(), default)).Value!;

        Assert.Equal("Big Truck Energy", home.TopTen[0].Title);
        Assert.Equal(10, home.TopTen.Count);
        Assert.Equal(GetHomeQueryHandler.RecentlyAddedCount, home.RecentlyAdded.Count);
    }

    [Fact]
    public async Task Seeded_tracks_fill_the_soca_genre_page()
    {
        await db.Database.EnsureCreatedAsync();
        await DemoSeeder.SeedAsync(db, mediaRoot, TimeProvider.System);

        var soca = (await new Hummi.Application.Discovery.GetGenreTracksQueryHandler(db)
            .Handle(new Hummi.Application.Discovery.GetGenreTracksQuery("soca"), default)).Value!;

        Assert.Equal(6, soca.TrackCount);
        Assert.Equal("Feathers Up", soca.Tracks[0].Title);
        Assert.DoesNotContain(await db.Tracks.ToListAsync(), t => t.GenreId is null);
    }

    [Fact]
    public async Task Seeded_catalogue_fills_the_track_artist_album_and_licence_pages()
    {
        await db.Database.EnsureCreatedAsync();
        await DemoSeeder.SeedAsync(db, mediaRoot, TimeProvider.System);

        var track = (await new Hummi.Application.Catalogue.GetTrackQueryHandler(db)
            .Handle(new Hummi.Application.Catalogue.GetTrackQuery("feathers-up"), default)).Value!;
        var artist = (await new Hummi.Application.Catalogue.GetArtistQueryHandler(db)
            .Handle(new Hummi.Application.Catalogue.GetArtistQuery("kaiso-collective"), default)).Value!;
        var album = (await new Hummi.Application.Catalogue.GetAlbumQueryHandler(db)
            .Handle(new Hummi.Application.Catalogue.GetAlbumQuery("mas-on-the-avenue"), default)).Value!;

        Assert.Equal("Mas on the Avenue", track.Album!.Title);
        Assert.Equal("openmusic-3b", track.GeneratedWith);
        Assert.Equal("CC0 1.0 (public domain)", track.LicenceLabel);
        Assert.Equal(64, track.Waveform.Count);
        Assert.Equal(["J’ouvert Morning"], track.MoreFromArtist.Select(t => t.Title));
        Assert.StartsWith("A soca band", artist.Description);
        Assert.Equal("mas-on-the-avenue", Assert.Single(artist.Releases).Slug);
        Assert.Equal("2026 · 2 tracks · 8 min · CC0 1.0 (public domain)", album.Summary);
        Assert.Contains(await db.Tracks.ToListAsync(), t => t.Licence == Hummi.Domain.Catalogue.Licence.CcBySa4);
    }

    [Fact]
    public async Task Seeding_twice_adds_nothing_the_second_time()
    {
        await DemoSeeder.SeedAsync(db, mediaRoot, TimeProvider.System);

        var added = await DemoSeeder.SeedAsync(db, mediaRoot, TimeProvider.System);

        Assert.Equal(0, added);
        Assert.Equal(DemoSeeder.Tracks.Count, await db.Tracks.CountAsync());
    }

    [Fact]
    public void Seed_without_a_connection_string_prints_what_to_set()
    {
        var output = new StringWriter();

        var exitCode = CliApp.Run(["seed"], output, new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build(), "Development");

        Assert.Equal(ExitCodes.Usage, exitCode);
        Assert.Contains("ConnectionStrings__Hummi", output.ToString());
    }
}
