using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Hummi.Api.Tests.Accounts;
using Hummi.Domain.Library;

namespace Hummi.Api.Tests.Library;

public sealed class NotificationEndpointTests : IDisposable
{
    private readonly AuthApiFactory factory = new();

    public void Dispose() => factory.Dispose();

    [Fact]
    public async Task L2_036_L2_037_list_count_and_mark_all_as_read()
    {
        using var client = factory.CreateHttpsClient();
        (await client.PostAsJsonAsync("/api/auth/sign-up", new { displayName = "Nadia", email = "nadia@example.com", password = "a-long-password", acceptedTerms = true })).EnsureSuccessStatusCode();
        (await client.PostAsJsonAsync("/api/auth/sign-in", new { email = "nadia@example.com", password = "a-long-password", keepSignedIn = true })).EnsureSuccessStatusCode();
        factory.Query(db =>
        {
            var id = db.Listeners.Single().Id;
            db.Notifications.Add(Notification.Product(id, "models", "Hummi now shows the model that generated each track.", DateTimeOffset.UtcNow));
            return db.SaveChanges();
        });

        var list = await client.GetFromJsonAsync<JsonElement>("/api/me/notifications");
        var count = await client.GetFromJsonAsync<JsonElement>("/api/me/notifications/unread-count");
        using var read = await client.PostAsync("/api/me/notifications/read-all", null);
        var after = await client.GetFromJsonAsync<JsonElement>("/api/me/notifications/unread-count");

        Assert.Equal(1, list.GetProperty("unread").GetInt32());
        Assert.Equal("product", list.GetProperty("items")[0].GetProperty("kind").GetString());
        Assert.Equal(1, count.GetProperty("unread").GetInt32());
        Assert.Equal(HttpStatusCode.NoContent, read.StatusCode);
        Assert.Equal(0, after.GetProperty("unread").GetInt32());
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateHttpsClient().GetAsync("/api/me/notifications")).StatusCode);
    }
}
