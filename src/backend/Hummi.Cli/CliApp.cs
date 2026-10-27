using Hummi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Hummi.Cli;

/// <summary>Exit codes of the Hummi CLI.</summary>
public static class ExitCodes
{
    public const int Success = 0;
    public const int Refused = 1;
    public const int Usage = 2;
}

/// <summary>Developer tooling: <c>seed</c> writes the demo catalogue; <c>reset</c> is a stub until it is needed.</summary>
public static class CliApp
{
    public static int Run(string[] args, TextWriter output, IConfiguration configuration, string environment)
    {
        switch (args.FirstOrDefault())
        {
            case "reset":
                if (!string.Equals(environment, "Development", StringComparison.OrdinalIgnoreCase))
                {
                    output.WriteLine($"Refusing to reset in the {environment} environment; set DOTNET_ENVIRONMENT=Development.");
                    return ExitCodes.Refused;
                }

                if (string.IsNullOrWhiteSpace(configuration.GetConnectionString("Hummi")))
                {
                    output.WriteLine("Set ConnectionStrings__Hummi to reset the database.");
                    return ExitCodes.Usage;
                }

                output.WriteLine("Reset is not implemented yet.");
                return ExitCodes.Success;
            case "seed":
                return Seed(output, configuration);
            default:
                output.WriteLine("Usage: hummi <reset|seed>");
                return ExitCodes.Usage;
        }
    }

    /// <summary>Seeds a migrated database (run Hummi.Migrator first) and the media root.</summary>
    private static int Seed(TextWriter output, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Hummi");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            output.WriteLine("Set ConnectionStrings__Hummi to seed the database.");
            return ExitCodes.Usage;
        }

        var mediaRoot = configuration["MediaStorage:RootPath"] is { Length: > 0 } root ? root : Path.Combine(AppContext.BaseDirectory, "media");
        using var db = new HummiDbContext(new DbContextOptionsBuilder<HummiDbContext>().UseSqlServer(connectionString).Options);
        var added = DemoSeeder.SeedAsync(db, mediaRoot, TimeProvider.System).GetAwaiter().GetResult();
        output.WriteLine(added == 0 ? "The catalogue is already seeded." : $"Seeded {added} tracks; audio written to {mediaRoot}.");
        return ExitCodes.Success;
    }
}
