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
