using Hummi.Cli.Pixabay;
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

/// <summary>
/// Developer tooling: <c>import</c> reads the Pixabay track pages of the manifest into it and the media cache;
/// <c>seed</c> writes the manifest's tracks and the demo listeners into a database (ADR 0021); <c>reset</c> is a
/// stub until it is needed. <c>--manifest {path}</c> or <c>Catalogue:ManifestPath</c> picks the manifest;
/// <c>--pages {folder}</c> makes <c>import</c> read Pixabay pages saved from a browser (<see cref="SavedPagesPixabayWeb"/>).
/// </summary>
public static class CliApp
{
    public static int Run(string[] args, TextWriter output, IConfiguration configuration, string environment, IPixabayWeb? web = null)
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
            case "import":
                return Import(args, output, configuration, web);
            case "seed":
                return Seed(args, output, configuration);
            default:
                output.WriteLine("Usage: hummi <import|seed|reset> [--manifest <path>] [--pages <folder>]");
                return ExitCodes.Usage;
        }
    }

    /// <summary>Imports the manifest's sources and writes the manifest back (L2-056).</summary>
    private static int Import(string[] args, TextWriter output, IConfiguration configuration, IPixabayWeb? web)
    {
        var path = ManifestPath(args, configuration);
        var manifest = PixabayManifest.Load(path);
        using var http = web is null ? HttpPixabayWeb.CreateClient() : null;
        IPixabayWeb source = web ?? new HttpPixabayWeb(http!);
        var pages = Option(args, "--pages");
        if (pages is not null)
        {
            source = new SavedPagesPixabayWeb(Path.GetFullPath(pages), source);
        }

        var importer = new PixabayImporter(source, MediaRoot(configuration), TimeProvider.System);
        var report = importer.ImportAsync(manifest).GetAwaiter().GetResult();
        manifest.Save(path);
        foreach (var reason in report.Refused)
        {
            output.WriteLine($"Refused {reason}");
        }

        if (report.Refused.Any(r => r.EndsWith("page could not be fetched", StringComparison.Ordinal) || r.EndsWith("licence page could not be read", StringComparison.Ordinal)))
        {
            output.WriteLine(pages is null
                ? "pixabay.com answers plain requests with a bot check. Save each page from your browser as {id}.html (the licence summary as license-summary.html) into a folder and run import again with --pages <folder>."
                : $"Save the missing pages into {Path.GetFullPath(pages)} as {{id}}.html (the licence summary as license-summary.html) and run import again.");
        }

        var tracks = report.Imported == 1 ? "track" : "tracks";
        output.WriteLine($"Imported {report.Imported} {tracks}, {report.Present} already present, {report.Restored} restored, {report.Refused.Count} refused. The manifest at {path} holds {manifest.Tracks.Count}.");
        return report.Refused.Count == 0 ? ExitCodes.Success : ExitCodes.Refused;
    }

    private static string ManifestPath(string[] args, IConfiguration configuration) =>
        Option(args, "--manifest") is { } manifest
            ? Path.GetFullPath(manifest)
            : configuration["Catalogue:ManifestPath"] is { Length: > 0 } configured ? configured : PixabayManifest.DefaultPath;

    private static string? Option(string[] args, string name)
    {
        var flag = Array.IndexOf(args, name);
        return flag >= 0 && flag + 1 < args.Length ? args[flag + 1] : null;
    }

    private static string MediaRoot(IConfiguration configuration) =>
        configuration["MediaStorage:RootPath"] is { Length: > 0 } root ? root : Path.Combine(AppContext.BaseDirectory, "media");

    /// <summary>Seeds a migrated database (run Hummi.Migrator first) and the media root from the manifest (L2-057).</summary>
    private static int Seed(string[] args, TextWriter output, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Hummi");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            output.WriteLine("Set ConnectionStrings__Hummi to seed the database.");
            return ExitCodes.Usage;
        }

        var mediaRoot = MediaRoot(configuration);
        var manifest = PixabayManifest.Load(ManifestPath(args, configuration));
        using var db = new HummiDbContext(new DbContextOptionsBuilder<HummiDbContext>().UseSqlServer(connectionString).Options);
        var report = DemoSeeder.SeedAsync(db, manifest, mediaRoot, TimeProvider.System).GetAwaiter().GetResult();
        if (report.AlreadySeeded)
        {
            output.WriteLine("The catalogue is already seeded.");
            return ExitCodes.Success;
        }

        foreach (var reason in report.Skipped)
        {
            output.WriteLine($"Skipped {reason}");
        }

        var tracks = report.Added == 1 ? "track" : "tracks";
        output.WriteLine($"Seeded {report.Added} Pixabay {tracks}; audio written to {mediaRoot}. Sign in as {DemoSeeder.DemoEmail} with {DemoSeeder.DemoPassword}.");
        return ExitCodes.Success;
    }
}
