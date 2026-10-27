using Hummi.Application.Abstractions;
using Hummi.Domain.Accounts;
using Hummi.Domain.Catalogue;
using Hummi.Domain.Library;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Infrastructure.Persistence;

/// <summary>EF Core context over the Hummi database (SQL Server). LINQ only, so all SQL is parameterised.</summary>
public sealed class HummiDbContext(DbContextOptions<HummiDbContext> options) : DbContext(options), IHummiDbContext
{
    public DbSet<Artist> Artists => Set<Artist>();

    public DbSet<Track> Tracks => Set<Track>();

    public DbSet<Genre> Genres => Set<Genre>();

    public DbSet<Album> Albums => Set<Album>();

    public DbSet<PlayEvent> PlayEvents => Set<PlayEvent>();

    public DbSet<Listener> Listeners => Set<Listener>();

    public DbSet<EmailToken> EmailTokens => Set<EmailToken>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<TrackLike> TrackLikes => Set<TrackLike>();

    public DbSet<ArtistFollow> ArtistFollows => Set<ArtistFollow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(HummiDbContext).Assembly);
}
