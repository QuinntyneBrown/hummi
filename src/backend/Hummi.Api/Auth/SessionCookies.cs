using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Hummi.Api.Auth;

/// <summary>Session settings. The signing key comes from configuration, never source.</summary>
public sealed class AuthOptions
{
    public string SigningKey { get; set; } = string.Empty;

    public string Issuer { get; set; } = "Hummi";

    /// <summary>Requests per minute each client may make to /api/auth (ADR 0010).</summary>
    public int RequestsPerMinute { get; set; } = 20;

    public SymmetricSecurityKey Key => new(Encoding.UTF8.GetBytes(SigningKey));
}

/// <summary>
/// The outcome of a sign-in: who signed in and the opaque refresh token to hand the browser. A null
/// expiry makes both cookies end with the browser ("Keep me signed in" unchecked, L2-029 AC5).
/// </summary>
public sealed record SignedIn(Guid UserId, string RefreshToken, DateTime? RefreshExpiresAt);

/// <summary>
/// Issues the 15-minute access token and writes both session cookies as HttpOnly, Secure and
/// SameSite=Strict, so no token ever reaches web storage.
/// </summary>
public sealed class SessionCookies(IOptions<AuthOptions> options, TimeProvider clock)
{
    public const string AccessCookie = "hm_access";
    public const string RefreshCookie = "hm_refresh";
    public const string RefreshPath = "/api/auth";
    public static readonly TimeSpan AccessLifetime = TimeSpan.FromMinutes(15);

    public void Write(HttpResponse response, SignedIn session)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        var token = new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = options.Value.Issuer,
            Audience = options.Value.Issuer,
            Subject = new ClaimsIdentity([new Claim(JwtRegisteredClaimNames.Sub, session.UserId.ToString())]),
            IssuedAt = now,
            NotBefore = now,
            Expires = now + AccessLifetime,
            SigningCredentials = new SigningCredentials(options.Value.Key, SecurityAlgorithms.HmacSha256),
        });
        response.Cookies.Append(AccessCookie, token, Cookie("/", session.RefreshExpiresAt is null ? null : now + AccessLifetime));
        response.Cookies.Append(RefreshCookie, session.RefreshToken, Cookie(RefreshPath, session.RefreshExpiresAt));
    }

    public static void Clear(HttpResponse response)
    {
        response.Cookies.Delete(AccessCookie, Cookie("/", null));
        response.Cookies.Delete(RefreshCookie, Cookie(RefreshPath, null));
    }

    private static CookieOptions Cookie(string path, DateTime? expires) => new()
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Strict,
        Path = path,
        Expires = expires,
        IsEssential = true,
    };
}

public static class ClaimsPrincipalExtensions
{
    public static Guid UserId(this ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? user.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
