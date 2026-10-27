using Hummi.Api.Http;
using Hummi.Application.Catalogue;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hummi.Api.Controllers;

/// <summary>Track pages and their licence pages, for any visitor (L2-008, L2-009, L2-012).</summary>
[ApiController]
[AllowAnonymous]
[Route("api/tracks")]
public sealed class TracksController(ISender sender) : ControllerBase
{
    [HttpGet("{slug}")]
    public async Task<IActionResult> Get(string slug, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetTrackQuery(slug), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }
}

/// <summary>Artist pages, for any visitor (L2-010).</summary>
[ApiController]
[AllowAnonymous]
[Route("api/artists")]
public sealed class ArtistsController(ISender sender) : ControllerBase
{
    [HttpGet("{slug}")]
    public async Task<IActionResult> Get(string slug, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetArtistQuery(slug), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }
}

/// <summary>Album pages, for any visitor (L2-011).</summary>
[ApiController]
[AllowAnonymous]
[Route("api/albums")]
public sealed class AlbumsController(ISender sender) : ControllerBase
{
    [HttpGet("{slug}")]
    public async Task<IActionResult> Get(string slug, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAlbumQuery(slug), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }
}
