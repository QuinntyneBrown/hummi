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

internal sealed class PlaylistConfiguration : IEntityTypeConfiguration<Playlist>
{
    public void Configure(EntityTypeBuilder<Playlist> builder)
    {
        builder.ToTable("Playlists");
        builder.Property(p => p.Id).ValueGeneratedNever();
        builder.Property(p => p.Name).HasMaxLength(PlaylistName.MaxLength).IsRequired();
        builder.HasIndex(p => p.OwnerId);
        builder.HasOne<Listener>().WithMany().HasForeignKey(p => p.OwnerId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(p => p.Entries).WithOne().HasForeignKey(e => e.PlaylistId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(p => p.Entries).HasField("entries").UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

internal sealed class PlaylistEntryConfiguration : IEntityTypeConfiguration<PlaylistEntry>
{
    public void Configure(EntityTypeBuilder<PlaylistEntry> builder)
    {
        builder.ToTable("PlaylistEntries");
        builder.Property(e => e.Id).ValueGeneratedNever();
        builder.HasIndex(e => new { e.PlaylistId, e.Position });
        builder.HasOne<Track>().WithMany().HasForeignKey(e => e.TrackId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ShareLinkConfiguration : IEntityTypeConfiguration<ShareLink>
{
    public void Configure(EntityTypeBuilder<ShareLink> builder)
    {
        builder.ToTable("ShareLinks");
        builder.Property(l => l.Id).ValueGeneratedNever();
        builder.Property(l => l.Code).HasMaxLength(ShareLink.CodeLength).IsRequired();
        builder.HasIndex(l => l.Code).IsUnique();
        builder.HasIndex(l => new { l.TargetType, l.TargetId }).IsUnique();
    }
}

internal sealed class SavedPlaylistConfiguration : IEntityTypeConfiguration<SavedPlaylist>
{
    public void Configure(EntityTypeBuilder<SavedPlaylist> builder)
    {
        builder.ToTable("SavedPlaylists");
        builder.HasKey(s => new { s.ListenerId, s.PlaylistId });
        builder.HasOne<Listener>().WithMany().HasForeignKey(s => s.ListenerId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Playlist>().WithMany().HasForeignKey(s => s.PlaylistId).OnDelete(DeleteBehavior.NoAction);
    }
}
