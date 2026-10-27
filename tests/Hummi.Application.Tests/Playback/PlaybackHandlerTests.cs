using Hummi.Application.Abstractions;
using Hummi.Application.Playback;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Tests.Playback;

public sealed class PlaybackHandlerTests
{
    private sealed class FixedClock(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private sealed class FakeMedia(params string[] existing) : IMediaStore
    {
        public MediaFile? Open(string relativePath) =>
            existing.Contains(relativePath) ? new MediaFile(new MemoryStream([1, 2, 3]), "audio/wav") : null;
    }

    [Fact]
    public async Task Home_lists_recently_added_newest_first_and_the_top_ten_by_plays()
    {
        using var db = new TestDb();
        db.AddTracks("Kaiso Collective", ("Feathers Up", 5), ("Road March Riddim", 9), ("Wine Slow", 1));

        var home = await new GetHomeQueryHandler(db).Handle(new GetHomeQuery(), default);

        Assert.Equal(["Wine Slow", "Road March Riddim", "Feathers Up"], home.Value!.RecentlyAdded.Select(t => t.Title));
        Assert.Equal(["Road March Riddim", "Feathers Up", "Wine Slow"], home.Value.TopTen.Select(t => t.Title));
        var first = home.Value.TopTen[0];
        Assert.Equal("Kaiso Collective", first.ArtistName);
        Assert.Equal(200, first.DurationSeconds);
        Assert.False(first.Liked);
    }

    [Fact]
    public async Task Home_leaves_out_withdrawn_tracks_and_caps_each_shelf()
    {
        using var db = new TestDb();
        var tracks = db.AddTracks("Lady Tamboo", Enumerable.Range(1, 12).Select(i => ($"Track {i}", (long)i)).ToArray());
        tracks[11].Withdraw();
        await db.SaveChangesAsync();

        var home = (await new GetHomeQueryHandler(db).Handle(new GetHomeQuery(), default)).Value!;

        Assert.Equal(GetHomeQueryHandler.RecentlyAddedCount, home.RecentlyAdded.Count);
        Assert.Equal(10, home.TopTen.Count);
        Assert.DoesNotContain(home.TopTen, t => t.Title == "Track 12");
        Assert.Equal("Track 11", home.TopTen[0].Title);
    }

    [Fact]
    public async Task Recording_an_anonymous_play_stores_the_event_and_counts_it()
    {
        using var db = new TestDb();
        var track = db.AddTracks("Shanique", ("Red Light Riddim", 0))[0];

        var result = await new RecordPlayCommandHandler(db, new FixedClock(TestDb.Now))
            .Handle(new RecordPlayCommand(track.Id, ListenerId: null), default);

        Assert.True(result.IsSuccess);
        var play = await db.PlayEvents.SingleAsync();
        Assert.Equal(track.Id, play.TrackId);
        Assert.Null(play.ListenerId);
        Assert.Equal(TestDb.Now, play.PlayedAt);
        Assert.Equal(1, (await db.Tracks.SingleAsync()).PlayCount);
    }

    [Fact]
    public async Task Recording_a_play_of_an_unknown_track_is_404()
    {
        using var db = new TestDb();

        var result = await new RecordPlayCommandHandler(db, TimeProvider.System)
            .Handle(new RecordPlayCommand(Guid.NewGuid(), null), default);

        Assert.Equal(404, result.Error!.Status);
        Assert.Equal("TRACK_NOT_FOUND", result.Error.Code);
    }

    [Fact]
    public async Task Recording_a_play_of_a_withdrawn_track_is_410()
    {
        using var db = new TestDb();
        var track = db.AddTracks("Shanique", ("Red Light Riddim", 0))[0];
        track.Withdraw();
        await db.SaveChangesAsync();

        var result = await new RecordPlayCommandHandler(db, TimeProvider.System)
            .Handle(new RecordPlayCommand(track.Id, null), default);

        Assert.Equal(410, result.Error!.Status);
        Assert.Empty(db.PlayEvents);
    }

    [Fact]
    public async Task The_stream_of_a_playable_track_comes_from_its_audio_path()
    {
        using var db = new TestDb();
        var track = db.AddTracks("Quiet Harbour", ("Fisherman Dawn", 0))[0];

        var result = await new GetTrackStreamQueryHandler(db, new FakeMedia(track.AudioPath))
            .Handle(new GetTrackStreamQuery(track.Id), default);

        Assert.Equal("audio/wav", result.Value!.ContentType);
    }

    [Fact]
    public async Task The_stream_is_404_for_an_unknown_track_or_a_missing_file_and_410_when_withdrawn()
    {
        using var db = new TestDb();
        var tracks = db.AddTracks("Quiet Harbour", ("Fisherman Dawn", 0), ("Slow Tide", 0));
        tracks[1].Withdraw();
        await db.SaveChangesAsync();
        var handler = new GetTrackStreamQueryHandler(db, new FakeMedia(tracks[1].AudioPath));

        Assert.Equal(404, (await handler.Handle(new GetTrackStreamQuery(Guid.NewGuid()), default)).Error!.Status);
        Assert.Equal(404, (await handler.Handle(new GetTrackStreamQuery(tracks[0].Id), default)).Error!.Status);
        Assert.Equal(410, (await handler.Handle(new GetTrackStreamQuery(tracks[1].Id), default)).Error!.Status);
    }
}
