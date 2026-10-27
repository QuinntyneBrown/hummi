using Hummi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Migrator;

/// <summary>Applies the EF Core migrations of Hummi.Infrastructure to the Hummi database.</summary>
public static class MigratorApp
{
    public const string ConnectionStringVariable = "ConnectionStrings__Hummi";

    /// <summary>
    /// Applies pending migrations when a connection string is given. Without one it lists the
    /// migrations in this build, connects to nothing and fails, so a misconfigured deploy stops.
    /// </summary>
    public static int Run(TextWriter output, string? connectionString)
    {
        var options = new DbContextOptionsBuilder<HummiDbContext>()
            .UseSqlServer(string.IsNullOrWhiteSpace(connectionString) ? "Server=unset" : connectionString)
            .Options;
        using var db = new HummiDbContext(options);
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            output.WriteLine($"Set {ConnectionStringVariable} to apply these migrations:");
            foreach (var migration in db.Database.GetMigrations())
            {
                output.WriteLine($"  {migration}");
            }

            return 2;
        }

        ApplyMigrations(db, output);
        return 0;
    }

    /// <summary>Applies every pending migration. Hummi.Cli reset calls it too, so there is one migration path.</summary>
    public static void ApplyMigrations(DbContext db, TextWriter output)
    {
        db.Database.Migrate();
        output.WriteLine("Migrations applied.");
    }
}
