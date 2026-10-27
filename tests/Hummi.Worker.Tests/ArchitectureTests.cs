using NetArchTest.Rules;

namespace Hummi.Worker.Tests;

/// <summary>The Worker is a host like the Api: it reaches the domain through Application, never through another host.</summary>
public sealed class ArchitectureTests
{
    [Fact]
    public void Worker_does_not_depend_on_another_host()
    {
        var result = Types.InAssembly(typeof(Worker).Assembly)
            .ShouldNot().HaveDependencyOnAny("Hummi.Api", "Hummi.Migrator", "Hummi.Cli")
            .GetResult();

        Assert.True(result.IsSuccessful);
    }
}
