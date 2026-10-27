using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Domain.Accounts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Accounts;

/// <summary>
/// Emails a 1-hour reset link (L2-030 AC4, AC5). Succeeds the same way whether or not the account exists;
/// only an email-delivery failure for a real account answers 503 (ADR 0011).
/// </summary>
public sealed record RequestPasswordResetCommand(string Email) : IRequest<Result<Unit>>;

public sealed class RequestPasswordResetCommandHandler(IHummiDbContext db, IEmailSender email, IAppLinks links, TimeProvider clock)
    : IRequestHandler<RequestPasswordResetCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(RequestPasswordResetCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return Error.Invalid("INVALID_PASSWORD_RESET", new Dictionary<string, FieldError>
            {
                ["email"] = new("REQUIRED", "Enter the email you signed up with"),
            });
        }

        var address = Listener.NormaliseEmail(request.Email);
        var listener = await db.Listeners.SingleOrDefaultAsync(l => l.Email == address, cancellationToken);
        if (listener is null)
        {
            return Unit.Value;
        }

        var now = clock.GetUtcNow();
        var open = await db.EmailTokens
            .Where(t => t.ListenerId == listener.Id && t.Purpose == EmailTokenPurpose.ResetPassword && t.UsedAt == null)
            .ToListAsync(cancellationToken);
        open.ForEach(t => t.Invalidate(now));
        var (token, secret) = EmailToken.Issue(listener.Id, EmailTokenPurpose.ResetPassword, now);
        db.EmailTokens.Add(token);
        await db.SaveChangesAsync(cancellationToken);
        try
        {
            await email.SendAsync(Message(listener, links.NewPassword(secret)), cancellationToken);
        }
        catch (EmailNotSentException)
        {
            return AccountErrors.EmailNotSent;
        }

        return Unit.Value;
    }

    private static EmailMessage Message(Listener listener, Uri link) => new(
        listener.Email,
        "Reset your Hummi password",
        $"Hi {listener.DisplayName},{Environment.NewLine}{Environment.NewLine}"
        + $"Open this link to choose a new password. It works for 1 hour:{Environment.NewLine}{link}{Environment.NewLine}{Environment.NewLine}"
        + "If you didn’t ask to reset your password, ignore this email.");
}

/// <summary>
/// Redeems a reset link with a new password (L2-055). The password is checked first so a short one keeps the
/// link; an unknown, used or expired link answers 410 LINK_EXPIRED. Every session of the listener ends.
/// </summary>
public sealed record ResetPasswordCommand(string Token, string Password) : IRequest<Result<Unit>>;

public sealed class ResetPasswordCommandHandler(IHummiDbContext db, IPasswordHasher hasher, TimeProvider clock)
    : IRequestHandler<ResetPasswordCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        if ((request.Password ?? string.Empty).Length < Listener.MinimumPasswordLength)
        {
            return Error.Invalid("INVALID_NEW_PASSWORD", new Dictionary<string, FieldError>
            {
                ["password"] = new("TOO_SHORT", "Use at least 10 characters"),
            });
        }

        var hash = SecretToken.Hash(request.Token ?? string.Empty);
        var token = await db.EmailTokens.SingleOrDefaultAsync(t => t.TokenHash == hash && t.Purpose == EmailTokenPurpose.ResetPassword, cancellationToken);
        var listener = token is null ? null : await db.Listeners.SingleOrDefaultAsync(l => l.Id == token.ListenerId, cancellationToken);
        var now = clock.GetUtcNow();
        if (token is null || listener is null || token.Redeem(now) != TokenRedemption.Redeemed)
        {
            return AccountErrors.LinkExpired;
        }

        listener.ChangePassword(hasher.Hash(request.Password!), now);
        var sessions = await db.RefreshTokens.Where(t => t.ListenerId == listener.Id && t.RevokedAt == null).ToListAsync(cancellationToken);
        sessions.ForEach(t => t.Revoke(now));
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
