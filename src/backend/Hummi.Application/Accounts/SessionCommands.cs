using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Domain.Accounts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Accounts;

/// <summary>Starts a session from email and password (L2-029). Any mismatch is one INVALID_CREDENTIALS error.</summary>
public sealed record SignInCommand(string Email, string Password, bool KeepSignedIn) : IRequest<Result<SessionGrant>>;

public sealed class SignInCommandHandler(IHummiDbContext db, IPasswordHasher hasher, TimeProvider clock) : IRequestHandler<SignInCommand, Result<SessionGrant>>
{
    public async Task<Result<SessionGrant>> Handle(SignInCommand request, CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, FieldError>();
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            errors["email"] = new FieldError("REQUIRED", "Enter the email you signed up with");
        }

        if (string.IsNullOrEmpty(request.Password))
        {
            errors["password"] = new FieldError("REQUIRED", "Enter your password");
        }

        if (errors.Count > 0)
        {
            return Error.Invalid("INVALID_SIGN_IN", errors);
        }

        var address = Listener.NormaliseEmail(request.Email);
        var listener = await db.Listeners.SingleOrDefaultAsync(l => l.Email == address, cancellationToken);
        if (listener is null || !hasher.Verify(listener.PasswordHash, request.Password))
        {
            return AccountErrors.InvalidCredentials;
        }

        return await Sessions.StartAsync(db, listener, request.KeepSignedIn, clock.GetUtcNow(), cancellationToken);
    }
}

/// <summary>Swaps an active refresh token for a new one with the same persistence; a used or revoked one answers 401.</summary>
public sealed record RefreshSessionCommand(string? RefreshSecret) : IRequest<Result<SessionGrant>>;

public sealed class RefreshSessionCommandHandler(IHummiDbContext db, TimeProvider clock) : IRequestHandler<RefreshSessionCommand, Result<SessionGrant>>
{
    public async Task<Result<SessionGrant>> Handle(RefreshSessionCommand request, CancellationToken cancellationToken)
    {
        var now = clock.GetUtcNow();
        var token = await Sessions.FindAsync(db, request.RefreshSecret, cancellationToken);
        var listener = token is null ? null : await db.Listeners.SingleOrDefaultAsync(l => l.Id == token.ListenerId, cancellationToken);
        if (token is null || listener is null || !token.IsActive(now))
        {
            return AccountErrors.SessionExpired;
        }

        token.Revoke(now);
        return await Sessions.StartAsync(db, listener, token.Persistent, now, cancellationToken);
    }
}

/// <summary>Ends the session on this device by revoking its refresh token (L2-031). Library data is untouched.</summary>
public sealed record SignOutCommand(string? RefreshSecret) : IRequest<Result<Unit>>;

public sealed class SignOutCommandHandler(IHummiDbContext db, TimeProvider clock) : IRequestHandler<SignOutCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(SignOutCommand request, CancellationToken cancellationToken)
    {
        var token = await Sessions.FindAsync(db, request.RefreshSecret, cancellationToken);
        if (token is not null)
        {
            token.Revoke(clock.GetUtcNow());
            await db.SaveChangesAsync(cancellationToken);
        }

        return Unit.Value;
    }
}

/// <summary>The signed-in listener for GET /api/auth/me.</summary>
public sealed record GetCurrentListenerQuery(Guid ListenerId) : IRequest<Result<ListenerDto>>;

public sealed class GetCurrentListenerQueryHandler(IHummiDbContext db) : IRequestHandler<GetCurrentListenerQuery, Result<ListenerDto>>
{
    public async Task<Result<ListenerDto>> Handle(GetCurrentListenerQuery request, CancellationToken cancellationToken)
    {
        var listener = await db.Listeners.AsNoTracking().SingleOrDefaultAsync(l => l.Id == request.ListenerId, cancellationToken);
        return listener is null ? AccountErrors.ListenerNotFound : ListenerDto.From(listener);
    }
}
