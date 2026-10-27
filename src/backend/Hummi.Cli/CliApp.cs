using Microsoft.Extensions.Configuration;

namespace Hummi.Cli;

/// <summary>Exit codes of the Hummi CLI.</summary>
public static class ExitCodes
{
    public const int Success = 0;
    public const int Refused = 1;
    public const int Usage = 2;
}

/// <summary>Developer tooling: <c>reset</c> and <c>seed</c> are stubs to fill in once the model exists.</summary>
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
                output.WriteLine("Seed is not implemented yet.");
                return ExitCodes.Success;
            default:
                output.WriteLine("Usage: hummi <reset|seed>");
                return ExitCodes.Usage;
        }
    }
}
