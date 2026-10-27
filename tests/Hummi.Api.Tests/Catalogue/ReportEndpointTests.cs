using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Hummi.Api.Tests.Accounts;
using Hummi.Domain.Catalogue;

namespace Hummi.Api.Tests.Catalogue;

public sealed class ReportEndpointTests : IDisposable
{
    private readonly AuthApiFactory factory = new() { ReviewerKey = "a-reviewer-key" };

    public void Dispose() => factory.Dispose();

    [Fact]
    public async Task L2_038_a_listener_reports_and_a_reviewer_resolves_with_the_key()
    {
        var trackId = factory.Query(db =>
        {
            var artist = Artist.Create("Kaiso Collective");
            var track = Track.Create("Feathers Up", artist.Id, 222, null, DateTimeOffset.UtcNow);
            db.Artists.Add(artist);
            db.Tracks.Add(track);
            db.SaveChanges();
            return track.Id.ToString();
        });
        using var client = factory.CreateHttpsClient();
        (await client.PostAsJsonAsync("/api/auth/sign-up", new { displayName = "Nadia", email = "nadia@example.com", password = "a-long-password", acceptedTerms = true })).EnsureSuccessStatusCode();
        (await client.PostAsJsonAsync("/api/auth/sign-in", new { email = "nadia@example.com", password = "a-long-password", keepSignedIn = true })).EnsureSuccessStatusCode();
        using var reviewer = factory.CreateHttpsClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await reviewer.PostAsJsonAsync($"/api/tracks/{trackId}/reports", new { reason = "copied" })).StatusCode);
        using var filed = await client.PostAsJsonAsync($"/api/tracks/{trackId}/reports", new { reason = "copied", details = "Sounds familiar." });
        Assert.Equal(HttpStatusCode.Created, filed.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await reviewer.GetAsync("/api/reports")).StatusCode);

        reviewer.DefaultRequestHeaders.Add("X-Reviewer-Key", "a-reviewer-key");
        var open = await reviewer.GetFromJsonAsync<JsonElement>("/api/reports");
        var id = open[0].GetProperty("id").GetString();
        Assert.DoesNotContain("nadia", open.GetRawText(), StringComparison.OrdinalIgnoreCase);
        factory.Email.Sent.Clear();
        using var resolve = await reviewer.PostAsJsonAsync($"/api/reports/{id}/resolve", new { upheld = false, outcome = "It is original." });

        Assert.Equal(HttpStatusCode.NoContent, resolve.StatusCode);
        Assert.Equal("nadia@example.com", Assert.Single(factory.Email.Sent).To);
        Assert.DoesNotContain("nadia", await client.GetStringAsync("/api/artists/kaiso-collective"), StringComparison.OrdinalIgnoreCase);
    }
}
