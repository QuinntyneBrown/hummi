using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Domain.Library;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Library;

/// <summary>The playlist failures; the name messages match the New playlist form (L2-021).</summary>
public static class PlaylistErrors
{
    public static readonly Error NotFound = Error.NotFound("PLAYLIST_NOT_FOUND", "This playlist isn’t on Hummi");

    public static readonly Error NotOwner = new(403, "FORBIDDEN", "Only the owner can change this playlist");

    public static readonly Error Private = new(403, "FORBIDDEN", "This playlist is private");

    public static Error AlreadyInPlaylist(string title, string playlist) =>
        new(409, "ALREADY_IN_PLAYLIST", $"“{title}” is in {playlist}");

    /// <summary>The trimmed name, or the 422 for an empty or too long one (L2-021 AC3, AC4).</summary>
    public static Result<string> CheckName(string? name)
    {
        var parsed = PlaylistName.Parse(name);
        if (parsed is not null)
        {
            return parsed;
        }

        var message = string.IsNullOrWhiteSpace(name) ? "Give your playlist a name" : "Use up to 60 characters";
        return Error.Invalid("INVALID_PLAYLIST", new Dictionary<string, FieldError> { ["name"] = new("INVALID_NAME", message) });
    }

    /// <summary>Loads a playlist with its entries for a change by its owner.</summary>
    internal static async Task<Result<Playlist>> OwnedAsync(IHummiDbContext db, Guid listenerId, string playlistId, CancellationToken cancellationToken)
    {
        var playlist = Guid.TryParse(playlistId, out var id)
            ? await db.Playlists.Include(p => p.Entries).SingleOrDefaultAsync(p => p.Id == id, cancellationToken)
            : null;
        if (playlist is null)
        {
            return NotFound;
        }

        return playlist.OwnerId == listenerId ? playlist : NotOwner;
    }

    internal static async Task<List<Guid>?> TrackIdsAsync(IHummiDbContext db, IEnumerable<string> trackIds, CancellationToken cancellationToken)
    {
        var ids = new List<Guid>();
        foreach (var raw in trackIds)
        {
            if (!Guid.TryParse(raw, out var id))
            {
                return null;
            }

            ids.Add(id);
        }

        var distinct = ids.Distinct().ToList();
        var known = await db.Tracks.CountAsync(t => distinct.Contains(t.Id), cancellationToken);
        return known == distinct.Count ? ids : null;
    }
}

/// <summary>A playlist the listener can pick, with its count and whether it holds the track (L2-020 AC1).</summary>
public sealed record PlaylistChoiceDto(string Id, string Name, int TrackCount, bool ContainsTrack);

/// <summary>Where the track landed: "“{title}” is now track {n}." (L2-020 AC2).</summary>
public sealed record PlaylistPositionDto(string Id, string Name, int Position);

public sealed record MembershipChangeDto(IReadOnlyList<PlaylistPositionDto> Added, IReadOnlyList<string> Removed);

/// <summary>Creates a playlist, private unless public (L2-021 AC2); TrackIds go in it at once (L2-020 AC5).</summary>
public sealed record CreatePlaylistCommand(Guid ListenerId, string Name, bool IsPublic, IReadOnlyList<string> TrackIds) : IRequest<Result<PlaylistPositionDto>>;

public sealed class CreatePlaylistCommandHandler(IHummiDbContext db, TimeProvider clock) : IRequestHandler<CreatePlaylistCommand, Result<PlaylistPositionDto>>
{
    public async Task<Result<PlaylistPositionDto>> Handle(CreatePlaylistCommand request, CancellationToken cancellationToken)
    {
        var name = PlaylistErrors.CheckName(request.Name);
        if (!name.IsSuccess)
        {
            return name.Error!;
        }

        var trackIds = await PlaylistErrors.TrackIdsAsync(db, request.TrackIds ?? [], cancellationToken);
        if (trackIds is null)
        {
            return Playback.PlaybackErrors.TrackNotFound;
        }

        var now = clock.GetUtcNow();
        var playlist = Playlist.Create(request.ListenerId, name.Value!, request.IsPublic, now);
        var position = 0;
        trackIds.ForEach(t => position = playlist.AddTrack(t, now));
        db.Playlists.Add(playlist);
        await db.SaveChangesAsync(cancellationToken);
        return new PlaylistPositionDto(playlist.Id.ToString(), playlist.Name, position);
    }
}

/// <summary>Renames a playlist and sets its visibility (L2-021 AC5); only the owner may.</summary>
public sealed record UpdatePlaylistCommand(Guid ListenerId, string PlaylistId, string Name, bool IsPublic) : IRequest<Result<Unit>>;

