using Hummi.Migrator;

namespace Hummi.Migrator.Tests;

public sealed class MigratorAppTests
{
    [Fact]
    public void Without_a_connection_string_it_fails_and_connects_to_nothing()
    {
        var output = new StringWriter();

        var exitCode = MigratorApp.Run(output, null);

        Assert.Equal(2, exitCode);
        Assert.Contains(MigratorApp.ConnectionStringVariable, output.ToString());
    }
}
