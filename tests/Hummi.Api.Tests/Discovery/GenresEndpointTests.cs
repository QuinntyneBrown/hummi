using System.Net;
using System.Text.Json;
using Hummi.Api.Tests.Playback;

namespace Hummi.Api.Tests.Discovery;

public sealed class GenresEndpointTests : IDisposable
{
    private readonly PlaybackApiFactory factory = new();

    public void Dispose() => factory.Dispose();

    [Fact]
    public async Task L2_003_browse_returns_ten_genres_moods_and_the_openly_licensed_count()
    {
        await factory.SeedGenreAsync("soca", "Feathers Up", "Wine Slow");
        using var client = factory.CreateClient();

        using var body = JsonDocument.Parse(await client.GetStringAsync("/api/genres"));

        var root = body.RootElement;
        Assert.Equal(10, root.GetProperty("genreCount").GetInt32());
        Assert.Equal(2, root.GetProperty("openlyLicensedTrackCount").GetInt32());
        var soca = root.GetProperty("genres")[0];
        Assert.Equal("soca", soca.GetProperty("slug").GetString());
        Assert.Equal("Soca", soca.GetProperty("name").GetString());
        Assert.Equal(1, soca.GetProperty("tone").GetInt32());
        Assert.Equal(2, soca.GetProperty("trackCount").GetInt32());
        Assert.Equal(7, root.GetProperty("moods").GetArrayLength());
    }

    [Fact]
    public async Task L2_004_genre_tracks_are_sorted_by_the_sort_parameter()
    {
        var tracks = await factory.SeedGenreAsync("soca", "Feathers Up", "Wine Slow");
        using var client = factory.CreateClient();

        using var newest = JsonDocument.Parse(await client.GetStringAsync("/api/genres/soca/tracks"));
        using var mostPlayed = JsonDocument.Parse(await client.GetStringAsync("/api/genres/soca/tracks?sort=most-played&page=1"));

        Assert.Equal("Soca", newest.RootElement.GetProperty("name").GetString());
        Assert.Equal(2, newest.RootElement.GetProperty("trackCount").GetInt32());
        Assert.Equal(tracks[1].Id.ToString(), newest.RootElement.GetProperty("tracks")[0].GetProperty("id").GetString());
        Assert.Equal("most-played", mostPlayed.RootElement.GetProperty("sort").GetString());
    }

    [Fact]
    public async Task An_unknown_genre_is_404_and_a_bad_sort_is_422_problem_details()
    {
        await factory.SeedGenreAsync("soca");
        using var client = factory.CreateClient();

        using var unknown = await client.GetAsync("/api/genres/polka/tracks");
        using var badSort = await client.GetAsync("/api/genres/soca/tracks?sort=loudest");

        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);
        Assert.Equal("application/problem+json", unknown.Content.Headers.ContentType?.MediaType);
        using var problem = JsonDocument.Parse(await unknown.Content.ReadAsStringAsync());
        Assert.Equal("GENRE_NOT_FOUND", problem.RootElement.GetProperty("code").GetString());
        Assert.Equal((HttpStatusCode)422, badSort.StatusCode);
    }
}
