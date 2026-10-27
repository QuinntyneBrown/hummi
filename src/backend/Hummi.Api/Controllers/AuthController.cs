using Hummi.Api.Auth;
using Hummi.Api.Http;
using Hummi.Application.Accounts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Hummi.Api.Controllers;

/// <summary>
/// Sign up, email confirmation, sign in, refresh, sign out, password reset and the current listener (L2-027 to L2-031, L2-055).
/// The session lives in HttpOnly cookies written by <see cref="SessionCookies"/>; rate limited per client (ADR 0010).
/// </summary>
[ApiController]
[EnableRateLimiting(AuthSetup.AuthRateLimit)]
[Route("api/auth")]
public sealed class AuthController(ISender sender, SessionCookies cookies) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("sign-up")]
    public async Task<IActionResult> SignUp(SignUpRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new RegisterListenerCommand(request.DisplayName ?? string.Empty, request.Email ?? string.Empty, request.Password ?? string.Empty, request.AcceptedTerms), cancellationToken);
        return result.IsSuccess ? Accepted() : this.ToProblem(result.Error!);
    }

    [AllowAnonymous]
    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail(TokenRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new ConfirmEmailCommand(request.Token ?? string.Empty), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }

    /// <summary>Signed in: resends for the listener (the banner). Otherwise: for the owner of the given link.</summary>
    [AllowAnonymous]
    [HttpPost("resend-confirmation")]
    public async Task<IActionResult> ResendConfirmation(TokenRequest request, CancellationToken cancellationToken)
    {
        Guid? listenerId = User.Identity?.IsAuthenticated == true ? User.UserId() : null;
        var result = await sender.Send(new ResendConfirmationCommand(listenerId, request.Token), cancellationToken);
        return result.IsSuccess ? Accepted() : this.ToProblem(result.Error!);
    }

    [AllowAnonymous]
    [HttpPost("sign-in")]
    public async Task<IActionResult> SignIn(SignInRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new SignInCommand(request.Email ?? string.Empty, request.Password ?? string.Empty, request.KeepSignedIn), cancellationToken);
        return result.IsSuccess ? Session(result.Value!) : this.ToProblem(result.Error!);
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new RefreshSessionCommand(Request.Cookies[SessionCookies.RefreshCookie]), cancellationToken);
        if (!result.IsSuccess)
        {
            SessionCookies.Clear(Response);
            return this.ToProblem(result.Error!);
        }

        return Session(result.Value!);
    }

    [AllowAnonymous]
    [HttpPost("sign-out")]
    public async Task<IActionResult> SignOut(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new SignOutCommand(Request.Cookies[SessionCookies.RefreshCookie]), cancellationToken);
        if (!result.IsSuccess)
        {
            return this.ToProblem(result.Error!);
        }

        SessionCookies.Clear(Response);
        return NoContent();
    }

    /// <summary>202 whether or not the account exists (L2-030 AC4); 503 only when the email cannot be sent.</summary>
    [AllowAnonymous]
    [HttpPost("password-reset")]
    public async Task<IActionResult> RequestPasswordReset(PasswordResetRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new RequestPasswordResetCommand(request.Email ?? string.Empty), cancellationToken);
        return result.IsSuccess ? Accepted() : this.ToProblem(result.Error!);
    }

    [AllowAnonymous]
    [HttpPost("password-reset/confirm")]
    public async Task<IActionResult> ConfirmPasswordReset(NewPasswordRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new ResetPasswordCommand(request.Token ?? string.Empty, request.Password ?? string.Empty), cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblem(result.Error!);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetCurrentListenerQuery(User.UserId()), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }

    private OkObjectResult Session(SessionGrant grant)
    {
        cookies.Write(Response, new SignedIn(grant.ListenerId, grant.RefreshSecret, grant.Persistent ? grant.RefreshExpiresAt.UtcDateTime : null));
        return Ok(grant.Listener);
    }
}

public sealed record SignUpRequest(string? DisplayName, string? Email, string? Password, bool AcceptedTerms);

public sealed record TokenRequest(string? Token);

public sealed record SignInRequest(string? Email, string? Password, bool KeepSignedIn);

public sealed record PasswordResetRequest(string? Email);

public sealed record NewPasswordRequest(string? Token, string? Password);
