using System.Net;
using System.Text.Json;
using Hummi.Api.Tests.Playback;
using Hummi.Application.Abstractions;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Hummi.Api.Tests.Search;

public sealed class SearchEndpointTests : IDisposable
{
    private readonly PlaybackApiFactory factory = new();

    public void Dispose() => factory.Dispose();

    [Fact]
    public async Task L2_006_search_returns_the_top_result_artists_and_songs()
    {
        await factory.SeedAsync("Laventille Steel Orchestra", "Panyard Nights", "Feathers Up");
        using var client = factory.CreateClient();

        using var body = JsonDocument.Parse(await client.GetStringAsync("/api/search?q=pan"));

        var root = body.RootElement;
        Assert.Equal("pan", root.GetProperty("query").GetString());
        Assert.Equal("Panyard Nights", root.GetProperty("topResult").GetProperty("title").GetString());
        Assert.Equal("panyard-nights", root.GetProperty("topResult").GetProperty("slug").GetString());
        Assert.Equal(1, root.GetProperty("songs").GetArrayLength());
        Assert.Equal(0, root.GetProperty("artists").GetArrayLength());
    }

    [Fact]
    public async Task L2_007_no_matches_return_200_with_empty_lists()
    {
        await factory.SeedAsync("Kaiso Collective", "Feathers Up");
        using var client = factory.CreateClient();

        using var body = JsonDocument.Parse(await client.GetStringAsync("/api/search?q=rainfall%20in%20b-flat"));

        Assert.Equal(JsonValueKind.Null, body.RootElement.GetProperty("topResult").ValueKind);
        Assert.Equal(0, body.RootElement.GetProperty("songs").GetArrayLength());
    }

    [Fact]
    public async Task An_empty_query_is_422_problem_details()
    {
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/search?q=%20");

        Assert.Equal((HttpStatusCode)422, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task L2_007_an_unreachable_index_is_503_search_unavailable()
    {
        using var client = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<ISearchIndex>();
            services.AddScoped<ISearchIndex, UnreachableSearchIndex>();
        })).CreateClient();

        using var response = await client.GetAsync("/api/search?q=pan");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        using var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("SEARCH_UNAVAILABLE", problem.RootElement.GetProperty("code").GetString());
    }

    private sealed class UnreachableSearchIndex : ISearchIndex
    {
        public Task<SearchHits> SearchAsync(string text, int artistTake, int trackTake, CancellationToken cancellationToken) =>
            throw new SearchUnavailableException(new TimeoutException("index down"));
    }
}
