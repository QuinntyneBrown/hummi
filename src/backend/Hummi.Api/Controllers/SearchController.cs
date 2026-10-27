using Hummi.Api.Http;
using Hummi.Application.Search;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hummi.Api.Controllers;

/// <summary>Search over songs and artists, for any visitor (L2-006, L2-007).</summary>
[ApiController]
[AllowAnonymous]
[Route("api/search")]
public sealed class SearchController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? q, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new SearchCatalogueQuery(q), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }
}
