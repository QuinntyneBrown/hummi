using Hummi.Domain.Accounts;

namespace Hummi.Domain.Tests;

public sealed class AccountTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 27, 9, 0, 0, TimeSpan.Zero);

    [Fact]
    public void A_new_listener_has_a_normalised_email_and_is_unconfirmed()
    {
        var listener = Listener.Create("  Nadia ", " Nadia@Example.com ", "hash", Now);

        Assert.Equal("Nadia", listener.DisplayName);
        Assert.Equal("nadia@example.com", listener.Email);
        Assert.False(listener.EmailConfirmed);
    }

    [Fact]
    public void Confirming_the_email_records_when()
    {
        var listener = Listener.Create("Nadia", "nadia@example.com", "hash", Now);

        listener.ConfirmEmail(Now.AddHours(1));

        Assert.True(listener.EmailConfirmed);
        Assert.Equal(Now.AddHours(1), listener.EmailConfirmedAt);
    }

    [Fact]
    public void An_email_token_stores_only_the_hash_of_its_secret()
    {
        var (token, secret) = EmailToken.Issue(Guid.NewGuid(), EmailTokenPurpose.ConfirmEmail, Now);

        Assert.NotEqual(secret, token.TokenHash);
        Assert.Equal(SecretToken.Hash(secret), token.TokenHash);
        Assert.Equal(Now.AddHours(24), token.ExpiresAt);
    }

    [Fact]
    public void An_email_token_redeems_once_within_24_hours()
    {
        var (token, _) = EmailToken.Issue(Guid.NewGuid(), EmailTokenPurpose.ConfirmEmail, Now);

        Assert.Equal(TokenRedemption.Redeemed, token.Redeem(Now.AddHours(23)));
        Assert.Equal(TokenRedemption.AlreadyUsed, token.Redeem(Now.AddHours(23)));
    }

    [Fact]
    public void An_email_token_older_than_24_hours_has_expired()
    {
        var (token, _) = EmailToken.Issue(Guid.NewGuid(), EmailTokenPurpose.ConfirmEmail, Now);

        Assert.Equal(TokenRedemption.Expired, token.Redeem(Now.AddHours(24).AddSeconds(1)));
        Assert.Null(token.UsedAt);
    }

    [Fact]
    public void A_persistent_refresh_token_lasts_30_days_and_a_browser_session_one_day()
    {
        var (persistent, _) = RefreshToken.Issue(Guid.NewGuid(), persistent: true, Now);
        var (session, _) = RefreshToken.Issue(Guid.NewGuid(), persistent: false, Now);

        Assert.Equal(Now.AddDays(30), persistent.ExpiresAt);
        Assert.Equal(Now.AddDays(1), session.ExpiresAt);
    }

    [Fact]
    public void A_revoked_refresh_token_is_no_longer_active()
    {
        var (token, _) = RefreshToken.Issue(Guid.NewGuid(), persistent: true, Now);
        Assert.True(token.IsActive(Now));

        token.Revoke(Now.AddMinutes(5));

        Assert.False(token.IsActive(Now.AddMinutes(6)));
        Assert.False(RefreshToken.Issue(Guid.NewGuid(), false, Now).Token.IsActive(Now.AddDays(2)));
    }
}
