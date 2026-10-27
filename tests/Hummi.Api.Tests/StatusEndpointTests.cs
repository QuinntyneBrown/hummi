using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Hummi.Api.Tests.Accounts;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Hummi.Api.Tests;

public sealed class StatusEndpointTests
{
    [Fact]
    public async Task L2_042_AC2_the_status_carries_the_maintenance_window_when_one_is_set()
    {
        using var quiet = new AuthApiFactory();
        using var scheduled = new AuthApiFactory().WithWebHostBuilder(b => b.UseSetting("Status:Maintenance", "Sunday 1 Nov, 02:00 to 02:30 UTC"));

        var none = await quiet.CreateHttpsClient().GetFromJsonAsync<JsonElement>("/api/status");
        var window = await scheduled.CreateClient(new() { BaseAddress = new Uri("https://localhost") }).GetFromJsonAsync<JsonElement>("/api/status");

        Assert.Equal(JsonValueKind.Null, none.GetProperty("maintenance").ValueKind);
        Assert.Equal("Sunday 1 Nov, 02:00 to 02:30 UTC", window.GetProperty("maintenance").GetString());
    }

    [Fact]
    public async Task L2_046_AC2_a_page_that_failed_to_render_is_logged_for_the_team()
    {
        var logs = new CapturingLoggerProvider();
        using var factory = new AuthApiFactory().WithWebHostBuilder(b => b.ConfigureServices(s => s.AddSingleton<ILoggerProvider>(logs)));
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });

        using var response = await client.PostAsJsonAsync("/api/client-errors", new { message = "TypeError: t.artist is undefined", path = "/tracks/feathers-up" });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Contains(logs.Entries, e => e.Level == LogLevel.Error && e.Message.Contains("/tracks/feathers-up", StringComparison.Ordinal) && e.Message.Contains("TypeError", StringComparison.Ordinal));
    }

    private sealed class CapturingLoggerProvider : ILoggerProvider
    {
        public ConcurrentBag<(LogLevel Level, string Message)> Entries { get; } = [];

        public ILogger CreateLogger(string categoryName) => new Logger(this);

        public void Dispose()
        {
        }

        private sealed class Logger(CapturingLoggerProvider provider) : ILogger
        {
            public IDisposable? BeginScope<TState>(TState state)
                where TState : notnull => null;

            public bool IsEnabled(LogLevel logLevel) => true;

            public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) =>
                provider.Entries.Add((logLevel, formatter(state, exception)));
        }
    }
}
