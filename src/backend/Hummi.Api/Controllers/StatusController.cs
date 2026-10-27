using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hummi.Api.Controllers;

/// <summary>
/// Page-wide status for the banners (L2-042 AC2): the scheduled maintenance window from <c>Status:Maintenance</c>
/// (for example "Sunday 1 Nov, 02:00 to 02:30 UTC"), or null when none is scheduled (ADR 0019).
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("api/status")]
public sealed class StatusController(IConfiguration configuration) : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        var window = configuration["Status:Maintenance"];
        return Ok(new StatusResponse(string.IsNullOrWhiteSpace(window) ? null : window.Trim()));
    }
}

public sealed record StatusResponse(string? Maintenance);

/// <summary>
/// Records a page that could not render in the browser (L2-046 AC2), so the team is told: logged as an error
/// with the page's path. Messages are cut to <see cref="MaxLength"/> characters.
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("api/client-errors")]
public sealed class ClientErrorsController(ILogger<ClientErrorsController> logger) : ControllerBase
{
    public const int MaxLength = 2000;

    [HttpPost]
    public IActionResult Record(ClientErrorRequest request)
    {
        var message = Cut(request.Message);
        var path = Cut(request.Path);
        logger.LogError("A page failed to render at {Path}: {Message}", path, message);
        return NoContent();
    }

    private static string Cut(string? value) =>
        (value ?? string.Empty).Length > MaxLength ? value![..MaxLength] : value ?? string.Empty;
}

public sealed record ClientErrorRequest(string? Message, string? Path);
