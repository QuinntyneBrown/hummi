using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Domain.Accounts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Accounts;

/// <summary>Everything Settings shows and saves (L2-033 to L2-035, L2-049).</summary>
public sealed record SettingsDto(
    string DisplayName,
    string Email,
    bool EmailConfirmed,
    bool AutoplaySimilar,
    bool Crossfade,
    string Theme,
    bool NotifyNewReleases,
    bool ProductNews)
{
    public static SettingsDto From(Listener l) =>
        new(l.DisplayName, l.Email, l.EmailConfirmed, l.AutoplaySimilar, l.Crossfade, l.Theme, l.NotifyNewReleases, l.ProductNews);
}

/// <summary>The signed-in listener's settings, read on every device at sign-in (L2-033 AC4).</summary>
public sealed record GetSettingsQuery(Guid ListenerId) : IRequest<Result<SettingsDto>>;

public sealed class GetSettingsQueryHandler(IHummiDbContext db) : IRequestHandler<GetSettingsQuery, Result<SettingsDto>>
{
    public async Task<Result<SettingsDto>> Handle(GetSettingsQuery request, CancellationToken cancellationToken)
    {
        var listener = await db.Listeners.AsNoTracking().SingleOrDefaultAsync(l => l.Id == request.ListenerId, cancellationToken);
        return listener is null ? AccountErrors.ListenerNotFound : SettingsDto.From(listener);
    }
}

/// <summary>
/// Save changes in Settings (L2-033 AC2, AC4). An empty display name or a bad or taken email answers 422 and
/// saves nothing. A new email is confirmed again with a fresh link, but sign-in uses it at once (ADR 0016).
/// </summary>
public sealed record UpdateSettingsCommand(
    Guid ListenerId,
    string DisplayName,
    string Email,
    bool AutoplaySimilar,
    bool Crossfade,
    string Theme,
    bool NotifyNewReleases,
    bool ProductNews) : IRequest<Result<SettingsDto>>;

public sealed class UpdateSettingsCommandHandler(IHummiDbContext db, IEmailSender email, IAppLinks links, TimeProvider clock)
    : IRequestHandler<UpdateSettingsCommand, Result<SettingsDto>>
{
    public async Task<Result<SettingsDto>> Handle(UpdateSettingsCommand request, CancellationToken cancellationToken)
    {
        var listener = await db.Listeners.SingleOrDefaultAsync(l => l.Id == request.ListenerId, cancellationToken);
        if (listener is null)
        {
            return AccountErrors.ListenerNotFound;
        }

        var errors = new Dictionary<string, FieldError>();
        if (string.IsNullOrWhiteSpace(request.DisplayName))
        {
            errors["displayName"] = new("REQUIRED", "Display name can’t be empty");
        }

        var address = Listener.NormaliseEmail(request.Email ?? string.Empty);
        if (!AccountErrors.LooksLikeEmail(address))
        {
            errors["email"] = new("INVALID_EMAIL", "That email address looks incomplete");
        }
        else if (address != listener.Email && await db.Listeners.AnyAsync(l => l.Email == address, cancellationToken))
        {
            errors["email"] = new("EMAIL_TAKEN", "That email is already in use");
        }

        if (errors.Count > 0)
        {
            return Error.Invalid("INVALID_SETTINGS", errors);
        }

        var changedEmail = address != listener.Email;
        listener.UpdateSettings(request.DisplayName!, address, request.AutoplaySimilar, request.Crossfade, request.Theme, request.NotifyNewReleases, request.ProductNews);
        string? secret = null;
        if (changedEmail)
        {
            secret = await ConfirmationEmail.IssueAsync(db, listener, clock.GetUtcNow(), cancellationToken);
        }

        await db.SaveChangesAsync(cancellationToken);
        if (secret is not null)
        {
            try
            {
                await email.SendAsync(ConfirmationEmail.Message(listener, links.VerifyEmail(secret)), cancellationToken);
            }
            catch (EmailNotSentException)
            {
                // The change is saved; the shell's banner offers Resend the email (L2-028 AC4).
            }
        }

        return SettingsDto.From(listener);
    }
}
