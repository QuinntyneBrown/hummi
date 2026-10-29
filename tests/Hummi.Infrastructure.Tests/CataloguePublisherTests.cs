using System.Security.Cryptography;
using Hummi.Infrastructure.Catalogue;
using Hummi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Infrastructure.Tests;

// Acceptance tests: L2-087. Database and CDN are fakes; no external systems.
public sealed class CataloguePublisherTests : IDisposable
{
    private readonly string root = Directory.CreateTempSubdirectory("hummi-publish-").FullName;
    private readonly HummiDbContext db = new(new DbContextOptionsBuilder<HummiDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private static readonly byte[] Audio = [1, 2, 3];
    private static readonly PublicationTrack Entry = new("https://pixabay.com/music/test-1/", "Fixture", "Fixture artist", 30, null, "Reggae", [], "https://cdn.pixabay.com/audio/test.mp3", Convert.ToHexStringLower(SHA256.HashData(Audio)), Audio.Length);

    [Fact]
    public async Task Publishes_once_and_restores_missing_audio_without_changing_ids()
    {
        var calls = 0;
        var publisher = new CataloguePublisher(db, root, _ => { calls++; return Task.FromResult(Audio); });
        await publisher.PublishAsync([Entry]);
        var track = Assert.Single(await db.Tracks.ToListAsync());
        Assert.Equal(Audio, await File.ReadAllBytesAsync(Path.Combine(root, track.AudioPath)));
        track.RegisterPlay(null, DateTimeOffset.UtcNow);
        track.Withdraw();
        await db.SaveChangesAsync();
        await publisher.PublishAsync([Entry]);
        Assert.True(track.Withdrawn);
        Assert.Equal(1, track.PlayCount);
        Assert.Equal(1, calls);
        File.Delete(Path.Combine(root, track.AudioPath));
        await publisher.PublishAsync([Entry]);
        Assert.Equal(2, calls);
        Assert.Equal(track.Id, Assert.Single(await db.Tracks.ToListAsync()).Id);
        await File.WriteAllBytesAsync(Path.Combine(root, track.AudioPath), [9]);
        await publisher.PublishAsync([Entry]);
        Assert.Equal(3, calls);
        Assert.Equal(Audio, await File.ReadAllBytesAsync(Path.Combine(root, track.AudioPath)));
        await publisher.PublishAsync([Entry, Entry with { SourceUrl = "https://pixabay.com/music/test-2/" }]);
        Assert.Equal(2, await db.Tracks.CountAsync());
        Assert.Single(await db.Artists.ToListAsync());
        Assert.Empty(await db.Listeners.ToListAsync());
    }

    [Fact]
    public async Task Rejects_corrupt_download_without_publishing_a_row()
    {
        var publisher = new CataloguePublisher(db, root, _ => Task.FromResult<byte[]>([9]));
        await Assert.ThrowsAsync<InvalidDataException>(() => publisher.PublishAsync([Entry]));
        Assert.Empty(await db.Tracks.ToListAsync());
    }

    public void Dispose()
    {
        db.Dispose();
        Directory.Delete(root, true);
    }
}
