using Hummi.Api.Auth;
using Hummi.Api.Http;
using Hummi.Application.Library;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hummi.Api.Controllers;

/// <summary>Share links (L2-025, L2-026): get or create the link of a track or playlist, and resolve a code. Anonymous (ADR 0014).</summary>
[ApiController]
[AllowAnonymous]
[Route("api/shares")]
public sealed class SharesController(ISender sender) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Share(ShareRequest request, CancellationToken cancellationToken)
    {
        Guid? listenerId = User.Identity?.IsAuthenticated == true ? User.UserId() : null;
        var result = await sender.Send(new GetOrCreateShareLinkCommand(listenerId, request.Type ?? string.Empty, request.Id ?? string.Empty), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }

    [HttpGet("{code}")]
    public async Task<IActionResult> Resolve(string code, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new ResolveShareLinkQuery(code), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }
}

public sealed record ShareRequest(string? Type, string? Id);
