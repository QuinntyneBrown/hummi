using System.Security.Cryptography;
using System.Text;
using Hummi.Api.Auth;
using Hummi.Api.Http;
using Hummi.Application.Catalogue;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hummi.Api.Controllers;

/// <summary>
/// Track reports (L2-038). Listeners file them; reviewers, who work outside the product, list open reports
/// and resolve them with the shared key in <c>Reports:ReviewerKey</c> sent as <c>X-Reviewer-Key</c> (ADR 0018).
/// Without a configured key the reviewer endpoints answer 404.
/// </summary>
[ApiController]
public sealed class ReportsController(ISender sender, IConfiguration configuration) : ControllerBase
{
    public const string ReviewerKeyHeader = "X-Reviewer-Key";

    [Authorize]
    [HttpPost("api/tracks/{trackId}/reports")]
    public async Task<IActionResult> Report(string trackId, ReportRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new ReportTrackCommand(User.UserId(), trackId, request.Reason, request.Details), cancellationToken);
        return result.IsSuccess ? StatusCode(StatusCodes.Status201Created, result.Value) : this.ToProblem(result.Error!);
    }

    [AllowAnonymous]
    [HttpGet("api/reports")]
    public async Task<IActionResult> Open(CancellationToken cancellationToken)
    {
        if (!IsReviewer())
        {
            return NotFound();
        }

        var result = await sender.Send(new GetOpenReportsQuery(), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }

    [AllowAnonymous]
    [HttpPost("api/reports/{reportId}/resolve")]
    public async Task<IActionResult> Resolve(string reportId, ResolveRequest request, CancellationToken cancellationToken)
    {
        if (!IsReviewer())
        {
            return NotFound();
        }

        var result = await sender.Send(new ResolveReportCommand(reportId, request.Upheld, request.Outcome ?? string.Empty), cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblem(result.Error!);
    }

    private bool IsReviewer()
    {
        var key = configuration["Reports:ReviewerKey"];
        var sent = Request.Headers[ReviewerKeyHeader].ToString();
        return !string.IsNullOrEmpty(key)
            && CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(key), Encoding.UTF8.GetBytes(sent));
    }
}

public sealed record ReportRequest(string? Reason, string? Details);

public sealed record ResolveRequest(bool Upheld, string? Outcome);
