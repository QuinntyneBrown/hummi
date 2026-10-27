using Hummi.Application.Library;
using Hummi.Application.Tests.Accounts;
using Hummi.Application.Tests.Playback;
using Hummi.Domain.Accounts;
using Hummi.Domain.Catalogue;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Tests.Library;

public sealed class PlaylistHandlerTests
{
    private readonly TestDb db = new();
    private readonly FakeClock clock = new(TestDb.Now);
    private readonly Listener nadia = Listener.Create("Nadia Charles", "nadia@example.com", "hash", TestDb.Now);
    private readonly Listener mei = Listener.Create("Mei Rodríguez", "mei@example.com", "hash", TestDb.Now);
    private readonly Track[] tracks;

    public PlaylistHandlerTests()
    {
        db.Listeners.AddRange(nadia, mei);
        db.SaveChanges();
        tracks = db.AddTracks("Kaiso Collective", ("Feathers Up", 1), ("J’ouvert Morning", 1), ("Road March Riddim", 1));
    }

    private string Id(int i) => tracks[i].Id.ToString();

    private async Task<string> Create(string name = "Road trip to the north coast", bool isPublic = false, Guid? owner = null, params string[] trackIds) =>
        (await new CreatePlaylistCommandHandler(db, clock)
            .Handle(new CreatePlaylistCommand(owner ?? nadia.Id, name, isPublic, trackIds), CancellationToken.None)).Value!.Id;

    private Task<Common.Result<PlaylistDetailDto>> Get(string id, Guid? viewer = null) =>
        new GetPlaylistQueryHandler(db).Handle(new GetPlaylistQuery(viewer ?? nadia.Id, id), CancellationToken.None);

    private Task<Common.Result<MembershipChangeDto>> SetMembership(string trackId, params string[] playlistIds) =>
        new SetTrackMembershipCommandHandler(db, clock)
            .Handle(new SetTrackMembershipCommand(nadia.Id, trackId, playlistIds), CancellationToken.None);

    // ---------------------------------------------------------------- L2-021

    [Fact]
    public async Task L2_021_AC2_create_makes_a_private_playlist_unless_public_is_checked()
    {
        var road = await Create(" Road trip to the north coast ");
        var rainy = await Create("Rainy-day panyard", isPublic: true);

        var a = (await Get(road)).Value!;
        Assert.Equal("Road trip to the north coast", a.Name);
        Assert.False(a.IsPublic);
        Assert.True(a.IsOwner);
        Assert.True((await Get(rainy)).Value!.IsPublic);
    }

    [Theory]
    [InlineData("  ", "Give your playlist a name")]
    [InlineData("0123456789012345678901234567890123456789012345678901234567890", "Use up to 60 characters")]
    public async Task L2_021_AC3_AC4_an_empty_or_too_long_name_creates_nothing(string name, string message)
    {
        var result = await new CreatePlaylistCommandHandler(db, clock)
            .Handle(new CreatePlaylistCommand(nadia.Id, name, false, []), CancellationToken.None);

        Assert.Equal(422, result.Error!.Status);
        Assert.Equal(message, result.Error.Errors!["name"].Message);
        Assert.Empty(db.Playlists);
    }

    [Fact]
    public async Task L2_021_AC5_the_owner_renames_and_nobody_else_can()
    {
        var road = await Create();
        var handler = new UpdatePlaylistCommandHandler(db);

        var byMei = await handler.Handle(new UpdatePlaylistCommand(mei.Id, road, "Mine now", true), CancellationToken.None);
        var byNadia = await handler.Handle(new UpdatePlaylistCommand(nadia.Id, road, "North coast", true), CancellationToken.None);

        Assert.Equal(403, byMei.Error!.Status);
        Assert.True(byNadia.IsSuccess);
        Assert.Equal("North coast", (await Get(road)).Value!.Name);
    }

    // ---------------------------------------------------------------- L2-020

    [Fact]
    public async Task L2_020_AC1_the_choices_list_own_playlists_with_counts_and_membership()
    {
        var road = await Create(trackIds: [Id(0), Id(1)]);
        await Create("Rainy-day panyard");
        await Create("Mei’s", owner: mei.Id);

        var choices = (await new GetMyPlaylistsQueryHandler(db).Handle(new GetMyPlaylistsQuery(nadia.Id, Id(0)), CancellationToken.None)).Value!;

        Assert.Equal(["Rainy-day panyard", "Road trip to the north coast"], choices.Select(c => c.Name).Order());
        var r = choices.Single(c => c.Id == road);
        Assert.Equal(2, r.TrackCount);
        Assert.True(r.ContainsTrack);
        Assert.False(choices.Single(c => c.Id != road).ContainsTrack);
    }

