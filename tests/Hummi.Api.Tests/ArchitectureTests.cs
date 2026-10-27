using Hummi.Application;
using Hummi.Domain;
using Hummi.Infrastructure;
using NetArchTest.Rules;

namespace Hummi.Api.Tests;

/// <summary>Layer dependencies point inward: Api and Infrastructure to Application to Domain.</summary>
public sealed class ArchitectureTests
{
    [Fact]
    public void Domain_depends_on_no_other_Hummi_layer()
    {
        var result = Types.InAssembly(typeof(DomainAssembly).Assembly)
            .ShouldNot().HaveDependencyOnAny("Hummi.Application", "Hummi.Infrastructure", "Hummi.Api")
            .GetResult();

        Assert.True(result.IsSuccessful);
    }

    [Fact]
    public void Application_does_not_depend_on_Infrastructure_or_Api()
    {
        var result = Types.InAssembly(typeof(ApplicationAssembly).Assembly)
            .ShouldNot().HaveDependencyOnAny("Hummi.Infrastructure", "Hummi.Api")
            .GetResult();

        Assert.True(result.IsSuccessful);
    }

    [Fact]
    public void Infrastructure_does_not_depend_on_Api()
    {
        var result = Types.InAssembly(typeof(InfrastructureAssembly).Assembly)
            .ShouldNot().HaveDependencyOnAny("Hummi.Api")
            .GetResult();

        Assert.True(result.IsSuccessful);
    }
}
