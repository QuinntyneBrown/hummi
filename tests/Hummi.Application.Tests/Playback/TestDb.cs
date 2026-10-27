using Hummi.Application.Abstractions;
using Hummi.Domain.Catalogue;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Tests.Playback;

/// <summary>EF Core in-memory stand-in for the persistence port; one fresh database per instance.</summary>
internal sealed class TestDb : DbContext, IHummiDbContext
{
    public TestDb()
        : base(new DbContextOptionsBuilder<TestDb>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options)
    {
    }

    public DbSet<Artist> Artists => Set<Artist>();

    public DbSet<Track> Tracks => Set<Track>();

    public DbSet<Genre> Genres => Set<Genre>();

    public DbSet<PlayEvent> PlayEvents => Set<PlayEvent>();

    public static readonly DateTimeOffset Now = new(2026, 10, 27, 9, 0, 0, TimeSpan.Zero);

    /// <summary>Adds an artist with tracks; each later track is added a day later.</summary>
    public Track[] AddTracks(string artistName, params (string Title, long Plays)[] tracks)
    {
        var artist = Artist.Create(artistName);
        Artists.Add(artist);
        var added = tracks.Select((t, i) =>
        {
            var track = Track.Create(t.Title, artist.Id, 200, $"https://covers.example/{i}.jpg", Now.AddDays(i));
            for (var p = 0; p < t.Plays; p++)
            {
                track.RegisterPlay(null, Now);
            }

            return track;
        }).ToArray();
        Tracks.AddRange(added);
        SaveChanges();
        return added;
    }
}
