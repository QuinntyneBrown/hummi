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

    /// <summary>Keep playing similar tracks when the queue ends (L2-034 AC2); on by default.</summary>
    public bool AutoplaySimilar { get; private set; } = true;

    /// <summary>Blend the end of one track into the next (L2-034 AC3); off by default.</summary>
    public bool Crossfade { get; private set; }

    /// <summary>"device", "light" or "dark" (L2-049); device by default.</summary>
    public string Theme { get; private set; } = Themes.Device;

    /// <summary>The weekly email about followed artists' new tracks (L2-035 AC2); on by default.</summary>
    public bool NotifyNewReleases { get; private set; } = true;

    /// <summary>Product news emails (L2-035 AC3); off by default.</summary>
    public bool ProductNews { get; private set; }

    /// <summary>When the last release digest went out; at most one a week.</summary>
    public DateTimeOffset? LastDigestAt { get; private set; }

    public static Listener Create(string displayName, string email, string passwordHash, DateTimeOffset createdAt) =>
        new(Guid.NewGuid(), displayName.Trim(), NormaliseEmail(email), passwordHash, createdAt);

    public static string NormaliseEmail(string email) => email.Trim().ToLowerInvariant();

    public void ConfirmEmail(DateTimeOffset at) => EmailConfirmedAt ??= at;

    /// <summary>Saves Settings (L2-033 to L2-035, L2-049). A new email address must be confirmed again.</summary>
    public void UpdateSettings(string displayName, string email, bool autoplaySimilar, bool crossfade, string theme, bool notifyNewReleases, bool productNews)
    {
        DisplayName = displayName.Trim();
        var address = NormaliseEmail(email);
        if (address != Email)
        {
            Email = address;
            EmailConfirmedAt = null;
        }

        AutoplaySimilar = autoplaySimilar;
        Crossfade = crossfade;
        Theme = Themes.Parse(theme);
        NotifyNewReleases = notifyNewReleases;
        ProductNews = productNews;
    }

    public void DigestSent(DateTimeOffset at) => LastDigestAt = at;

    /// <summary>Sets a new password hash from a reset link (L2-055); the link also proves the address.</summary>
    public void ChangePassword(string passwordHash, DateTimeOffset at)
    {
        PasswordHash = passwordHash;
        ConfirmEmail(at);
    }
}

/// <summary>The Theme choices of Settings (L2-049).</summary>
public static class Themes
{
    public const string Device = "device";
    public const string Light = "light";
    public const string Dark = "dark";

    public static string Parse(string? theme) => theme is Light or Dark ? theme : Device;
}
