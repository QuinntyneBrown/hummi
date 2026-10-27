using System.Text.RegularExpressions;
using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Domain.Accounts;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Accounts;

/// <summary>The signed-in listener as GET /api/auth/me and sign-in return it.</summary>
public sealed record ListenerDto(string DisplayName, string Email, bool EmailConfirmed)
{
    public static ListenerDto From(Listener listener) => new(listener.DisplayName, listener.Email, listener.EmailConfirmed);
}

/// <summary>A started session: the API turns it into the access and refresh cookies (L2-029).</summary>
public sealed record SessionGrant(Guid ListenerId, ListenerDto Listener, string RefreshSecret, DateTimeOffset RefreshExpiresAt, bool Persistent);

/// <summary>The account failures; field messages match the forms word for word (L2-027, L2-029).</summary>
public static partial class AccountErrors
{
    public static readonly Error InvalidCredentials = new(401, "INVALID_CREDENTIALS", "That email and password don’t match");

    public static readonly Error SessionExpired = new(401, "UNAUTHENTICATED", "Sign in to continue");

    public static readonly Error LinkExpired = Error.Gone("LINK_EXPIRED", "This link has expired");

    public static readonly Error AccountNotCreated = new(503, "EMAIL_UNAVAILABLE", "We couldn’t create your account");

    public static readonly Error EmailNotSent = new(503, "EMAIL_UNAVAILABLE", "We couldn’t send the email");

    public static readonly Error ListenerNotFound = new(401, "UNAUTHENTICATED", "Sign in to continue");

    public static bool LooksLikeEmail(string email) => EmailPattern().IsMatch(email.Trim());

    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]{2,}$")]
    private static partial Regex EmailPattern();
}

/// <summary>Issues confirmation links and words their email (L2-027 AC4, L2-028).</summary>
internal static class ConfirmationEmail
{
    /// <summary>Closes the listener's open confirmation links and adds a fresh 24-hour one; returns its secret.</summary>
    public static async Task<string> IssueAsync(IHummiDbContext db, Listener listener, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var open = await db.EmailTokens
            .Where(t => t.ListenerId == listener.Id && t.Purpose == EmailTokenPurpose.ConfirmEmail && t.UsedAt == null)
            .ToListAsync(cancellationToken);
        open.ForEach(t => t.Invalidate(now));
        var (token, secret) = EmailToken.Issue(listener.Id, EmailTokenPurpose.ConfirmEmail, now);
        db.EmailTokens.Add(token);
        return secret;
    }

    public static EmailMessage Message(Listener listener, Uri link) => new(
        listener.Email,
        "Confirm your email for Hummi",
        $"Hi {listener.DisplayName},{Environment.NewLine}{Environment.NewLine}"
        + $"Open this link to confirm your email. It works for 24 hours:{Environment.NewLine}{link}{Environment.NewLine}{Environment.NewLine}"
        + "If you didn’t create a Hummi account, ignore this email.");
}

/// <summary>Issues the refresh token of a new or rotated session and saves it.</summary>
internal static class Sessions
{
    public static async Task<SessionGrant> StartAsync(IHummiDbContext db, Listener listener, bool persistent, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var (token, secret) = RefreshToken.Issue(listener.Id, persistent, now);
        db.RefreshTokens.Add(token);
        await db.SaveChangesAsync(cancellationToken);
        return new SessionGrant(listener.Id, ListenerDto.From(listener), secret, token.ExpiresAt, persistent);
    }

    public static async Task<RefreshToken?> FindAsync(IHummiDbContext db, string? secret, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(secret))
        {
            return null;
        }

        var hash = SecretToken.Hash(secret);
        return await db.RefreshTokens.SingleOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);
    }
}
