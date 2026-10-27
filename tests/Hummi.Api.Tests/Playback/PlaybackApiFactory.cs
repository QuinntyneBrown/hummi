using Hummi.Application.Abstractions;
using Hummi.Domain.Catalogue;
using Hummi.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Hummi.Api.Tests.Playback;

/// <summary>The API over an EF Core in-memory database and an in-memory media store; nothing external.</summary>
public sealed class PlaybackApiFactory : WebApplicationFactory<Program>
{
    private readonly string databaseName = Guid.NewGuid().ToString();

    public FakeMediaStore Media { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder) =>
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<HummiDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<HummiDbContext>>();
            services.AddDbContext<HummiDbContext>(options => options.UseInMemoryDatabase(databaseName));
            services.RemoveAll<IMediaStore>();
            services.AddSingleton<IMediaStore>(Media);
        });

    /// <summary>Adds one artist and its tracks, with an audio file for each.</summary>
    public async Task<Track[]> SeedAsync(string artistName, params string[] titles)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HummiDbContext>();
        var artist = Artist.Create(artistName);
        var tracks = titles
            .Select((title, i) => Track.Create(title, artist.Id, 222, null, DateTimeOffset.UnixEpoch.AddDays(i)))
            .ToArray();
        db.Artists.Add(artist);
        db.Tracks.AddRange(tracks);
        await db.SaveChangesAsync();
        foreach (var track in tracks)
        {
            Media.Files[track.AudioPath] = [0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 5, 6];
        }

        return tracks;
    }

    /// <summary>Creates the schema with its ten seeded genres and adds tracks to one of them, newest last.</summary>
    public async Task<Track[]> SeedGenreAsync(string slug, params string[] titles)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HummiDbContext>();
        await db.Database.EnsureCreatedAsync();
        var genre = await db.Genres.SingleAsync(g => g.Slug == slug);
        var artist = Artist.Create("Kaiso Collective");
        var tracks = titles
            .Select((title, i) => Track.Create(title, artist.Id, 222, null, DateTimeOffset.UnixEpoch.AddDays(i), genre.Id))
            .ToArray();
        db.Artists.Add(artist);
        db.Tracks.AddRange(tracks);
        await db.SaveChangesAsync();
        return tracks;
    }

    /// <summary>Adds an artist with one published 2026 album of CC0 tracks, 3:42 then 3:58 long.</summary>
    public async Task<Track[]> SeedAlbumAsync(string artistName, string albumTitle, params string[] titles)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HummiDbContext>();
        var artist = Artist.Create(artistName, "openmusic-3b", "A soca band.");
        var album = Album.Create(albumTitle, artist.Id, 2026);
        var tracks = titles
            .Select((title, i) => Track.Create(title, artist.Id, 222 + (16 * i), null, DateTimeOffset.UnixEpoch.AddDays(i), albumId: album.Id, albumPosition: i + 1))
            .ToArray();
        album.Publish(tracks);
        db.Artists.Add(artist);
        db.Albums.Add(album);
        db.Tracks.AddRange(tracks);
        await db.SaveChangesAsync();
        return tracks;
    }

    public async Task WithdrawAsync(Guid trackId)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HummiDbContext>();
        (await db.Tracks.SingleAsync(t => t.Id == trackId)).Withdraw();
        await db.SaveChangesAsync();
    }

    public async Task<int> PlayEventCountAsync()
    {
        using var scope = Services.CreateScope();
        return await scope.ServiceProvider.GetRequiredService<HummiDbContext>().PlayEvents.CountAsync();
    }
}

public sealed class FakeMediaStore : IMediaStore
{
    public Dictionary<string, byte[]> Files { get; } = [];

    public MediaFile? Open(string relativePath) =>
        Files.TryGetValue(relativePath, out var bytes) ? new MediaFile(new MemoryStream(bytes), "audio/wav") : null;
}
