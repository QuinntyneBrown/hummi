namespace Hummi.Domain.Accounts;

/// <summary>A listener account: display name, unique email and password hash (L2-027).</summary>
public sealed class Listener
{
    public const int MinimumPasswordLength = 10;

    private Listener(Guid id, string displayName, string email, string passwordHash, DateTimeOffset createdAt)
    {
        Id = id;
        DisplayName = displayName;
        Email = email;
        PasswordHash = passwordHash;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }

    public string DisplayName { get; private set; }

    /// <summary>Trimmed and lower-cased, so one address has one account.</summary>
    public string Email { get; private set; }

    public string PasswordHash { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    /// <summary>Null until the listener opens a confirmation link (L2-028).</summary>
    public DateTimeOffset? EmailConfirmedAt { get; private set; }

    public bool EmailConfirmed => EmailConfirmedAt is not null;

    public static Listener Create(string displayName, string email, string passwordHash, DateTimeOffset createdAt) =>
        new(Guid.NewGuid(), displayName.Trim(), NormaliseEmail(email), passwordHash, createdAt);

    public static string NormaliseEmail(string email) => email.Trim().ToLowerInvariant();

    public void ConfirmEmail(DateTimeOffset at) => EmailConfirmedAt ??= at;
}
