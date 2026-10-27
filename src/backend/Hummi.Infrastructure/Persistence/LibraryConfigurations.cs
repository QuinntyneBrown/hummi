using Hummi.Domain.Accounts;
using Hummi.Domain.Catalogue;
using Hummi.Domain.Library;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hummi.Infrastructure.Persistence;

internal sealed class TrackLikeConfiguration : IEntityTypeConfiguration<TrackLike>
{
    public void Configure(EntityTypeBuilder<TrackLike> builder)
    {
        builder.ToTable("TrackLikes");
        builder.HasKey(l => new { l.ListenerId, l.TrackId });
        builder.HasOne<Listener>().WithMany().HasForeignKey(l => l.ListenerId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Track>().WithMany().HasForeignKey(l => l.TrackId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ArtistFollowConfiguration : IEntityTypeConfiguration<ArtistFollow>
{
    public void Configure(EntityTypeBuilder<ArtistFollow> builder)
    {
        builder.ToTable("ArtistFollows");
        builder.HasKey(f => new { f.ListenerId, f.ArtistId });
        builder.HasOne<Listener>().WithMany().HasForeignKey(f => f.ListenerId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Artist>().WithMany().HasForeignKey(f => f.ArtistId).OnDelete(DeleteBehavior.Cascade);
    }
}
