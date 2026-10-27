using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace Hummi.Api.Tests.Playback;

public sealed class PlaybackEndpointTests : IDisposable
{
    private readonly PlaybackApiFactory factory = new();

    public void Dispose() => factory.Dispose();

    [Fact]
    public async Task Home_returns_the_recently_added_shelf_and_the_top_ten()
    {
        var tracks = await factory.SeedAsync("Kaiso Collective", "Feathers Up", "Road March Riddim");
        using var client = factory.CreateClient();

        using var home = JsonDocument.Parse(await client.GetStringAsync("/api/home"));

        var recent = home.RootElement.GetProperty("recentlyAdded");
        Assert.Equal(2, recent.GetArrayLength());
        var first = recent[0];
        Assert.Equal(tracks[1].Id.ToString(), first.GetProperty("id").GetString());
        Assert.Equal("Road March Riddim", first.GetProperty("title").GetString());
        Assert.Equal("Kaiso Collective", first.GetProperty("artistName").GetString());
        Assert.Equal(222, first.GetProperty("durationSeconds").GetInt32());
        Assert.False(first.GetProperty("liked").GetBoolean());
        Assert.Equal(2, home.RootElement.GetProperty("topTen").GetArrayLength());
    }

    [Fact]
    public async Task L2_014_an_anonymous_play_is_recorded()
    {
        var track = (await factory.SeedAsync("Shanique", "Red Light Riddim"))[0];
        using var client = factory.CreateClient();

        using var response = await client.PostAsJsonAsync("/api/plays", new { trackId = track.Id });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(1, await factory.PlayEventCountAsync());
    }

    [Fact]
    public async Task A_play_of_an_unknown_track_is_404_problem_details()
    {
        using var client = factory.CreateClient();

        using var response = await client.PostAsJsonAsync("/api/plays", new { trackId = Guid.NewGuid() });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.Contains("TRACK_NOT_FOUND", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task L2_014_a_visitor_streams_a_track_without_signing_in()
    {
        var track = (await factory.SeedAsync("Quiet Harbour", "Fisherman Dawn"))[0];
        using var client = factory.CreateClient();

        using var response = await client.GetAsync($"/media/tracks/{track.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("audio/wav", response.Content.Headers.ContentType?.MediaType);
        Assert.Contains("bytes", response.Headers.AcceptRanges);
        Assert.Equal(10, (await response.Content.ReadAsByteArrayAsync()).Length);
    }

    [Fact]
    public async Task The_stream_answers_a_byte_range_with_206()
    {
        var track = (await factory.SeedAsync("Quiet Harbour", "Fisherman Dawn"))[0];
        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/media/tracks/{track.Id}");
        request.Headers.Range = new RangeHeaderValue(2, 5);

        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.PartialContent, response.StatusCode);
        Assert.Equal("bytes 2-5/10", response.Content.Headers.ContentRange?.ToString());
        Assert.Equal(new byte[] { 0x46, 0x46, 1, 2 }, await response.Content.ReadAsByteArrayAsync());
    }

    [Fact]
    public async Task The_stream_is_404_for_an_unknown_track_and_410_for_a_withdrawn_one()
    {
        var track = (await factory.SeedAsync("Quiet Harbour", "Fisherman Dawn"))[0];
        await factory.WithdrawAsync(track.Id);
        using var client = factory.CreateClient();

        using var unknown = await client.GetAsync($"/media/tracks/{Guid.NewGuid()}");
        using var withdrawn = await client.GetAsync($"/media/tracks/{track.Id}");

        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);
        Assert.Equal(HttpStatusCode.Gone, withdrawn.StatusCode);
        Assert.Equal("application/problem+json", withdrawn.Content.Headers.ContentType?.MediaType);
    }
}
