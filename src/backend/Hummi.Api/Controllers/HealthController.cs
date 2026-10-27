using Microsoft.AspNetCore.Mvc;

namespace Hummi.Api.Controllers;

/// <summary>Reports that the API process is up. Touches no dependency.</summary>
[ApiController]
[Route("api/health")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new HealthResponse("ok"));
}

/// <summary>Health body. Carries no version, hostname or configuration.</summary>
public sealed record HealthResponse(string Status);
