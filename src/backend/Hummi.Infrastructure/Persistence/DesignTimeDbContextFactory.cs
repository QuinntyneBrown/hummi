using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Hummi.Infrastructure.Persistence;

/// <summary>Lets dotnet-ef build the model to add migrations. It never opens a connection.</summary>
internal sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<HummiDbContext>
{
    public HummiDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<HummiDbContext>().UseSqlServer("Server=design-time;Database=Hummi").Options);
}
