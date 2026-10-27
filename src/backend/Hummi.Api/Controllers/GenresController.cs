using Hummi.Api.Http;
using Hummi.Application.Discovery;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hummi.Api.Controllers;

/// <summary>Browse and the genre pages, for any visitor (L2-003, L2-004).</summary>
[ApiController]
[AllowAnonymous]
[Route("api/genres")]
public sealed class GenresController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetGenreDirectoryQuery(), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }

    [HttpGet("{slug}/tracks")]
    public async Task<IActionResult> Tracks(
        string slug,
        [FromQuery] string sort = GenreTrackSort.Newest,
        [FromQuery] int page = 1,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetGenreTracksQuery(slug, sort, page), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }
}
