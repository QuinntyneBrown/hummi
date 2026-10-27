using Hummi.Api.Auth;
using Hummi.Api.Http;
using Hummi.Application.Library;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hummi.Api.Controllers;

/// <summary>
/// The signed-in listener's library (L2-018, L2-019): idempotent PUT and DELETE for likes and follows,
/// answering 204, and the whole library in one read (ADR 0012).
/// </summary>
[ApiController]
[Authorize]
[Route("api/me")]
public sealed class LibraryController(ISender sender) : ControllerBase
{
    [HttpGet("library")]
    public async Task<IActionResult> Library(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetLibraryQuery(User.UserId()), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }

    [HttpPut("likes/{trackId}")]
    public Task<IActionResult> Like(string trackId, CancellationToken cancellationToken) =>
        Send(new SetTrackLikeCommand(User.UserId(), trackId, true), cancellationToken);

    [HttpDelete("likes/{trackId}")]
    public Task<IActionResult> Unlike(string trackId, CancellationToken cancellationToken) =>
        Send(new SetTrackLikeCommand(User.UserId(), trackId, false), cancellationToken);

    [HttpPut("follows/{artistSlug}")]
    public Task<IActionResult> Follow(string artistSlug, CancellationToken cancellationToken) =>
        Send(new SetArtistFollowCommand(User.UserId(), artistSlug, true), cancellationToken);

    [HttpDelete("follows/{artistSlug}")]
    public Task<IActionResult> Unfollow(string artistSlug, CancellationToken cancellationToken) =>
        Send(new SetArtistFollowCommand(User.UserId(), artistSlug, false), cancellationToken);

    private async Task<IActionResult> Send(IRequest<Application.Common.Result<Unit>> command, CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblem(result.Error!);
    }
}
