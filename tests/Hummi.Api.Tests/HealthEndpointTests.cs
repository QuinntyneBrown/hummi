using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Hummi.Api.Tests;

public sealed class HealthEndpointTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task Health_returns_200_without_any_dependency()
    {
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Health_body_contains_no_version_hostname_or_connection_string()
    {
        using var client = factory.CreateClient();

        var body = await client.GetStringAsync("/api/health");

        Assert.Equal("""{"status":"ok"}""", body);
        Assert.DoesNotContain(Environment.MachineName, body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("ConnectionString", body, StringComparison.OrdinalIgnoreCase);
    }
}
