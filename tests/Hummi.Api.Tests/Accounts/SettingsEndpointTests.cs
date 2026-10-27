using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Hummi.Api.Tests.Accounts;

public sealed class SettingsEndpointTests : IDisposable
{
    private readonly AuthApiFactory factory = new();

    public void Dispose() => factory.Dispose();

    [Fact]
    public async Task L2_033_AC4_settings_saved_on_one_device_read_back_on_another()
    {
        using var phone = factory.CreateHttpsClient();
        (await phone.PostAsJsonAsync("/api/auth/sign-up", new { displayName = "Nadia", email = "nadia@example.com", password = "a-long-password", acceptedTerms = true })).EnsureSuccessStatusCode();
        (await phone.PostAsJsonAsync("/api/auth/sign-in", new { email = "nadia@example.com", password = "a-long-password", keepSignedIn = true })).EnsureSuccessStatusCode();
        using var laptop = factory.CreateHttpsClient();
        (await laptop.PostAsJsonAsync("/api/auth/sign-in", new { email = "nadia@example.com", password = "a-long-password", keepSignedIn = true })).EnsureSuccessStatusCode();

        using var save = await phone.PutAsJsonAsync("/api/me/settings", new { displayName = "Nadia C", email = "nadia@example.com", autoplaySimilar = false, crossfade = true, theme = "dark", notifyNewReleases = true, productNews = false });
        var read = await laptop.GetFromJsonAsync<JsonElement>("/api/me/settings");
        using var empty = await phone.PutAsJsonAsync("/api/me/settings", new { displayName = "", email = "nadia@example.com", theme = "dark" });

        Assert.Equal(HttpStatusCode.OK, save.StatusCode);
        Assert.Equal("Nadia C", read.GetProperty("displayName").GetString());
        Assert.Equal("dark", read.GetProperty("theme").GetString());
        Assert.True(read.GetProperty("crossfade").GetBoolean());
        Assert.Equal(HttpStatusCode.UnprocessableEntity, empty.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateHttpsClient().GetAsync("/api/me/settings")).StatusCode);
    }
}
