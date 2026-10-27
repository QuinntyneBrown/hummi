using Hummi.Application.Library;
using Hummi.Application.Tests.Accounts;
using Hummi.Application.Tests.Playback;
using Hummi.Domain.Accounts;
using Hummi.Domain.Catalogue;
using Hummi.Domain.Library;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Tests.Library;

public sealed class SharingHandlerTests
{
    private readonly TestDb db = new();
    private readonly FakeClock clock = new(TestDb.Now);
    private readonly Listener nadia = Listener.Create("Nadia Charles", "nadia@example.com", "hash", TestDb.Now);
    private readonly Listener mei = Listener.Create("Mei Rodríguez", "mei@example.com", "hash", TestDb.Now);
    private readonly Track[] tracks;

    public SharingHandlerTests()
    {
        db.Listeners.AddRange(nadia, mei);
        db.SaveChanges();
        tracks = db.AddTracks("Marisol Vega", ("Wine Slow", 1), ("Slow Orbit", 1));
    }

    private async Task<string> Playlist(Listener owner, string name, bool isPublic)
    {
        var playlist = Domain.Library.Playlist.Create(owner.Id, name, isPublic, TestDb.Now);
        playlist.AddTrack(tracks[0].Id, TestDb.Now);
        db.Playlists.Add(playlist);
        await db.SaveChangesAsync();
        return playlist.Id.ToString();
    }

    private Task<Common.Result<ShareLinkDto>> Share(string type, string id, Guid? by) =>
        new GetOrCreateShareLinkCommandHandler(db, clock).Handle(new GetOrCreateShareLinkCommand(by, type, id), CancellationToken.None);

    private Task<Common.Result<PlaylistDetailDto>> Open(string id, Guid? viewer, string? code = null) =>
        new GetPlaylistQueryHandler(db).Handle(new GetPlaylistQuery(viewer, id, code), CancellationToken.None);

    [Fact]
    public async Task L2_025_a_track_has_one_8_character_link_for_everyone()
    {
        var first = (await Share("track", tracks[0].Id.ToString(), null)).Value!;
        var again = (await Share("track", tracks[0].Id.ToString(), nadia.Id)).Value!;

        Assert.Equal(first.Code, again.Code);
        Assert.Equal(ShareLink.CodeLength, first.Code.Length);
        Assert.All(first.Code, c => Assert.Contains(c, ShareLink.Alphabet));
        Assert.Single(db.ShareLinks);
    }

    [Fact]
    public async Task L2_026_AC1_the_code_resolves_to_the_track_and_AC4_a_bad_or_withdrawn_one_does_not()
    {
        var code = (await Share("track", tracks[0].Id.ToString(), null)).Value!.Code;
        var handler = new ResolveShareLinkQueryHandler(db);

        var resolved = (await handler.Handle(new ResolveShareLinkQuery(code.ToUpperInvariant()), CancellationToken.None)).Value!;
        Assert.Equal("track", resolved.Type);
        Assert.Equal("wine-slow", resolved.TrackSlug);
        Assert.Equal(404, (await handler.Handle(new ResolveShareLinkQuery("k7m2p9"), CancellationToken.None)).Error!.Status);

        tracks[0].Withdraw();
        await db.SaveChangesAsync();
        Assert.Equal("LINK_NOT_FOUND", (await handler.Handle(new ResolveShareLinkQuery(code), CancellationToken.None)).Error!.Code);
    }

    [Fact]
    public async Task L2_024_AC4_a_private_playlist_is_forbidden_without_its_link_and_open_with_it()
    {
        var road = await Playlist(nadia, "Road trip to the north coast", isPublic: false);

        Assert.Equal(403, (await Share("playlist", road, mei.Id)).Error!.Status);
        Assert.Equal(403, (await Open(road, mei.Id)).Error!.Status);
        var code = (await Share("playlist", road, nadia.Id)).Value!.Code;

        var opened = (await Open(road, mei.Id, code)).Value!;
        Assert.False(opened.IsOwner);
        Assert.Equal(403, (await Open(road, mei.Id, "wrongcode")).Error!.Status);
        var resolved = (await new ResolveShareLinkQueryHandler(db).Handle(new ResolveShareLinkQuery(code), CancellationToken.None)).Value!;
        Assert.Equal(road, resolved.PlaylistId);
    }

    [Fact]
    public async Task L2_024_AC2_someone_else_cannot_change_a_public_playlist()
    {
        var kitchen = await Playlist(mei, "Sunday kitchen", isPublic: true);
        var entry = (await Open(kitchen, nadia.Id)).Value!.Entries[0].EntryId;

        Assert.Equal(403, (await new UpdatePlaylistCommandHandler(db).Handle(new UpdatePlaylistCommand(nadia.Id, kitchen, "Mine", true), CancellationToken.None)).Error!.Status);
        Assert.Equal(403, (await new DeletePlaylistCommandHandler(db).Handle(new DeletePlaylistCommand(nadia.Id, kitchen), CancellationToken.None)).Error!.Status);
        Assert.Equal(403, (await new RemovePlaylistEntriesCommandHandler(db).Handle(new RemovePlaylistEntriesCommand(nadia.Id, kitchen, [entry]), CancellationToken.None)).Error!.Status);
        Assert.Equal(403, (await new AddTracksToPlaylistCommandHandler(db, clock).Handle(new AddTracksToPlaylistCommand(nadia.Id, kitchen, [tracks[1].Id.ToString()], true), CancellationToken.None)).Error!.Status);
        Assert.Single((await Open(kitchen, mei.Id)).Value!.Entries);
    }

    [Fact]
    public async Task L2_024_AC3_save_to_my_library_lists_it_with_its_owner()
    {
        var kitchen = await Playlist(mei, "Sunday kitchen", isPublic: true);
        var handler = new SavePlaylistCommandHandler(db, clock);

        await handler.Handle(new SavePlaylistCommand(nadia.Id, kitchen, null, true), CancellationToken.None);
        await handler.Handle(new SavePlaylistCommand(nadia.Id, kitchen, null, true), CancellationToken.None);

        var library = (await new GetLibraryQueryHandler(db).Handle(new GetLibraryQuery(nadia.Id), CancellationToken.None)).Value!;
        var tile = Assert.Single(library.Playlists);
        Assert.Equal("Mei Rodríguez", tile.OwnerName);
        Assert.True((await Open(kitchen, nadia.Id)).Value!.Saved);
        Assert.Equal(409, (await handler.Handle(new SavePlaylistCommand(mei.Id, kitchen, null, true), CancellationToken.None)).Error!.Status);
    }

    [Fact]
    public async Task L2_022_AC3_deleting_a_playlist_ends_its_link_and_every_saved_copy()
    {
        var kitchen = await Playlist(mei, "Sunday kitchen", isPublic: true);
        var code = (await Share("playlist", kitchen, null)).Value!.Code;
        await new SavePlaylistCommandHandler(db, clock).Handle(new SavePlaylistCommand(nadia.Id, kitchen, null, true), CancellationToken.None);

        await new DeletePlaylistCommandHandler(db).Handle(new DeletePlaylistCommand(mei.Id, kitchen), CancellationToken.None);

        Assert.Empty(db.SavedPlaylists);
        Assert.Equal(404, (await new ResolveShareLinkQueryHandler(db).Handle(new ResolveShareLinkQuery(code), CancellationToken.None)).Error!.Status);
        Assert.Equal(2, await db.Tracks.CountAsync());
    }
}
