using Hummi.Application.Accounts;
using Hummi.Application.Library;
using Hummi.Application.Tests.Accounts;
using Hummi.Application.Tests.Playback;
using Hummi.Domain.Accounts;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Tests.Library;

public sealed class LibraryHandlerTests
{
    private readonly TestDb db = new();
    private readonly FakeClock clock = new(TestDb.Now);
    private readonly Listener nadia = Listener.Create("Nadia", "nadia@example.com", "hash", TestDb.Now);

    public LibraryHandlerTests()
    {
        db.Listeners.Add(nadia);
        db.SaveChanges();
    }

    private Task<Common.Result<MediatR.Unit>> Like(string trackId, bool liked = true) =>
        new SetTrackLikeCommandHandler(db, clock).Handle(new SetTrackLikeCommand(nadia.Id, trackId, liked), CancellationToken.None);

    private Task<Common.Result<MediatR.Unit>> Follow(string slug, bool following = true) =>
        new SetArtistFollowCommandHandler(db, clock).Handle(new SetArtistFollowCommand(nadia.Id, slug, following), CancellationToken.None);

    private Task<Common.Result<LibraryDto>> Library(Guid? listenerId = null) =>
        new GetLibraryQueryHandler(db).Handle(new GetLibraryQuery(listenerId ?? nadia.Id), CancellationToken.None);

    [Fact]
    public async Task L2_018_AC1_a_liked_track_appears_in_Liked_and_liking_twice_changes_nothing()
    {
        var tracks = db.AddTracks("Kaiso Collective", ("Road March Riddim", 5), ("Feathers Up", 1));

        await Like(tracks[0].Id.ToString());
        clock.Advance(TimeSpan.FromMinutes(1));
        await Like(tracks[1].Id.ToString());
        var again = await Like(tracks[0].Id.ToString());

        Assert.True(again.IsSuccess);
        Assert.Equal(2, await db.TrackLikes.CountAsync());
        var library = (await Library()).Value!;
        Assert.Equal(["Feathers Up", "Road March Riddim"], library.Liked.Select(t => t.Title));
        Assert.All(library.Liked, t => Assert.True(t.Liked));
        Assert.Equal(2, library.LikedCount);
    }

    [Fact]
    public async Task L2_018_AC2_removing_a_like_twice_is_fine()
    {
        var track = db.AddTracks("Kaiso Collective", ("Road March Riddim", 5))[0];
        await Like(track.Id.ToString());

        await Like(track.Id.ToString(), liked: false);
        var again = await Like(track.Id.ToString(), liked: false);

        Assert.True(again.IsSuccess);
        Assert.Empty(db.TrackLikes);
    }

    [Theory]
    [InlineData("not-a-guid")]
    [InlineData("4a8f0f2e-0000-0000-0000-000000000000")]
    public async Task Liking_an_unknown_track_answers_404(string trackId)
    {
        var result = await Like(trackId);

        Assert.Equal(404, result.Error!.Status);
    }

    [Fact]
    public async Task L2_018_AC3_a_followed_artist_appears_in_Following()
    {
        db.AddTracks("Kaiso Collective", ("Road March Riddim", 5));

        await Follow("kaiso-collective");
        await Follow("kaiso-collective");

        var library = (await Library()).Value!;
        var artist = Assert.Single(library.Following);
        Assert.Equal("Kaiso Collective", artist.Name);
        Assert.Equal("kaiso-collective", artist.Slug);
        Assert.Equal("https://covers.example/0.jpg", artist.CoverUrl);
        Assert.Equal(1, library.FollowingCount);

        await Follow("kaiso-collective", following: false);
        Assert.Empty(db.ArtistFollows);
        Assert.Equal(404, (await Follow("nobody")).Error!.Status);
    }

    [Fact]
    public async Task L2_019_AC3_a_new_listener_has_an_empty_library()
    {
        var library = (await Library()).Value!;

        Assert.Equal(0, library.PlaylistCount + library.LikedCount + library.FollowingCount);
        Assert.Empty(library.Playlists);
    }

    [Fact]
    public async Task L2_019_AC5_another_listener_does_not_see_these_marks()
    {
        var track = db.AddTracks("Kaiso Collective", ("Road March Riddim", 5))[0];
        await Like(track.Id.ToString());
        var mei = Listener.Create("Mei", "mei@example.com", "hash", TestDb.Now);
        db.Listeners.Add(mei);
        await db.SaveChangesAsync();

        Assert.Empty((await Library(mei.Id)).Value!.Liked);
        Assert.Single((await Library()).Value!.Liked);
    }
}
