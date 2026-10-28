using Hummi.Application.Catalogue;
using Hummi.Application.Discovery;
using Hummi.Cli.Pixabay;
using Hummi.Cli.Tests.Pixabay;
using Hummi.Domain.Catalogue;
using Hummi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Cli.Tests;

/// <summary>Seeds an EF Core in-memory database from a manifest of fixture tracks and a throwaway media directory.</summary>
public sealed class DemoSeederTests : IDisposable
{
    private static readonly DateTimeOffset Now = new(2026, 10, 28, 9, 0, 0, TimeSpan.Zero);

    private readonly string mediaRoot = Directory.CreateTempSubdirectory("hummi-seed-").FullName;
    private readonly HummiDbContext db = new(
        new DbContextOptionsBuilder<HummiDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    public DemoSeederTests() => db.Database.EnsureCreated();

    public void Dispose()
    {
        db.Dispose();
        Directory.Delete(mediaRoot, recursive: true);
    }

    /// <summary>A manifest track with cached audio; the values are fixtures, not catalogue data.</summary>
    private ManifestTrack Track(int id, string title, string artist, string? genre = null, string[]? tags = null, bool cover = true, bool cached = true)
    {
        byte[] audio = [0x49, 0x44, 0x33, (byte)id, 1, 2, 3];
        if (cached)
        {
            Directory.CreateDirectory(Path.Combine(mediaRoot, "pixabay"));
            File.WriteAllBytes(Path.Combine(mediaRoot, "pixabay", $"{id}.mp3"), audio);
        }

        return new ManifestTrack(
            id,
            PixabayPages.SourceUrl(id),
            title,
            artist,
            $"https://pixabay.com/users/{artist}-1/",
            120 + id,
            genre,
            tags ?? [],
            cover ? PixabayPages.CoverUrl(id) : null,
            PixabayPages.AudioUrl(id),
            $"pixabay/{id}.mp3",
            audio.Length,
            PixabayImporter.Sha256(audio),
            new ManifestLicence(PixabayTrackPage.ContentLicense, PixabayPages.LicenceUrl, PixabayPages.LicenceText),
            Now);
    }

    private PixabayManifest Manifest(params ManifestTrack[] tracks) =>
        new() { Sources = [.. tracks.Select(t => t.SourceUrl)], Tracks = [.. tracks] };

    private PixabayManifest Few() => Manifest(
        Track(1, "First Fixture", "uploader_a", genre: "Reggae"),
        Track(2, "Second Fixture", "uploader_b", tags: ["Caribbean", "Zouk"], cover: false),
        Track(3, "Third Fixture", "uploader_a", genre: "Beats", tags: ["Steel Drums"]));

    private Task<SeedReport> Seed(PixabayManifest manifest) => DemoSeeder.SeedAsync(db, manifest, mediaRoot, new FixedClock(Now));

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(3)]
    public async Task L2_057_AC1_the_catalogue_holds_exactly_the_manifest_tracks(int count)
    {
        var manifest = Manifest([.. Few().Tracks.Take(count)]);

        var report = await Seed(manifest);

        Assert.Equal(count, report.Added);
        Assert.Empty(report.Skipped);
        var tracks = await db.Tracks.Include(t => t.Artist).OrderByDescending(t => t.AddedAt).ToListAsync();
        Assert.Equal(manifest.Tracks.Select(t => t.Title), tracks.Select(t => t.Title));
        Assert.Equal(manifest.Tracks.Select(t => t.Artist).Distinct().Count(), await db.Artists.CountAsync());
        Assert.Empty(await db.Albums.ToListAsync());
        Assert.Empty(await db.PlayEvents.ToListAsync());
        foreach (var (track, entry) in tracks.Zip(manifest.Tracks))
        {
            Assert.Equal(entry.Artist, track.Artist!.Name);
            Assert.Null(track.Artist.ModelName);
            Assert.Equal(string.Empty, track.Artist.Description);
            Assert.Equal(entry.DurationSeconds, track.DurationSeconds);
            Assert.Equal(Licence.Pixabay, track.Licence);
            Assert.Equal(entry.SourceUrl, track.SourceUrl);
            Assert.Equal(0, track.PlayCount);
            Assert.Null(track.AlbumId);
            Assert.Equal($"tracks/{track.Id}.mp3", track.AudioPath);
            Assert.Equal(File.ReadAllBytes(Path.Combine(mediaRoot, entry.AudioFile)), File.ReadAllBytes(Path.Combine(mediaRoot, track.AudioPath)));
        }
    }

    [Fact]
    public async Task L2_057_AC2_a_track_is_listed_under_the_genre_its_genre_or_a_tag_names()
    {
        await Seed(Few());

        var genres = await db.Tracks.Include(t => t.Genre).ToDictionaryAsync(t => t.Title, t => t.Genre?.Slug);

        Assert.Equal("reggae", genres["First Fixture"]);
        Assert.Equal("zouk", genres["Second Fixture"]);
        Assert.Equal("steelpan", genres["Third Fixture"]);
    }

