using Hummi.Api.Auth;
using Hummi.Api.Http;
using Hummi.Application.Library;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hummi.Api.Controllers;

/// <summary>The signed-in listener's notifications (L2-036, L2-037): the list, the unread count and Mark all as read.</summary>
[ApiController]
[Authorize]
[Route("api/me/notifications")]
public sealed class NotificationsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetNotificationsQuery(User.UserId()), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetUnreadCountQuery(User.UserId()), cancellationToken);
        return result.IsSuccess ? Ok(new { unread = result.Value }) : this.ToProblem(result.Error!);
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new MarkAllNotificationsReadCommand(User.UserId()), cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblem(result.Error!);
    }
}
