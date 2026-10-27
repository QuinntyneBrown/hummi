using Hummi.Application.Library;
using Hummi.Application.Tests.Accounts;
using Hummi.Application.Tests.Playback;
using Hummi.Domain.Accounts;
using Hummi.Domain.Catalogue;
using Hummi.Domain.Library;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Tests.Library;

public sealed class NotificationHandlerTests
{
    private readonly TestDb db = new();
    private readonly FakeClock clock = new(TestDb.Now);
    private readonly Listener nadia = Listener.Create("Nadia Charles", "nadia@example.com", "hash", TestDb.Now);
    private readonly Listener mei = Listener.Create("Mei Rodríguez", "mei@example.com", "hash", TestDb.Now);

    public NotificationHandlerTests()
    {
        db.Listeners.AddRange(nadia, mei);
        db.SaveChanges();
    }

    private Task<Common.Result<int>> Sweep() =>
        new CreateDueNotificationsCommandHandler(db, clock).Handle(new CreateDueNotificationsCommand(), CancellationToken.None);

    private async Task<NotificationsDto> List(Listener who) =>
        (await new GetNotificationsQueryHandler(db).Handle(new GetNotificationsQuery(who.Id), CancellationToken.None)).Value!;

    [Fact]
    public async Task L2_036_AC2_a_followed_artist_releasing_a_track_notifies_followers_once()
    {
        var track = db.AddTracks("Kaiso Collective", ("Road March Riddim", 0))[0];
        db.ArtistFollows.Add(ArtistFollow.Create(nadia.Id, track.ArtistId, TestDb.Now));
        await db.SaveChangesAsync();

        Assert.Equal(1, (await Sweep()).Value);
        Assert.Equal(0, (await Sweep()).Value);

        var item = Assert.Single((await List(nadia)).Items);
        Assert.Equal("release", item.Kind);
        Assert.Equal("Kaiso Collective", item.ActorName);
        Assert.Equal("/artists/kaiso-collective", item.ActorLink);
        Assert.Equal("Road March Riddim", item.ItemName);
        Assert.Equal("/tracks/road-march-riddim", item.ItemLink);
        Assert.True(item.Unread);
        Assert.Empty((await List(mei)).Items);
    }

    [Fact]
    public async Task L2_036_AC2_a_track_passing_a_milestone_notifies_followers_of_the_highest_one()
    {
        clock.Advance(TimeSpan.FromDays(30));
        var track = db.AddTracks("Panorama Players", ("Tidewater Waltz", 25_100))[0];
        db.ArtistFollows.Add(ArtistFollow.Create(nadia.Id, track.ArtistId, TestDb.Now));
        await db.SaveChangesAsync();

        await Sweep();

        var item = Assert.Single((await List(nadia)).Items);
        Assert.Equal("milestone", item.Kind);
        Assert.Equal("Tidewater Waltz", item.ItemName);
        Assert.Equal(25_000, item.Plays);
    }

    [Fact]
    public async Task L2_036_AC2_a_product_change_reaches_every_listener_once()
    {
        var handler = new AnnounceProductChangeCommandHandler(db, clock);

        Assert.Equal(2, (await handler.Handle(new AnnounceProductChangeCommand("models", "Hummi now shows the model that generated each track."), CancellationToken.None)).Value);
        Assert.Equal(0, (await handler.Handle(new AnnounceProductChangeCommand("models", "again"), CancellationToken.None)).Value);

        Assert.Equal("Hummi now shows the model that generated each track.", Assert.Single((await List(mei)).Items).Text);
    }

    [Fact]
    public async Task L2_036_AC2_opening_a_shared_playlist_tells_the_listener_who_shared_it()
    {
        var track = db.AddTracks("Marisol Vega", ("Wine Slow", 0))[0];
        var kitchen = Playlist.Create(mei.Id, "Sunday kitchen", isPublic: false, TestDb.Now);
        kitchen.AddTrack(track.Id, TestDb.Now);
        db.Playlists.Add(kitchen);
        var link = ShareLink.Create(ShareTarget.Playlist, kitchen.Id, TestDb.Now);
        db.ShareLinks.Add(link);
        await db.SaveChangesAsync();
        var handler = new RecordPlaylistShareCommandHandler(db, clock);

        await handler.Handle(new RecordPlaylistShareCommand(nadia.Id, kitchen.Id.ToString(), link.Code), CancellationToken.None);
        await handler.Handle(new RecordPlaylistShareCommand(nadia.Id, kitchen.Id.ToString(), link.Code), CancellationToken.None);
        await handler.Handle(new RecordPlaylistShareCommand(mei.Id, kitchen.Id.ToString(), link.Code), CancellationToken.None);
        await handler.Handle(new RecordPlaylistShareCommand(mei.Id, kitchen.Id.ToString(), "wrong"), CancellationToken.None);

        var item = Assert.Single((await List(nadia)).Items);
        Assert.Equal("share", item.Kind);
        Assert.Equal("Mei Rodríguez", item.ActorName);
        Assert.Equal("Sunday kitchen", item.ItemName);
        Assert.Equal($"/playlists/{kitchen.Id}?share={link.Code}", item.ItemLink);
        Assert.Empty((await List(mei)).Items);
    }

    [Fact]
    public async Task L2_037_unread_count_and_mark_all_as_read()
    {
        await new AnnounceProductChangeCommandHandler(db, clock).Handle(new AnnounceProductChangeCommand("a", "One"), CancellationToken.None);
        clock.Advance(TimeSpan.FromHours(1));
        await new AnnounceProductChangeCommandHandler(db, clock).Handle(new AnnounceProductChangeCommand("b", "Two"), CancellationToken.None);
        var count = new GetUnreadCountQueryHandler(db);

        Assert.Equal(2, (await count.Handle(new GetUnreadCountQuery(nadia.Id), CancellationToken.None)).Value);
        Assert.Equal(["Two", "One"], (await List(nadia)).Items.Select(i => i.Text));

        await new MarkAllNotificationsReadCommandHandler(db, clock).Handle(new MarkAllNotificationsReadCommand(nadia.Id), CancellationToken.None);

        Assert.Equal(0, (await count.Handle(new GetUnreadCountQuery(nadia.Id), CancellationToken.None)).Value);
        Assert.All((await List(nadia)).Items, i => Assert.False(i.Unread));
        Assert.Equal(2, (await count.Handle(new GetUnreadCountQuery(mei.Id), CancellationToken.None)).Value);
        Assert.Equal(0, (await List(nadia)).Unread);
    }
}
