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