    [Fact]
    public async Task L2_057_AC3_a_track_keeps_its_cover_or_gets_a_generated_one()
    {
        await Seed(Few());

        var covers = await db.Tracks.ToDictionaryAsync(t => t.Title, t => t.CoverUrl);

        Assert.Equal(PixabayPages.CoverUrl(1), covers["First Fixture"]);
        var zouk = Genre.All().Single(g => g.Slug == "zouk");
        Assert.Equal(GeneratedCover.DataUrl("Second Fixture", zouk.Tone), covers["Second Fixture"]);
    }

    [Fact]
    public async Task L2_057_AC4_a_track_whose_audio_is_missing_or_corrupt_is_skipped_and_reported()
    {
        var manifest = Manifest(
            Track(1, "First Fixture", "uploader_a"),
            Track(2, "Second Fixture", "uploader_b", cached: false),
            Track(3, "Third Fixture", "uploader_c"));
        File.WriteAllBytes(Path.Combine(mediaRoot, "pixabay", "3.mp3"), [0]);

        var report = await Seed(manifest);

        Assert.Equal(1, report.Added);
        Assert.Equal(
            [
                "Second Fixture (2): its audio is not in the media cache; run hummi import",
                "Third Fixture (3): its cached audio does not match its SHA-256; run hummi import",
            ],
            report.Skipped);
        Assert.Equal(["First Fixture"], await db.Tracks.Select(t => t.Title).ToListAsync());
        Assert.Equal(["uploader_a"], await db.Artists.Select(a => a.Name).ToListAsync());
    }

    [Fact]
    public async Task L2_057_two_tracks_with_the_same_title_get_distinct_slugs()
    {
        await Seed(Manifest(Track(1, "Same Title", "uploader_a"), Track(2, "Same Title", "uploader_b")));

        Assert.Equal(["same-title", "same-title-2"], await db.Tracks.Select(t => t.Slug).OrderBy(s => s).ToListAsync());
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(3)]
    public async Task L2_057_AC5_the_demo_listeners_refer_only_to_seeded_tracks(int count)
    {
        await Seed(Manifest([.. Few().Tracks.Take(count)]));

        var nadia = await db.Listeners.SingleAsync(l => l.Email == DemoSeeder.DemoEmail);
        Assert.True(nadia.EmailConfirmed);
        Assert.True(new Hummi.Infrastructure.Accounts.IdentityPasswordHasher().Verify(nadia.PasswordHash, DemoSeeder.DemoPassword));
        var trackIds = await db.Tracks.Select(t => t.Id).ToListAsync();
        var artistIds = await db.Artists.Select(a => a.Id).ToListAsync();
        var likes = await db.TrackLikes.Where(l => l.ListenerId == nadia.Id).ToListAsync();
        var follows = await db.ArtistFollows.Where(f => f.ListenerId == nadia.Id).ToListAsync();
        var playlist = await db.Playlists.Include(p => p.Entries).SingleAsync(p => p.OwnerId == nadia.Id);
        var kitchen = await db.Playlists.Include(p => p.Entries).SingleAsync(p => p.Name == "Sunday kitchen");

        Assert.Equal(Math.Min(count, 3), likes.Count);
        Assert.All(likes, l => Assert.Contains(l.TrackId, trackIds));
        Assert.All(follows, f => Assert.Contains(f.ArtistId, artistIds));
        Assert.Equal(count == 0 ? 0 : count == 1 ? 1 : 2, follows.Count);
        Assert.Equal(DemoSeeder.DemoPlaylist, playlist.Name);
        Assert.Equal(likes.Select(l => l.TrackId).Order(), playlist.Entries.Select(e => e.TrackId).Order());
        Assert.True(kitchen.IsPublic);
        Assert.Equal(Math.Min(count, 4), kitchen.Entries.Count);
        Assert.All(kitchen.Entries, e => Assert.Contains(e.TrackId, trackIds));
        var notifications = await db.Notifications.Where(n => n.ListenerId == nadia.Id).ToListAsync();
        Assert.Equal(count == 0 ? 2 : 3, notifications.Count);
        Assert.Single(notifications, n => n.ReadAt != null);
    }

    [Fact]
    public async Task L2_058_AC2_a_few_tracks_fill_the_top_10_from_rank_1_and_nothing_is_featured()
    {
        await Seed(Few());

        var shelves = new GetHomeShelfQueryHandler(db, new FixedClock(Now));
        var top = (await shelves.Handle(new("top-10"), default)).Value!;
        var recent = (await shelves.Handle(new("recently-added"), default)).Value!;
        var featured = await new GetFeaturedAlbumQueryHandler(db).Handle(new(), default);

        Assert.Equal(["First Fixture", "Second Fixture", "Third Fixture"], top.Tracks.Select(t => t.Title));
        Assert.Equal(["First Fixture", "Second Fixture", "Third Fixture"], recent.Tracks.Select(t => t.Title));
        Assert.False(featured.IsSuccess);
    }

    [Fact]
    public async Task L2_057_AC6_seeding_twice_adds_nothing_the_second_time()
    {
        await Seed(Few());

        var report = await Seed(Few());

        Assert.Equal(0, report.Added);
        Assert.True(report.AlreadySeeded);
        Assert.Equal(3, await db.Tracks.CountAsync());
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