    [Fact]
    public async Task L2_020_AC2_save_adds_to_checked_and_removes_from_unchecked_in_one_change()
    {
        var road = await Create(trackIds: [Id(1)]);
        var rainy = await Create("Rainy-day panyard", trackIds: [Id(0)]);

        var change = (await SetMembership(Id(0), road)).Value!;

        var added = Assert.Single(change.Added);
        Assert.Equal("Road trip to the north coast", added.Name);
        Assert.Equal(2, added.Position);
        Assert.Equal([rainy], change.Removed);
        Assert.Equal(0, (await Get(rainy)).Value!.TrackCount);
        Assert.Equal(["J’ouvert Morning", "Feathers Up"], (await Get(road)).Value!.Entries.Select(e => e.Track.Title));
    }

    [Fact]
    public async Task L2_020_AC4_a_playlist_of_someone_else_fails_the_whole_change()
    {
        var road = await Create();
        var meis = await Create("Mei’s", owner: mei.Id);

        var result = await SetMembership(Id(0), road, meis);

        Assert.Equal(403, result.Error!.Status);
        Assert.Equal(0, (await Get(road)).Value!.TrackCount);
    }

    [Fact]
    public async Task L2_020_AC6_adding_a_track_already_there_asks_first_and_adds_again_when_allowed()
    {
        var road = await Create(trackIds: [Id(0)]);
        var handler = new AddTracksToPlaylistCommandHandler(db, clock);

        var first = await handler.Handle(new AddTracksToPlaylistCommand(nadia.Id, road, [Id(0)], false), CancellationToken.None);
        var again = await handler.Handle(new AddTracksToPlaylistCommand(nadia.Id, road, [Id(0)], true), CancellationToken.None);

        Assert.Equal(409, first.Error!.Status);
        Assert.Equal("ALREADY_IN_PLAYLIST", first.Error.Code);
        Assert.Equal(2, again.Value!.Position);
        Assert.Equal(2, (await Get(road)).Value!.TrackCount);
    }

    // ---------------------------------------------------------------- L2-023

    [Fact]
    public async Task L2_023_AC1_the_owner_sees_count_duration_and_visibility()
    {
        var road = await Create(trackIds: [Id(0), Id(1), Id(2)]);

        var p = (await Get(road)).Value!;

        Assert.Equal(3, p.TrackCount);
        Assert.Equal(600, p.DurationSeconds);
        Assert.Equal("Nadia Charles", p.OwnerName);
        Assert.Equal(["Feathers Up", "J’ouvert Morning", "Road March Riddim"], p.Entries.Select(e => e.Track.Title));
    }

    [Fact]
    public async Task A_private_playlist_is_forbidden_to_others_and_a_public_one_is_read_only()
    {
        var road = await Create();
        var rainy = await Create("Rainy-day panyard", isPublic: true);

        Assert.Equal(403, (await Get(road, mei.Id)).Error!.Status);
        Assert.False((await Get(rainy, mei.Id)).Value!.IsOwner);
        Assert.Equal(404, (await Get(Guid.NewGuid().ToString())).Error!.Status);
    }

    [Fact]
    public async Task L2_023_AC4_remove_from_playlist_removes_the_selected_entries()
    {
        var road = await Create(trackIds: [Id(0), Id(1), Id(2)]);
        var entries = (await Get(road)).Value!.Entries;

        var result = await new RemovePlaylistEntriesCommandHandler(db)
            .Handle(new RemovePlaylistEntriesCommand(nadia.Id, road, [entries[0].EntryId, entries[2].EntryId]), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(["J’ouvert Morning"], (await Get(road)).Value!.Entries.Select(e => e.Track.Title));
    }

    // ---------------------------------------------------------------- L2-022

    [Fact]
    public async Task L2_022_AC3_delete_removes_the_playlist_and_keeps_the_tracks()
    {
        var road = await Create(trackIds: [Id(0)]);
        var handler = new DeletePlaylistCommandHandler(db);

        Assert.Equal(403, (await handler.Handle(new DeletePlaylistCommand(mei.Id, road), CancellationToken.None)).Error!.Status);
        Assert.True((await handler.Handle(new DeletePlaylistCommand(nadia.Id, road), CancellationToken.None)).IsSuccess);

        Assert.Empty(db.Playlists);
        Assert.Equal(3, await db.Tracks.CountAsync());
        Assert.Equal(404, (await Get(road)).Error!.Status);
    }

    [Fact]
    public async Task L2_019_AC2_Library_lists_owned_playlists_with_counts_and_owner()
    {
        await Create(trackIds: [Id(0), Id(1)]);

        var library = (await new GetLibraryQueryHandler(db).Handle(new GetLibraryQuery(nadia.Id), CancellationToken.None)).Value!;

        Assert.Equal(1, library.PlaylistCount);
        var tile = Assert.Single(library.Playlists);
        Assert.Equal(2, tile.TrackCount);
        Assert.Equal("Nadia Charles", tile.OwnerName);
        Assert.Equal("https://covers.example/0.jpg", tile.CoverUrl);
    }
}
