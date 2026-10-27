using Hummi.Application.Abstractions;
using Hummi.Domain.Accounts;
using Hummi.Domain.Catalogue;
using Hummi.Domain.Library;
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

    public DbSet<Album> Albums => Set<Album>();

    public DbSet<Genre> Genres => Set<Genre>();

    public DbSet<PlayEvent> PlayEvents => Set<PlayEvent>();

    public DbSet<Listener> Listeners => Set<Listener>();

    public DbSet<EmailToken> EmailTokens => Set<EmailToken>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<TrackLike> TrackLikes => Set<TrackLike>();

    public DbSet<ArtistFollow> ArtistFollows => Set<ArtistFollow>();

    public DbSet<Playlist> Playlists => Set<Playlist>();

    public DbSet<PlaylistEntry> PlaylistEntries => Set<PlaylistEntry>();

    public DbSet<ShareLink> ShareLinks => Set<ShareLink>();

    public DbSet<SavedPlaylist> SavedPlaylists => Set<SavedPlaylist>();

    public DbSet<Notification> Notifications => Set<Notification>();

    public DbSet<TrackReport> TrackReports => Set<TrackReport>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TrackLike>().HasKey(l => new { l.ListenerId, l.TrackId });
        modelBuilder.Entity<ArtistFollow>().HasKey(f => new { f.ListenerId, f.ArtistId });
        modelBuilder.Entity<Playlist>().Property(p => p.Id).ValueGeneratedNever();
        modelBuilder.Entity<Playlist>().HasMany(p => p.Entries).WithOne().HasForeignKey(e => e.PlaylistId);
        modelBuilder.Entity<PlaylistEntry>().Property(e => e.Id).ValueGeneratedNever();
        modelBuilder.Entity<ShareLink>().Property(l => l.Id).ValueGeneratedNever();
        modelBuilder.Entity<SavedPlaylist>().HasKey(s => new { s.ListenerId, s.PlaylistId });
        modelBuilder.Entity<Notification>().Property(n => n.Id).ValueGeneratedNever();
        modelBuilder.Entity<TrackReport>().Property(r => r.Id).ValueGeneratedNever();
    }

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
