using Hummi.Api.Auth;
using Hummi.Api.Http;
using Hummi.Application.Playback;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hummi.Api.Controllers;

/// <summary>Home's shelves for any visitor (ADR 0005).</summary>
[ApiController]
[AllowAnonymous]
[Route("api/home")]
public sealed class HomeController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetHomeQuery(), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }
}

/// <summary>Records that playback started; signed-in and anonymous callers alike (L2-014).</summary>
[ApiController]
[AllowAnonymous]
[Route("api/plays")]
public sealed class PlaysController(ISender sender) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Post(RecordPlayRequest request, CancellationToken cancellationToken)
    {
        Guid? listenerId = User.Identity?.IsAuthenticated == true ? User.UserId() : null;
        var result = await sender.Send(new RecordPlayCommand(request.TrackId, listenerId), cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblem(result.Error!);
    }
}

public sealed record RecordPlayRequest(Guid TrackId);

/// <summary>Streams track audio from the media volume by byte range; no account needed (L2-013, L2-014).</summary>
[ApiController]
[AllowAnonymous]
[Route("media/tracks")]
public sealed class MediaController(ISender sender) : ControllerBase
{
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetTrackStreamQuery(id), cancellationToken);
        return result.IsSuccess
            ? File(result.Value!.Content, result.Value.ContentType, enableRangeProcessing: true)
            : this.ToProblem(result.Error!);
    }
}
