using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Domain.Accounts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Accounts;

/// <summary>Redeems a confirmation link (L2-028 AC2, AC3). An unknown, used or expired link answers 410 LINK_EXPIRED.</summary>
public sealed record ConfirmEmailCommand(string Token) : IRequest<Result<ListenerDto>>;

public sealed class ConfirmEmailCommandHandler(IHummiDbContext db, TimeProvider clock) : IRequestHandler<ConfirmEmailCommand, Result<ListenerDto>>
{
    public async Task<Result<ListenerDto>> Handle(ConfirmEmailCommand request, CancellationToken cancellationToken)
    {
        var hash = SecretToken.Hash(request.Token ?? string.Empty);
        var token = await db.EmailTokens.SingleOrDefaultAsync(t => t.TokenHash == hash && t.Purpose == EmailTokenPurpose.ConfirmEmail, cancellationToken);
        var listener = token is null ? null : await db.Listeners.SingleOrDefaultAsync(l => l.Id == token.ListenerId, cancellationToken);
        var now = clock.GetUtcNow();
        if (token is null || listener is null || token.Redeem(now) != TokenRedemption.Redeemed)
        {
            return AccountErrors.LinkExpired;
        }

        listener.ConfirmEmail(now);
        await db.SaveChangesAsync(cancellationToken);
        return ListenerDto.From(listener);
    }
}

/// <summary>
/// Sends a fresh confirmation link (L2-028 AC3, AC4): for the signed-in listener from the shell banner, or
/// for the owner of an expired link from Send a new link. Confirmed or unknown accounts get nothing, silently.
/// </summary>
public sealed record ResendConfirmationCommand(Guid? ListenerId, string? Token) : IRequest<Result<Unit>>;

public sealed class ResendConfirmationCommandHandler(IHummiDbContext db, IEmailSender email, IAppLinks links, TimeProvider clock)
    : IRequestHandler<ResendConfirmationCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(ResendConfirmationCommand request, CancellationToken cancellationToken)
    {
        var listenerId = request.ListenerId;
        if (listenerId is null && !string.IsNullOrEmpty(request.Token))
        {
            var hash = SecretToken.Hash(request.Token);
            listenerId = await db.EmailTokens.Where(t => t.TokenHash == hash).Select(t => (Guid?)t.ListenerId).SingleOrDefaultAsync(cancellationToken);
        }

        var listener = listenerId is null ? null : await db.Listeners.SingleOrDefaultAsync(l => l.Id == listenerId, cancellationToken);
        if (listener is null || listener.EmailConfirmed)
        {
            return Unit.Value;
        }

        var secret = await ConfirmationEmail.IssueAsync(db, listener, clock.GetUtcNow(), cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        try
        {
            await email.SendAsync(ConfirmationEmail.Message(listener, links.VerifyEmail(secret)), cancellationToken);
        }
        catch (EmailNotSentException)
        {
            return AccountErrors.EmailNotSent;
        }

        return Unit.Value;
    }
}
