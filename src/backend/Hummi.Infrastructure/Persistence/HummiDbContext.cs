using Hummi.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Infrastructure.Persistence;

/// <summary>EF Core context over the Hummi database (SQL Server). LINQ only, so all SQL is parameterised.</summary>
public sealed class HummiDbContext(DbContextOptions<HummiDbContext> options) : DbContext(options), IHummiDbContext
{
    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(HummiDbContext).Assembly);
}