public sealed class UpdatePlaylistCommandHandler(IHummiDbContext db) : IRequestHandler<UpdatePlaylistCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(UpdatePlaylistCommand request, CancellationToken cancellationToken)
    {
        var name = PlaylistErrors.CheckName(request.Name);
        if (!name.IsSuccess)
        {
            return name.Error!;
        }

        var playlist = await PlaylistErrors.OwnedAsync(db, request.ListenerId, request.PlaylistId, cancellationToken);
        if (!playlist.IsSuccess)
        {
            return playlist.Error!;
        }

        playlist.Value!.Rename(name.Value!, request.IsPublic);
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

/// <summary>Deletes a playlist and its entries; the tracks stay on Hummi (L2-022 AC3).</summary>
public sealed record DeletePlaylistCommand(Guid ListenerId, string PlaylistId) : IRequest<Result<Unit>>;

public sealed class DeletePlaylistCommandHandler(IHummiDbContext db) : IRequestHandler<DeletePlaylistCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(DeletePlaylistCommand request, CancellationToken cancellationToken)
    {
        var playlist = await PlaylistErrors.OwnedAsync(db, request.ListenerId, request.PlaylistId, cancellationToken);
        if (!playlist.IsSuccess)
        {
            return playlist.Error!;
        }

        db.Playlists.Remove(playlist.Value!);
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

/// <summary>
/// Save in Add to playlist (L2-020 AC2, AC4): the track ends up in exactly the listed playlists of the
/// listener, in one save. A playlist that is not the listener's fails the whole change.
/// </summary>
public sealed record SetTrackMembershipCommand(Guid ListenerId, string TrackId, IReadOnlyList<string> PlaylistIds) : IRequest<Result<MembershipChangeDto>>;

public sealed class SetTrackMembershipCommandHandler(IHummiDbContext db, TimeProvider clock) : IRequestHandler<SetTrackMembershipCommand, Result<MembershipChangeDto>>
{
    public async Task<Result<MembershipChangeDto>> Handle(SetTrackMembershipCommand request, CancellationToken cancellationToken)
    {
        var trackIds = await PlaylistErrors.TrackIdsAsync(db, [request.TrackId], cancellationToken);
        if (trackIds is null)
        {
            return Playback.PlaybackErrors.TrackNotFound;
        }

        var wanted = new HashSet<Guid>();
        foreach (var raw in request.PlaylistIds ?? [])
        {
            if (!Guid.TryParse(raw, out var id))
            {
                return PlaylistErrors.NotFound;
            }

            wanted.Add(id);
        }

        var trackId = trackIds[0];
        var targets = await db.Playlists.Include(p => p.Entries)
            .Where(p => wanted.Contains(p.Id) || (p.OwnerId == request.ListenerId && p.Entries.Any(e => e.TrackId == trackId)))
            .ToListAsync(cancellationToken);
        if (targets.Count(p => wanted.Contains(p.Id)) != wanted.Count)
        {
            return PlaylistErrors.NotFound;
        }

        if (targets.Any(p => p.OwnerId != request.ListenerId))
        {
            return PlaylistErrors.NotOwner;
        }

        var now = clock.GetUtcNow();
        var added = new List<PlaylistPositionDto>();
        var removed = new List<string>();
        foreach (var playlist in targets)
        {
            if (wanted.Contains(playlist.Id) && !playlist.Contains(trackId))
            {
                added.Add(new PlaylistPositionDto(playlist.Id.ToString(), playlist.Name, playlist.AddTrack(trackId, now)));
            }
            else if (!wanted.Contains(playlist.Id))
            {
                playlist.RemoveTrack(trackId);
                removed.Add(playlist.Id.ToString());
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        return new MembershipChangeDto(added, removed);
    }
}

/// <summary>
/// Appends tracks to one playlist (Add to another playlist, L2-023 AC4). A single track already there
/// answers 409 ALREADY_IN_PLAYLIST unless AllowDuplicates, the "Add again" of L2-020 AC6.
/// </summary>
public sealed record AddTracksToPlaylistCommand(Guid ListenerId, string PlaylistId, IReadOnlyList<string> TrackIds, bool AllowDuplicates) : IRequest<Result<PlaylistPositionDto>>;

public sealed class AddTracksToPlaylistCommandHandler(IHummiDbContext db, TimeProvider clock) : IRequestHandler<AddTracksToPlaylistCommand, Result<PlaylistPositionDto>>
{
    public async Task<Result<PlaylistPositionDto>> Handle(AddTracksToPlaylistCommand request, CancellationToken cancellationToken)
    {
        var playlist = await PlaylistErrors.OwnedAsync(db, request.ListenerId, request.PlaylistId, cancellationToken);
        if (!playlist.IsSuccess)
        {
            return playlist.Error!;
        }

        var trackIds = await PlaylistErrors.TrackIdsAsync(db, request.TrackIds ?? [], cancellationToken);
        if (trackIds is null || trackIds.Count == 0)
        {
            return Playback.PlaybackErrors.TrackNotFound;
        }

        var p = playlist.Value!;
        var fresh = request.AllowDuplicates ? trackIds : trackIds.Where(t => !p.Contains(t)).ToList();
        if (fresh.Count == 0)
        {
            var title = await db.Tracks.Where(t => t.Id == trackIds[0]).Select(t => t.Title).SingleAsync(cancellationToken);
            return PlaylistErrors.AlreadyInPlaylist(title, p.Name);
        }

        var now = clock.GetUtcNow();
        var position = 0;
        fresh.ForEach(t => position = p.AddTrack(t, now));
        await db.SaveChangesAsync(cancellationToken);
        return new PlaylistPositionDto(p.Id.ToString(), p.Name, position);
    }
}

/// <summary>Remove from playlist for the selected entries (L2-023 AC4).</summary>
public sealed record RemovePlaylistEntriesCommand(Guid ListenerId, string PlaylistId, IReadOnlyList<string> EntryIds) : IRequest<Result<Unit>>;

public sealed class RemovePlaylistEntriesCommandHandler(IHummiDbContext db) : IRequestHandler<RemovePlaylistEntriesCommand, Result<Unit>>
{
    public async Task<Result<Unit>> Handle(RemovePlaylistEntriesCommand request, CancellationToken cancellationToken)
    {
        var playlist = await PlaylistErrors.OwnedAsync(db, request.ListenerId, request.PlaylistId, cancellationToken);
        if (!playlist.IsSuccess)
        {
            return playlist.Error!;
        }

        var ids = (request.EntryIds ?? []).Select(e => Guid.TryParse(e, out var id) ? id : Guid.Empty).ToHashSet();
        var doomed = playlist.Value!.Entries.Where(e => ids.Contains(e.Id)).ToList();
        playlist.Value.RemoveEntries(ids);
        doomed.ForEach(e => db.PlaylistEntries.Remove(e));
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
