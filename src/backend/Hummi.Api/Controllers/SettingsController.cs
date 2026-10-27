using Hummi.Api.Auth;
using Hummi.Api.Http;
using Hummi.Application.Accounts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hummi.Api.Controllers;

/// <summary>The signed-in listener's Settings (L2-033 to L2-035, L2-049), stored on the server so every device agrees.</summary>
[ApiController]
[Authorize]
[Route("api/me/settings")]
public sealed class SettingsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetSettingsQuery(User.UserId()), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }

    [HttpPut]
    public async Task<IActionResult> Update(SettingsRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new UpdateSettingsCommand(
                User.UserId(),
                request.DisplayName ?? string.Empty,
                request.Email ?? string.Empty,
                request.AutoplaySimilar,
                request.Crossfade,
                request.Theme ?? string.Empty,
                request.NotifyNewReleases,
                request.ProductNews),
            cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }
}

public sealed record SettingsRequest(
    string? DisplayName,
    string? Email,
    bool AutoplaySimilar,
    bool Crossfade,
    string? Theme,
    bool NotifyNewReleases,
    bool ProductNews);
