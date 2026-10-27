using Microsoft.Extensions.Configuration;

namespace Hummi.Cli.Tests;

public sealed class CliAppTests
{
    private static readonly IConfiguration Empty = new ConfigurationBuilder().Build();

    [Fact]
    public void Reset_is_refused_outside_Development()
    {
        var exitCode = CliApp.Run(["reset"], new StringWriter(), Empty, "Production");

        Assert.Equal(ExitCodes.Refused, exitCode);
    }

    [Fact]
    public void An_unknown_command_prints_usage()
    {
        var output = new StringWriter();

        var exitCode = CliApp.Run([], output, Empty, "Development");

        Assert.Equal(ExitCodes.Usage, exitCode);
        Assert.Contains("Usage", output.ToString());
    }
}
