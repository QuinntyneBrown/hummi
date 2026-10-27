using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Hummi.Api.Tests.Accounts;

public sealed class AuthEndpointTests : IDisposable
{
    private readonly AuthApiFactory factory = new();

    public void Dispose() => factory.Dispose();

    private static object SignUpBody(string email = "nadia@example.com") =>
        new { displayName = "Nadia", email, password = "a-long-password", acceptedTerms = true };

    private async Task<HttpClient> SignedUpClient(bool confirm = true)
    {
        var client = factory.CreateHttpsClient();
        (await client.PostAsJsonAsync("/api/auth/sign-up", SignUpBody())).EnsureSuccessStatusCode();
        if (confirm)
        {
            (await client.PostAsJsonAsync("/api/auth/verify-email", new { token = factory.Email.LastToken() })).EnsureSuccessStatusCode();
        }

        return client;
    }

    private static Task<HttpResponseMessage> SignIn(HttpClient client, bool keep = true, string password = "a-long-password") =>
        client.PostAsJsonAsync("/api/auth/sign-in", new { email = "nadia@example.com", password, keepSignedIn = keep });

    [Fact]
    public async Task L2_027_AC4_sign_up_answers_202_and_sends_the_confirmation_link()
    {
        using var client = factory.CreateHttpsClient();

        using var response = await client.PostAsJsonAsync("/api/auth/sign-up", SignUpBody());

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        var sent = Assert.Single(factory.Email.Sent);
        Assert.Contains("http://localhost:4200/verify-email?token=", sent.Body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task L2_027_AC2_invalid_sign_up_answers_422_with_field_errors()
    {
        using var client = factory.CreateHttpsClient();

        using var response = await client.PostAsJsonAsync("/api/auth/sign-up", new { displayName = "", email = "nadia@exam", password = "short", acceptedTerms = true });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var errors = body.RootElement.GetProperty("errors");
        Assert.Equal("Enter a display name", errors.GetProperty("displayName").GetProperty("message").GetString());
        Assert.Equal("That email address looks incomplete", errors.GetProperty("email").GetProperty("message").GetString());
        Assert.Equal("Use at least 10 characters", errors.GetProperty("password").GetProperty("message").GetString());
    }

    [Fact]
    public async Task L2_027_AC5_an_email_failure_answers_503_and_leaves_no_account()
    {
        factory.Email.Fail = true;
        using var client = factory.CreateHttpsClient();

        using var response = await client.PostAsJsonAsync("/api/auth/sign-up", SignUpBody());

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal(0, factory.Query(db => db.Listeners.Count()));
    }

    [Fact]
    public async Task L2_028_AC2_verify_email_confirms_and_returns_the_name()
    {
        using var client = await SignedUpClient(confirm: false);

        using var response = await client.PostAsJsonAsync("/api/auth/verify-email", new { token = factory.Email.LastToken() });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("Nadia", body.RootElement.GetProperty("displayName").GetString());
    }

    [Fact]
    public async Task L2_028_AC3_an_unknown_or_used_link_answers_410_link_expired()
    {
        using var client = await SignedUpClient();

        using var response = await client.PostAsJsonAsync("/api/auth/verify-email", new { token = factory.Email.LastToken() });

        Assert.Equal(HttpStatusCode.Gone, response.StatusCode);
        Assert.Contains("LINK_EXPIRED", await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task L2_028_AC3_send_a_new_link_from_the_expired_page()
    {
        using var client = await SignedUpClient(confirm: false);

        using var response = await client.PostAsJsonAsync("/api/auth/resend-confirmation", new { token = factory.Email.LastToken() });

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        Assert.Equal(2, factory.Email.Sent.Count);
    }

    [Fact]
    public async Task L2_028_AC4_the_banner_resends_for_the_signed_in_unconfirmed_listener()
    {
        using var client = await SignedUpClient(confirm: false);
        (await SignIn(client)).EnsureSuccessStatusCode();

        var me = await client.GetFromJsonAsync<JsonElement>("/api/auth/me");
        using var response = await client.PostAsJsonAsync("/api/auth/resend-confirmation", new { });

        Assert.False(me.GetProperty("emailConfirmed").GetBoolean());
        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        Assert.Equal(2, factory.Email.Sent.Count);
    }

    [Fact]
    public async Task L2_029_AC5_sign_in_sets_http_only_cookies_and_me_answers_the_listener()
    {
        using var client = await SignedUpClient();

        using var response = await SignIn(client);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var cookies = response.Headers.GetValues("Set-Cookie").ToList();
        Assert.All(cookies, c => Assert.Contains("httponly", c, StringComparison.OrdinalIgnoreCase));
        Assert.All(cookies, c => Assert.Contains("samesite=strict", c, StringComparison.OrdinalIgnoreCase));
        var me = await client.GetFromJsonAsync<JsonElement>("/api/auth/me");
        Assert.Equal("nadia@example.com", me.GetProperty("email").GetString());
        Assert.True(me.GetProperty("emailConfirmed").GetBoolean());
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task L2_029_AC5_keep_me_signed_in_decides_whether_the_refresh_cookie_outlives_the_browser(bool keep)
    {
        using var client = await SignedUpClient();

        using var response = await SignIn(client, keep);

        var refresh = response.Headers.GetValues("Set-Cookie").Single(c => c.StartsWith("hm_refresh=", StringComparison.Ordinal));
        Assert.Equal(keep, refresh.Contains("expires=", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task L2_029_AC4_a_wrong_password_answers_401_invalid_credentials()
    {
        using var client = await SignedUpClient();

        using var response = await SignIn(client, password: "not-the-password");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Contains("INVALID_CREDENTIALS", await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);
        Assert.False(response.Headers.Contains("Set-Cookie"));
    }

    [Fact]
    public async Task Me_answers_401_for_a_visitor()
    {
        using var client = factory.CreateHttpsClient();

        using var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Refresh_rotates_the_session_cookies()
    {
        using var client = await SignedUpClient();
        (await SignIn(client)).EnsureSuccessStatusCode();

        using var response = await client.PostAsync("/api/auth/refresh", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains(response.Headers.GetValues("Set-Cookie"), c => c.StartsWith("hm_refresh=", StringComparison.Ordinal));
        Assert.Equal(2, factory.Query(db => db.RefreshTokens.Count()));
    }

    [Fact]
    public async Task L2_031_AC2_sign_out_revokes_the_session_clears_cookies_and_keeps_the_account()
    {
        using var client = await SignedUpClient();
        (await SignIn(client)).EnsureSuccessStatusCode();

        using var response = await client.PostAsync("/api/auth/sign-out", null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsync("/api/auth/refresh", null)).StatusCode);
        Assert.All(factory.Query(db => db.RefreshTokens.ToList()), t => Assert.NotNull(t.RevokedAt));
        Assert.Equal(1, factory.Query(db => db.Listeners.Count()));
    }

    [Theory]
    [InlineData("nadia@example.com", 1)]
    [InlineData("nobody@example.com", 0)]
    public async Task L2_030_AC4_a_reset_request_answers_202_whether_or_not_the_account_exists(string email, int sent)
    {
        using var client = await SignedUpClient();
        factory.Email.Sent.Clear();

        using var response = await client.PostAsJsonAsync("/api/auth/password-reset", new { email });

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        Assert.Equal(sent, factory.Email.Sent.Count);
    }

    [Fact]
    public async Task L2_030_AC6_an_email_failure_answers_503()
    {
        using var client = await SignedUpClient();
        factory.Email.Fail = true;

        using var response = await client.PostAsJsonAsync("/api/auth/password-reset", new { email = "nadia@example.com" });

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Contains("EMAIL_UNAVAILABLE", await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task L2_055_AC4_confirm_changes_the_password_and_ends_every_session()
    {
        using var client = await SignedUpClient();
        (await SignIn(client)).EnsureSuccessStatusCode();
        (await client.PostAsJsonAsync("/api/auth/password-reset", new { email = "nadia@example.com" })).EnsureSuccessStatusCode();
        Assert.Contains("http://localhost:4200/new-password?token=", factory.Email.Sent[^1].Body, StringComparison.Ordinal);
        var token = factory.Email.LastToken();

        using var response = await client.PostAsJsonAsync("/api/auth/password-reset/confirm", new { token, password = "a-new-long-password" });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsync("/api/auth/refresh", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await SignIn(client)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await SignIn(client, password: "a-new-long-password")).StatusCode);
        using var again = await client.PostAsJsonAsync("/api/auth/password-reset/confirm", new { token, password = "another-long-password" });
        Assert.Equal(HttpStatusCode.Gone, again.StatusCode);
    }

    [Fact]
    public async Task L2_055_AC2_a_short_password_answers_422()
    {
        using var client = factory.CreateHttpsClient();

        using var response = await client.PostAsJsonAsync("/api/auth/password-reset/confirm", new { token = "nope", password = "short" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task Auth_endpoints_are_rate_limited_per_client()
    {
        using var limited = new AuthApiFactory { RequestsPerMinute = 2 };
        using var client = limited.CreateHttpsClient();

        for (var i = 0; i < 2; i++)
        {
            using var allowed = await SignIn(client);
        }

        using var response = await SignIn(client);

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
        Assert.True(response.Headers.Contains("Retry-After"));
    }
}
