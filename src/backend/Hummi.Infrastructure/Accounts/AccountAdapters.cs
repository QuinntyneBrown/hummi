using System.Net.Mail;
using Hummi.Application.Abstractions;
using Microsoft.AspNetCore.Identity;

namespace Hummi.Infrastructure.Accounts;

/// <summary>ASP.NET Core Identity's PBKDF2 hasher behind the <see cref="IPasswordHasher"/> port.</summary>
public sealed class IdentityPasswordHasher : Application.Abstractions.IPasswordHasher
{
    private static readonly object Owner = new();
    private readonly PasswordHasher<object> hasher = new();

    public string Hash(string password) => hasher.HashPassword(Owner, password);

    public bool Verify(string hash, string password) =>
        hasher.VerifyHashedPassword(Owner, hash, password) != PasswordVerificationResult.Failed;
}

/// <summary>SMTP settings from <c>Email__Smtp__*</c> and <c>Email__From</c> in /opt/hummi/.env (ADR 0010).</summary>
public sealed class SmtpOptions
{
    public string Host { get; set; } = "localhost";

    public int Port { get; set; } = 25;

    public string? UserName { get; set; }

    public string? Password { get; set; }

    public bool EnableSsl { get; set; } = true;

    public string From { get; set; } = "Hummi <hello@hummi.fm>";
}

/// <summary>Hands account emails to the configured SMTP relay. Tests use a fake <see cref="IEmailSender"/>.</summary>
public sealed class SmtpEmailSender(SmtpOptions options) : IEmailSender
{
    public SmtpOptions Options { get; } = options;

    public async Task SendAsync(EmailMessage message, CancellationToken cancellationToken)
    {
        using var client = new SmtpClient(Options.Host, Options.Port) { EnableSsl = Options.EnableSsl };
        if (!string.IsNullOrEmpty(Options.UserName))
        {
            client.Credentials = new System.Net.NetworkCredential(Options.UserName, Options.Password);
        }

        using var mail = new MailMessage(new MailAddress(Options.From), new MailAddress(message.To))
        {
            Subject = message.Subject,
            Body = message.Body,
        };
        try
        {
            await client.SendMailAsync(mail, cancellationToken);
        }
        catch (Exception exception) when (exception is SmtpException or InvalidOperationException)
        {
            throw new EmailNotSentException(exception);
        }
    }
}

/// <summary>Absolute links into the web app at <c>App__BaseUrl</c>.</summary>
public sealed class AppLinks(Uri baseUrl) : IAppLinks
{
    public Uri VerifyEmail(string token) => new(baseUrl, $"verify-email?token={Uri.EscapeDataString(token)}");
}
