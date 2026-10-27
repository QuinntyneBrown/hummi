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
        builder.HasOne(t => t.Artist).WithMany().HasForeignKey(t => t.ArtistId).OnDelete(DeleteBehavior.Restrict);
        builder.Ignore(t => t.IsPlayable);
        builder.Ignore(t => t.AudioPath);
        builder.HasIndex(t => t.AddedAt);
        builder.HasIndex(t => t.PlayCount);
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
