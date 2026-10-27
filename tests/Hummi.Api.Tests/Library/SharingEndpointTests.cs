using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Hummi.Api.Tests.Accounts;
using Hummi.Domain.Catalogue;

namespace Hummi.Api.Tests.Library;

public sealed class SharingEndpointTests : IDisposable
{
    private readonly AuthApiFactory factory = new();

    public void Dispose() => factory.Dispose();

    private string SeedTrack() => factory.Query(db =>
    {
        var artist = Artist.Create("Marisol Vega");
        var track = Track.Create("Wine Slow", artist.Id, 176, null, DateTimeOffset.UtcNow);
        db.Artists.Add(artist);
        db.Tracks.Add(track);
        db.SaveChanges();
        return track.Id.ToString();
    });

    private async Task<HttpClient> SignedIn(string email)
    {
        var client = factory.CreateHttpsClient();
        (await client.PostAsJsonAsync("/api/auth/sign-up", new { displayName = email, email, password = "a-long-password", acceptedTerms = true })).EnsureSuccessStatusCode();
        (await client.PostAsJsonAsync("/api/auth/sign-in", new { email, password = "a-long-password", keepSignedIn = true })).EnsureSuccessStatusCode();
        return client;
    }

    [Fact]
    public async Task L2_025_L2_026_a_visitor_shares_a_track_and_the_code_resolves_without_an_account()
    {
        var trackId = SeedTrack();
        using var visitor = factory.CreateHttpsClient();

        using var share = await visitor.PostAsJsonAsync("/api/shares", new { type = "track", id = trackId });
        var code = (await share.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString();
        var resolved = await visitor.GetFromJsonAsync<JsonElement>($"/api/shares/{code}");

        Assert.Equal(HttpStatusCode.OK, share.StatusCode);
        Assert.Equal("wine-slow", resolved.GetProperty("trackSlug").GetString());
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync("/api/shares/nope")).StatusCode);
    }

    [Fact]
    public async Task L2_024_a_shared_private_playlist_opens_read_only_and_can_be_saved()
    {
        var trackId = SeedTrack();
        using var nadia = await SignedIn("nadia@example.com");
        using var mei = await SignedIn("mei@example.com");
        using var created = await nadia.PostAsJsonAsync("/api/playlists", new { name = "Road trip", isPublic = false, trackIds = new[] { trackId } });
        var id = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();
        using var share = await nadia.PostAsJsonAsync("/api/shares", new { type = "playlist", id });
        var code = (await share.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString();

        Assert.Equal(HttpStatusCode.Forbidden, (await mei.GetAsync($"/api/playlists/{id}")).StatusCode);
        var opened = await mei.GetFromJsonAsync<JsonElement>($"/api/playlists/{id}?share={code}");
        using var save = await mei.PutAsync($"/api/me/saved-playlists/{id}?share={code}", null);
        var library = await mei.GetFromJsonAsync<JsonElement>("/api/me/library");

        Assert.False(opened.GetProperty("isOwner").GetBoolean());
        Assert.Equal(HttpStatusCode.NoContent, save.StatusCode);
        Assert.Equal("Road trip", library.GetProperty("playlists")[0].GetProperty("name").GetString());
        Assert.Equal(HttpStatusCode.Forbidden, (await mei.DeleteAsync($"/api/playlists/{id}")).StatusCode);
    }
}
