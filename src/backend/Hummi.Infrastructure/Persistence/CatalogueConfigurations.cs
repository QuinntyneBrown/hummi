using Hummi.Domain.Catalogue;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hummi.Infrastructure.Persistence;

internal sealed class ArtistConfiguration : IEntityTypeConfiguration<Artist>
{
    public void Configure(EntityTypeBuilder<Artist> builder)
    {
        builder.ToTable("Artists");
        builder.Property(a => a.Id).ValueGeneratedNever();
        builder.Property(a => a.Name).HasMaxLength(200).IsRequired();
        builder.Property(a => a.Slug).HasMaxLength(200).IsRequired();
        builder.Property(a => a.ModelName).HasMaxLength(100);
        builder.Property(a => a.Description).HasMaxLength(2000).IsRequired();
        builder.HasIndex(a => a.Slug).IsUnique();
    }
}

internal sealed class TrackConfiguration : IEntityTypeConfiguration<Track>
{
    public void Configure(EntityTypeBuilder<Track> builder)
    {
        builder.ToTable("Tracks");
        builder.Property(t => t.Id).ValueGeneratedNever();
        builder.Property(t => t.Title).HasMaxLength(300).IsRequired();
        builder.Property(t => t.CoverUrl).HasMaxLength(2048);
        builder.Property(t => t.SourceUrl).HasMaxLength(2048);
        builder.Property(t => t.AudioExtension).HasMaxLength(8).IsRequired().HasDefaultValue(".wav");
        builder.Property(t => t.Slug).HasMaxLength(300).IsRequired();
        builder.Property(t => t.Waveform).HasMaxLength(256).IsRequired();
        builder.HasIndex(t => t.Slug).IsUnique();
        builder.HasOne<Album>().WithMany().HasForeignKey(t => t.AlbumId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(t => new { t.AlbumId, t.AlbumPosition });
        builder.HasIndex(t => new { t.ArtistId, t.PlayCount });
        builder.HasOne(t => t.Artist).WithMany().HasForeignKey(t => t.ArtistId).OnDelete(DeleteBehavior.Restrict);
        builder.Ignore(t => t.IsPlayable);
        builder.Ignore(t => t.AudioPath);
        builder.HasOne(t => t.Genre).WithMany().HasForeignKey(t => t.GenreId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(t => t.AddedAt);
        builder.HasIndex(t => t.PlayCount);
        builder.HasIndex(t => new { t.GenreId, t.AddedAt });
        builder.HasIndex(t => new { t.GenreId, t.PlayCount });
    }
}

internal sealed class AlbumConfiguration : IEntityTypeConfiguration<Album>
{
    public void Configure(EntityTypeBuilder<Album> builder)
    {
        builder.ToTable("Albums");
        builder.Property(a => a.Id).ValueGeneratedNever();
        builder.Property(a => a.Slug).HasMaxLength(300).IsRequired();
        builder.Property(a => a.Title).HasMaxLength(300).IsRequired();
        builder.HasOne<Artist>().WithMany().HasForeignKey(a => a.ArtistId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(a => a.Slug).IsUnique();
        builder.HasIndex(a => a.ArtistId);
    }
}

/// <summary>The ten fixed genres are seeded with the schema, so every install has them.</summary>
internal sealed class GenreConfiguration : IEntityTypeConfiguration<Genre>
{
    public void Configure(EntityTypeBuilder<Genre> builder)
    {
        builder.ToTable("Genres");
        builder.Property(g => g.Id).ValueGeneratedNever();
        builder.Property(g => g.Slug).HasMaxLength(64).IsRequired();
        builder.Property(g => g.Name).HasMaxLength(100).IsRequired();
        builder.Property(g => g.Description).HasMaxLength(300).IsRequired();
        builder.HasIndex(g => g.Slug).IsUnique();
        builder.HasData(Genre.All());
    }
}

internal sealed class PlayEventConfiguration : IEntityTypeConfiguration<PlayEvent>
{
    public void Configure(EntityTypeBuilder<PlayEvent> builder)
    {
        builder.ToTable("PlayEvents");
        builder.Property(p => p.Id).ValueGeneratedNever();
        builder.HasOne<Track>().WithMany().HasForeignKey(p => p.TrackId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(p => new { p.ListenerId, p.PlayedAt });
    }
}

internal sealed class TrackReportConfiguration : IEntityTypeConfiguration<TrackReport>
{
    public void Configure(EntityTypeBuilder<TrackReport> builder)
    {
        builder.ToTable("TrackReports");
        builder.Property(r => r.Id).ValueGeneratedNever();
        builder.Property(r => r.Details).HasMaxLength(TrackReport.MaxDetails);
        builder.Property(r => r.Outcome).HasMaxLength(2000);
        builder.HasIndex(r => new { r.Status, r.CreatedAt });
        builder.HasOne<Track>().WithMany().HasForeignKey(r => r.TrackId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Hummi.Domain.Accounts.Listener>().WithMany().HasForeignKey(r => r.ReporterId).OnDelete(DeleteBehavior.NoAction);
    }
}
