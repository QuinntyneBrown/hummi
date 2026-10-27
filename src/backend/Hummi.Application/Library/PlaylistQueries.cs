using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Application.Playback;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Library;

/// <summary>One entry of a playlist page; EntryId tells apart a track that appears twice.</summary>
public sealed record PlaylistEntryDto(string EntryId, TrackSummaryDto Track);

/// <summary>
/// A playlist page (L2-023 AC1): "{n} tracks · {duration} · {private|public}" and the entries in order.
/// IsOwner decides between the owner's actions and the read-only view (journey 11).
/// </summary>
public sealed record PlaylistDetailDto(
    string Id,
    string Name,
    bool IsPublic,
    bool IsOwner,
    string OwnerName,
    int TrackCount,
    int DurationSeconds,
    IReadOnlyList<PlaylistEntryDto> Entries);

/// <summary>A playlist for its owner, or a public one for anyone; a private one of someone else is 403.</summary>
public sealed record GetPlaylistQuery(Guid? ListenerId, string PlaylistId) : IRequest<Result<PlaylistDetailDto>>;

public sealed class GetPlaylistQueryHandler(IHummiDbContext db) : IRequestHandler<GetPlaylistQuery, Result<PlaylistDetailDto>>
{
    public async Task<Result<PlaylistDetailDto>> Handle(GetPlaylistQuery request, CancellationToken cancellationToken)
    {
        var playlist = Guid.TryParse(request.PlaylistId, out var id)
            ? await db.Playlists.AsNoTracking().Include(p => p.Entries).SingleOrDefaultAsync(p => p.Id == id, cancellationToken)
            : null;
        if (playlist is null)
        {
            return PlaylistErrors.NotFound;
        }

        var isOwner = playlist.OwnerId == request.ListenerId;
        if (!isOwner && !playlist.IsPublic)
        {
            return PlaylistErrors.Private;
        }

        var owner = await db.Listeners.Where(l => l.Id == playlist.OwnerId).Select(l => l.DisplayName).SingleAsync(cancellationToken);
        var ordered = playlist.Entries.OrderBy(e => e.Position).ToList();
        var trackIds = ordered.Select(e => e.TrackId).Distinct().ToList();
        var summaries = (await db.Tracks.AsNoTracking().Where(t => trackIds.Contains(t.Id) && !t.Withdrawn).ToSummaries().ToListAsync(cancellationToken))
            .ToDictionary(t => t.Id);
        var entries = ordered
            .Where(e => summaries.ContainsKey(e.TrackId.ToString()))
            .Select(e => new PlaylistEntryDto(e.Id.ToString(), summaries[e.TrackId.ToString()]))
            .ToList();

        return new PlaylistDetailDto(
            playlist.Id.ToString(),
            playlist.Name,
            playlist.IsPublic,
            isOwner,
            owner,
            entries.Count,
            entries.Sum(e => e.Track.DurationSeconds),
            entries);
    }
}

/// <summary>The listener's own playlists for Add to playlist, with whether each holds TrackId (L2-020 AC1).</summary>
public sealed record GetMyPlaylistsQuery(Guid ListenerId, string? TrackId) : IRequest<Result<IReadOnlyList<PlaylistChoiceDto>>>;

public sealed class GetMyPlaylistsQueryHandler(IHummiDbContext db) : IRequestHandler<GetMyPlaylistsQuery, Result<IReadOnlyList<PlaylistChoiceDto>>>
{
    public async Task<Result<IReadOnlyList<PlaylistChoiceDto>>> Handle(GetMyPlaylistsQuery request, CancellationToken cancellationToken)
    {
        var trackId = Guid.TryParse(request.TrackId, out var id) ? id : Guid.Empty;
        var choices = await db.Playlists.AsNoTracking()
            .Where(p => p.OwnerId == request.ListenerId)
            .OrderByDescending(p => p.CreatedAt).ThenBy(p => p.Name)
            .Select(p => new PlaylistChoiceDto(p.Id.ToString(), p.Name, p.Entries.Count, p.Entries.Any(e => e.TrackId == trackId)))
            .ToListAsync(cancellationToken);
        return choices;
    }
}
