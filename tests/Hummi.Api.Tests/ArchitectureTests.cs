using Hummi.Application;
using Hummi.Domain;
using Hummi.Infrastructure;
using NetArchTest.Rules;

namespace Hummi.Api.Tests;

/// <summary>Layer dependencies point inward: Api, Worker and Infrastructure to Application to Domain.</summary>
public sealed class ArchitectureTests
{
    private static readonly string[] Hosts = ["Hummi.Api", "Hummi.Worker", "Hummi.Migrator", "Hummi.Cli"];

    [Fact]
    public void Domain_depends_on_no_other_Hummi_layer()
    {
        var result = Types.InAssembly(typeof(DomainAssembly).Assembly)
            .ShouldNot().HaveDependencyOnAny(["Hummi.Application", "Hummi.Infrastructure", .. Hosts])
            .GetResult();

        Assert.True(result.IsSuccessful);
    }

    [Fact]
    public void Application_does_not_depend_on_Infrastructure_or_any_host()
    {
        var result = Types.InAssembly(typeof(ApplicationAssembly).Assembly)
            .ShouldNot().HaveDependencyOnAny(["Hummi.Infrastructure", .. Hosts])
            .GetResult();

        Assert.True(result.IsSuccessful);
    }

    [Fact]
    public void Infrastructure_does_not_depend_on_any_host()
    {
        var result = Types.InAssembly(typeof(InfrastructureAssembly).Assembly)
            .ShouldNot().HaveDependencyOnAny(Hosts)
            .GetResult();

        Assert.True(result.IsSuccessful);
    }

    [Fact]
    public void Api_does_not_depend_on_another_host()
    {
        var result = Types.InAssembly(typeof(Program).Assembly)
            .ShouldNot().HaveDependencyOnAny("Hummi.Worker", "Hummi.Migrator", "Hummi.Cli")
            .GetResult();

        Assert.True(result.IsSuccessful);
    }
}
