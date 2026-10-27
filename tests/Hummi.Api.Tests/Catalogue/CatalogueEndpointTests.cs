using System.Net;
using System.Text.Json;
using Hummi.Api.Tests.Playback;

namespace Hummi.Api.Tests.Catalogue;

public sealed class CatalogueEndpointTests : IDisposable
{
    private readonly PlaybackApiFactory factory = new();

    public void Dispose() => factory.Dispose();

    [Fact]
    public async Task L2_008_a_track_is_served_by_slug_with_its_details()
    {
        await factory.SeedAlbumAsync("Kaiso Collective", "Mas on the Avenue", "Feathers Up", "J’ouvert Morning");
        using var client = factory.CreateClient();

        using var body = JsonDocument.Parse(await client.GetStringAsync("/api/tracks/feathers-up"));

        var track = body.RootElement;
        Assert.Equal("Feathers Up", track.GetProperty("title").GetString());
        Assert.Equal("kaiso-collective", track.GetProperty("artist").GetProperty("slug").GetString());
        Assert.Equal("Mas on the Avenue", track.GetProperty("album").GetProperty("title").GetString());
        Assert.Equal("openmusic-3b", track.GetProperty("generatedWith").GetString());
        Assert.Equal("cc0", track.GetProperty("licence").GetString());
        Assert.Equal("CC0 1.0 (public domain)", track.GetProperty("licenceLabel").GetString());
        Assert.True(track.GetProperty("playable").GetBoolean());
        Assert.Equal(JsonValueKind.Array, track.GetProperty("waveform").ValueKind);
        Assert.Equal("jouvert-morning", track.GetProperty("moreFromArtist")[0].GetProperty("slug").GetString());
    }

    [Fact]
    public async Task L2_009_an_unknown_track_is_404_problem_details()
    {
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/tracks/no-such-track");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        using var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("TRACK_NOT_FOUND", problem.RootElement.GetProperty("code").GetString());
    }

    [Fact]
    public async Task L2_010_an_artist_is_served_by_slug_and_an_unknown_one_is_404()
    {
        await factory.SeedAlbumAsync("Kaiso Collective", "Mas on the Avenue", "Feathers Up", "J’ouvert Morning");
        using var client = factory.CreateClient();

        using var body = JsonDocument.Parse(await client.GetStringAsync("/api/artists/kaiso-collective"));
        using var unknown = await client.GetAsync("/api/artists/nobody");

        Assert.Equal("Kaiso Collective", body.RootElement.GetProperty("name").GetString());
        Assert.Equal(2, body.RootElement.GetProperty("popular").GetArrayLength());
        Assert.Equal(2, body.RootElement.GetProperty("releases")[0].GetProperty("trackCount").GetInt32());
        Assert.False(body.RootElement.GetProperty("following").GetBoolean());
        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);
    }

    [Fact]
    public async Task L2_011_an_album_is_served_by_slug_and_an_unknown_one_is_404()
    {
        await factory.SeedAlbumAsync("Kaiso Collective", "Mas on the Avenue", "Feathers Up", "J’ouvert Morning");
        using var client = factory.CreateClient();

        using var body = JsonDocument.Parse(await client.GetStringAsync("/api/albums/mas-on-the-avenue"));
        using var unknown = await client.GetAsync("/api/albums/nothing");

        Assert.Equal("Mas on the Avenue", body.RootElement.GetProperty("title").GetString());
        Assert.Equal("2026 · 2 tracks · 8 min · CC0 1.0 (public domain)", body.RootElement.GetProperty("summary").GetString());
        Assert.Equal(2, body.RootElement.GetProperty("tracks").GetArrayLength());
        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);
        using var problem = JsonDocument.Parse(await unknown.Content.ReadAsStringAsync());
        Assert.Equal("ALBUM_NOT_FOUND", problem.RootElement.GetProperty("code").GetString());
    }
}
