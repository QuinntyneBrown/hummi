using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Hummi.Api.Tests.Accounts;
using Hummi.Domain.Catalogue;

namespace Hummi.Api.Tests.Library;

public sealed class LibraryEndpointTests : IDisposable
{
    private readonly AuthApiFactory factory = new();

    public void Dispose() => factory.Dispose();

    private string SeedTrack() => factory.Query(db =>
    {
        var artist = Artist.Create("Kaiso Collective");
        var track = Track.Create("Road March Riddim", artist.Id, 245, null, DateTimeOffset.UtcNow);
        db.Artists.Add(artist);
        db.Tracks.Add(track);
        db.SaveChanges();
        return track.Id.ToString();
    });

    private async Task<HttpClient> SignedIn(string email = "nadia@example.com")
    {
        var client = factory.CreateHttpsClient();
        (await client.PostAsJsonAsync("/api/auth/sign-up", new { displayName = "Nadia", email, password = "a-long-password", acceptedTerms = true })).EnsureSuccessStatusCode();
        (await client.PostAsJsonAsync("/api/auth/sign-in", new { email, password = "a-long-password", keepSignedIn = true })).EnsureSuccessStatusCode();
        return client;
    }

    [Fact]
    public async Task L2_018_like_and_follow_need_a_session()
    {
        var trackId = SeedTrack();
        using var client = factory.CreateHttpsClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PutAsync($"/api/me/likes/{trackId}", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/me/library")).StatusCode);
    }

    [Fact]
    public async Task L2_018_L2_019_AC5_likes_and_follows_are_idempotent_and_every_device_sees_them()
    {
        var trackId = SeedTrack();
        using var phone = await SignedIn();
        using var laptop = factory.CreateHttpsClient();
        (await laptop.PostAsJsonAsync("/api/auth/sign-in", new { email = "nadia@example.com", password = "a-long-password", keepSignedIn = true })).EnsureSuccessStatusCode();

        Assert.Equal(HttpStatusCode.NoContent, (await phone.PutAsync($"/api/me/likes/{trackId}", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await phone.PutAsync($"/api/me/likes/{trackId}", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await phone.PutAsync("/api/me/follows/kaiso-collective", null)).StatusCode);

        var library = await laptop.GetFromJsonAsync<JsonElement>("/api/me/library");
        Assert.Equal(1, library.GetProperty("likedCount").GetInt32());
        Assert.Equal("Road March Riddim", library.GetProperty("liked")[0].GetProperty("title").GetString());
        Assert.True(library.GetProperty("liked")[0].GetProperty("liked").GetBoolean());
        Assert.Equal("kaiso-collective", library.GetProperty("following")[0].GetProperty("slug").GetString());

        Assert.Equal(HttpStatusCode.NoContent, (await laptop.DeleteAsync($"/api/me/likes/{trackId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await laptop.DeleteAsync("/api/me/follows/kaiso-collective")).StatusCode);
        var after = await phone.GetFromJsonAsync<JsonElement>("/api/me/library");
        Assert.Equal(0, after.GetProperty("likedCount").GetInt32());
        Assert.Equal(0, after.GetProperty("followingCount").GetInt32());
    }

    [Fact]
    public async Task Liking_an_unknown_track_answers_404()
    {
        using var client = await SignedIn();

        using var response = await client.PutAsync($"/api/me/likes/{Guid.NewGuid()}", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
