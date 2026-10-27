using Hummi.Domain.Accounts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hummi.Infrastructure.Persistence;

internal sealed class ListenerConfiguration : IEntityTypeConfiguration<Listener>
{
    public void Configure(EntityTypeBuilder<Listener> builder)
    {
        builder.ToTable("Listeners");
        builder.Property(l => l.Id).ValueGeneratedNever();
        builder.Property(l => l.DisplayName).HasMaxLength(100).IsRequired();
        builder.Property(l => l.Email).HasMaxLength(320).IsRequired();
        builder.Property(l => l.PasswordHash).HasMaxLength(200).IsRequired();
        builder.Ignore(l => l.EmailConfirmed);
        builder.HasIndex(l => l.Email).IsUnique();
    }
}

internal sealed class EmailTokenConfiguration : IEntityTypeConfiguration<EmailToken>
{
    public void Configure(EntityTypeBuilder<EmailToken> builder)
    {
        builder.ToTable("EmailTokens");
        builder.Property(t => t.Id).ValueGeneratedNever();
        builder.Property(t => t.TokenHash).HasMaxLength(64).IsRequired();
        builder.HasIndex(t => t.TokenHash).IsUnique();
        builder.HasIndex(t => t.ListenerId);
        builder.HasOne<Listener>().WithMany().HasForeignKey(t => t.ListenerId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");
        builder.Property(t => t.Id).ValueGeneratedNever();
        builder.Property(t => t.TokenHash).HasMaxLength(64).IsRequired();
        builder.HasIndex(t => t.TokenHash).IsUnique();
        builder.HasIndex(t => t.ListenerId);
        builder.HasOne<Listener>().WithMany().HasForeignKey(t => t.ListenerId).OnDelete(DeleteBehavior.Cascade);
    }
}
