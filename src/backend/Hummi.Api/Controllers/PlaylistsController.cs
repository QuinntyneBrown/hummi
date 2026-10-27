using Hummi.Api.Auth;
using Hummi.Api.Http;
using Hummi.Application.Library;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hummi.Api.Controllers;

/// <summary>
/// Playlists (L2-020 to L2-023): create, read, rename, delete, append tracks and remove entries. Reading is
/// open to anyone for a public playlist; every change needs the owner's session (ADR 0013).
/// </summary>
[ApiController]
[Authorize]
[Route("api/playlists")]
public sealed class PlaylistsController(ISender sender) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(CreatePlaylistRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new CreatePlaylistCommand(User.UserId(), request.Name ?? string.Empty, request.IsPublic, request.TrackIds ?? []), cancellationToken);
        return result.IsSuccess ? StatusCode(StatusCodes.Status201Created, result.Value) : this.ToProblem(result.Error!);
    }

    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id, [FromQuery] string? share, CancellationToken cancellationToken)
    {
        Guid? listenerId = User.Identity?.IsAuthenticated == true ? User.UserId() : null;
        var result = await sender.Send(new GetPlaylistQuery(listenerId, id, share), cancellationToken);
        if (!result.IsSuccess)
        {
            return this.ToProblem(result.Error!);
        }

        if (listenerId is not null && !string.IsNullOrEmpty(share) && !result.Value!.IsOwner)
        {
            await sender.Send(new RecordPlaylistShareCommand(listenerId.Value, id, share), cancellationToken);
        }

        return Ok(result.Value);
    }

    [HttpPut("{id}")]
    public Task<IActionResult> Update(string id, UpdatePlaylistRequest request, CancellationToken cancellationToken) =>
        NoContentFor(new UpdatePlaylistCommand(User.UserId(), id, request.Name ?? string.Empty, request.IsPublic), cancellationToken);

    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(string id, CancellationToken cancellationToken) =>
        NoContentFor(new DeletePlaylistCommand(User.UserId(), id), cancellationToken);

    [HttpPost("{id}/tracks")]
    public async Task<IActionResult> AddTracks(string id, AddTracksRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new AddTracksToPlaylistCommand(User.UserId(), id, request.TrackIds ?? [], request.AllowDuplicates), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : this.ToProblem(result.Error!);
    }

    [HttpPost("{id}/entries/remove")]
    public Task<IActionResult> RemoveEntries(string id, RemoveEntriesRequest request, CancellationToken cancellationToken) =>
        NoContentFor(new RemovePlaylistEntriesCommand(User.UserId(), id, request.EntryIds ?? []), cancellationToken);

    private async Task<IActionResult> NoContentFor(IRequest<Application.Common.Result<Unit>> command, CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return result.IsSuccess ? NoContent() : this.ToProblem(result.Error!);
    }
}

public sealed record CreatePlaylistRequest(string? Name, bool IsPublic, IReadOnlyList<string>? TrackIds);

public sealed record UpdatePlaylistRequest(string? Name, bool IsPublic);

public sealed record AddTracksRequest(IReadOnlyList<string>? TrackIds, bool AllowDuplicates);

public sealed record RemoveEntriesRequest(IReadOnlyList<string>? EntryIds);
