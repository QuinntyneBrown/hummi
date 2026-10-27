using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Domain.Accounts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Accounts;

/// <summary>Creates an unconfirmed account and emails a 24-hour confirmation link (L2-027).</summary>
public sealed record RegisterListenerCommand(string DisplayName, string Email, string Password, bool AcceptedTerms) : IRequest<Result<Unit>>;

public sealed class RegisterListenerCommandHandler(IHummiDbContext db, IPasswordHasher hasher, IEmailSender email, IAppLinks links, TimeProvider clock)
    : IRequestHandler<RegisterListenerCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(RegisterListenerCommand request, CancellationToken cancellationToken)
    {
        var errors = Validate(request);
        if (errors.Count > 0)
        {
            return Error.Invalid("INVALID_SIGN_UP", errors);
        }

        // An address that already has an account gets the same answer, so sign-up never reveals who is registered (ADR 0010).
        var address = Listener.NormaliseEmail(request.Email);
        if (await db.Listeners.AnyAsync(l => l.Email == address, cancellationToken))
        {
            return Unit.Value;
        }

        var now = clock.GetUtcNow();
        var listener = Listener.Create(request.DisplayName, request.Email, hasher.Hash(request.Password), now);
        db.Listeners.Add(listener);
        var secret = await ConfirmationEmail.IssueAsync(db, listener, now, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        try
        {
            await email.SendAsync(ConfirmationEmail.Message(listener, links.VerifyEmail(secret)), cancellationToken);
        }
        catch (EmailNotSentException)
        {
            // Nothing stays saved (L2-027 AC5): an account nobody can confirm is removed with its token.
            db.EmailTokens.RemoveRange(db.EmailTokens.Local.Where(t => t.ListenerId == listener.Id).ToList());
            db.Listeners.Remove(listener);
            await db.SaveChangesAsync(CancellationToken.None);
            return AccountErrors.AccountNotCreated;
        }

        return Unit.Value;
    }

    private static Dictionary<string, FieldError> Validate(RegisterListenerCommand request)
    {
        var errors = new Dictionary<string, FieldError>();
        if (string.IsNullOrWhiteSpace(request.DisplayName))
        {
            errors["displayName"] = new FieldError("REQUIRED", "Enter a display name");
        }

        if (!AccountErrors.LooksLikeEmail(request.Email ?? string.Empty))
        {
            errors["email"] = new FieldError("INVALID_EMAIL", "That email address looks incomplete");
        }

        if ((request.Password ?? string.Empty).Length < Listener.MinimumPasswordLength)
        {
            errors["password"] = new FieldError("TOO_SHORT", "Use at least 10 characters");
        }

        if (!request.AcceptedTerms)
        {
            errors["acceptedTerms"] = new FieldError("REQUIRED", "Agree to the terms to continue");
        }

        return errors;
    }
}
