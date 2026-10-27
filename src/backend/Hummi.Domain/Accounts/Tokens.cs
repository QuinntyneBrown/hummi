using System.Security.Cryptography;
using System.Text;

namespace Hummi.Domain.Accounts;

/// <summary>Random URL-safe secrets; only their SHA-256 hash is ever stored.</summary>
public static class SecretToken
{
    public static string New() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
        .Replace('+', '-').Replace('/', '_').TrimEnd('=');

    public static string Hash(string secret) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(secret)));
}

public enum EmailTokenPurpose
{
    ConfirmEmail = 1,
}

public enum TokenRedemption
{
    Redeemed,
    Expired,
    AlreadyUsed,
}

/// <summary>A single-use emailed link, valid for 24 hours (L2-028).</summary>
public sealed class EmailToken
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromHours(24);

    private EmailToken(Guid id, Guid listenerId, EmailTokenPurpose purpose, string tokenHash, DateTimeOffset expiresAt)
    {
        Id = id;
        ListenerId = listenerId;
        Purpose = purpose;
        TokenHash = tokenHash;
        ExpiresAt = expiresAt;
    }

    public Guid Id { get; private set; }

    public Guid ListenerId { get; private set; }

    public EmailTokenPurpose Purpose { get; private set; }

    public string TokenHash { get; private set; }

    public DateTimeOffset ExpiresAt { get; private set; }

    public DateTimeOffset? UsedAt { get; private set; }

    /// <summary>Creates a token and returns it with the secret that goes in the link.</summary>
    public static (EmailToken Token, string Secret) Issue(Guid listenerId, EmailTokenPurpose purpose, DateTimeOffset now)
    {
        var secret = SecretToken.New();
        return (new EmailToken(Guid.NewGuid(), listenerId, purpose, SecretToken.Hash(secret), now + Lifetime), secret);
    }

    public TokenRedemption Redeem(DateTimeOffset now)
    {
        if (UsedAt is not null)
        {
            return TokenRedemption.AlreadyUsed;
        }

        if (now > ExpiresAt)
        {
            return TokenRedemption.Expired;
        }

        UsedAt = now;
        return TokenRedemption.Redeemed;
    }

    /// <summary>Closes an open token when a fresh one replaces it.</summary>
    public void Invalidate(DateTimeOffset now) => UsedAt ??= now;
}

/// <summary>
/// The long-lived half of a session (L2-029): 30 days when "Keep me signed in" is checked, otherwise one
/// day on the server and a cookie that ends with the browser. Rotated on every refresh, revoked on sign-out.
/// </summary>
public sealed class RefreshToken
{
    public static readonly TimeSpan PersistentLifetime = TimeSpan.FromDays(30);
    public static readonly TimeSpan SessionLifetime = TimeSpan.FromDays(1);

    private RefreshToken(Guid id, Guid listenerId, string tokenHash, bool persistent, DateTimeOffset expiresAt)
    {
        Id = id;
        ListenerId = listenerId;
        TokenHash = tokenHash;
        Persistent = persistent;
        ExpiresAt = expiresAt;
    }

    public Guid Id { get; private set; }

    public Guid ListenerId { get; private set; }

    public string TokenHash { get; private set; }

    public bool Persistent { get; private set; }

    public DateTimeOffset ExpiresAt { get; private set; }

    public DateTimeOffset? RevokedAt { get; private set; }

    public static (RefreshToken Token, string Secret) Issue(Guid listenerId, bool persistent, DateTimeOffset now)
    {
        var secret = SecretToken.New();
        var expires = now + (persistent ? PersistentLifetime : SessionLifetime);
        return (new RefreshToken(Guid.NewGuid(), listenerId, SecretToken.Hash(secret), persistent, expires), secret);
    }

    public bool IsActive(DateTimeOffset now) => RevokedAt is null && now < ExpiresAt;

    public void Revoke(DateTimeOffset now) => RevokedAt ??= now;
}
