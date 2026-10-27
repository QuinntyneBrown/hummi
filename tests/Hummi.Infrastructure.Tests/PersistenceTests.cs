using Hummi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Infrastructure.Tests;

public sealed class PersistenceTests
{
    [Fact]
    public void The_model_builds_without_opening_a_connection()
    {
        using var db = new HummiDbContext(new DbContextOptionsBuilder<HummiDbContext>().UseSqlServer("Server=unset").Options);

        Assert.NotNull(db.Model);
    }
}

public sealed class MigrationTests
{
    [Fact]
    public void The_migrations_match_the_model()
    {
        using var db = new HummiDbContext(new DbContextOptionsBuilder<HummiDbContext>().UseSqlServer("Server=unset").Options);

        Assert.Contains(db.Database.GetMigrations(), m => m.EndsWith("_AddCatalogueAndPlays", StringComparison.Ordinal));
        Assert.Contains(db.Database.GetMigrations(), m => m.EndsWith("_AddGenres", StringComparison.Ordinal));
        Assert.Contains(db.Database.GetMigrations(), m => m.EndsWith("_AddCataloguePages", StringComparison.Ordinal));
        Assert.Contains(db.Database.GetMigrations(), m => m.EndsWith("_AddAccounts", StringComparison.Ordinal));
        Assert.False(db.Database.HasPendingModelChanges());
    }
}
