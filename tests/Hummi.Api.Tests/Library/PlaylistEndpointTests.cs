using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Hummi.Api.Tests.Accounts;
using Hummi.Domain.Catalogue;

namespace Hummi.Api.Tests.Library;

public sealed class PlaylistEndpointTests : IDisposable
{
    private readonly AuthApiFactory factory = new();

    public void Dispose() => factory.Dispose();

    private string SeedTrack(string title = "Feathers Up") => factory.Query(db =>
    {
        var artist = Artist.Create("Kaiso Collective " + title);
        var track = Track.Create(title, artist.Id, 222, null, DateTimeOffset.UtcNow);
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

    private static async Task<string> Create(HttpClient client, string name, params string[] trackIds)
    {
        using var response = await client.PostAsJsonAsync("/api/playlists", new { name, isPublic = false, trackIds });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    [Fact]
    public async Task L2_021_create_rename_and_read_back()
    {
        using var client = await SignedIn();
        var id = await Create(client, "Road trip to the north coast");

        using var rename = await client.PutAsJsonAsync($"/api/playlists/{id}", new { name = "North coast", isPublic = true });
        var playlist = await client.GetFromJsonAsync<JsonElement>($"/api/playlists/{id}");

        Assert.Equal(HttpStatusCode.NoContent, rename.StatusCode);
        Assert.Equal("North coast", playlist.GetProperty("name").GetString());
        Assert.True(playlist.GetProperty("isPublic").GetBoolean());
        Assert.True(playlist.GetProperty("isOwner").GetBoolean());
    }

    [Fact]
    public async Task L2_021_AC3_an_empty_name_answers_422_and_a_visitor_401()
    {
        using var client = await SignedIn();
        using var visitor = factory.CreateHttpsClient();

        using var empty = await client.PostAsJsonAsync("/api/playlists", new { name = " ", isPublic = false });
        using var anonymous = await visitor.PostAsJsonAsync("/api/playlists", new { name = "Mine", isPublic = false });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, empty.StatusCode);
        Assert.Contains("Give your playlist a name", await empty.Content.ReadAsStringAsync(), StringComparison.Ordinal);
        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
    }

    [Fact]
    public async Task L2_020_choices_membership_and_add_again()
    {
        var feathers = SeedTrack();
        using var client = await SignedIn();
        var road = await Create(client, "Road trip to the north coast");
        var rainy = await Create(client, "Rainy-day panyard", feathers);

        var choices = await client.GetFromJsonAsync<JsonElement>($"/api/me/playlists?trackId={feathers}");
        using var save = await client.PutAsJsonAsync("/api/me/playlist-membership", new { trackId = feathers, playlistIds = new[] { road } });
        var change = await save.Content.ReadFromJsonAsync<JsonElement>();
        using var duplicate = await client.PostAsJsonAsync($"/api/playlists/{road}/tracks", new { trackIds = new[] { feathers }, allowDuplicates = false });
        using var again = await client.PostAsJsonAsync($"/api/playlists/{road}/tracks", new { trackIds = new[] { feathers }, allowDuplicates = true });

        Assert.Equal(2, choices.GetArrayLength());
        Assert.Equal("Road trip to the north coast", change.GetProperty("added")[0].GetProperty("name").GetString());
        Assert.Equal(1, change.GetProperty("added")[0].GetProperty("position").GetInt32());
        Assert.Equal(rainy, change.GetProperty("removed")[0].GetString());
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        Assert.Contains("ALREADY_IN_PLAYLIST", await duplicate.Content.ReadAsStringAsync(), StringComparison.Ordinal);
        Assert.Equal(2, (await again.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("position").GetInt32());
    }

    [Fact]
    public async Task L2_022_L2_023_remove_entries_then_delete_and_others_are_refused()
    {
        var feathers = SeedTrack();
        var jouvert = SeedTrack("J’ouvert Morning");
        using var nadia = await SignedIn();
        using var mei = await SignedIn("mei@example.com");
        var road = await Create(nadia, "Road trip to the north coast", feathers, jouvert);
        var playlist = await nadia.GetFromJsonAsync<JsonElement>($"/api/playlists/{road}");
        var first = playlist.GetProperty("entries")[0].GetProperty("entryId").GetString();

        Assert.Equal(HttpStatusCode.Forbidden, (await mei.GetAsync($"/api/playlists/{road}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await mei.DeleteAsync($"/api/playlists/{road}")).StatusCode);
        using var remove = await nadia.PostAsJsonAsync($"/api/playlists/{road}/entries/remove", new { entryIds = new[] { first } });
        var after = await nadia.GetFromJsonAsync<JsonElement>($"/api/playlists/{road}");
        using var delete = await nadia.DeleteAsync($"/api/playlists/{road}");

        Assert.Equal(HttpStatusCode.NoContent, remove.StatusCode);
        Assert.Equal(1, after.GetProperty("trackCount").GetInt32());
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await nadia.GetAsync($"/api/playlists/{road}")).StatusCode);
        Assert.Equal(2, factory.Query(db => db.Tracks.Count()));
    }
}
