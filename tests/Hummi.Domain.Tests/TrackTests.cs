using Hummi.Domain.Catalogue;

namespace Hummi.Domain.Tests;

public sealed class TrackTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 27, 9, 0, 0, TimeSpan.Zero);

    private static Track FeathersUp() =>
        Track.Create("Feathers Up", Guid.NewGuid(), durationSeconds: 222, coverUrl: null, addedAt: Now);

    [Fact]
    public void A_new_track_has_no_plays_and_is_playable()
    {
        var track = FeathersUp();

        Assert.Equal(0, track.PlayCount);
        Assert.True(track.IsPlayable);
        Assert.Equal($"tracks/{track.Id}.wav", track.AudioPath);
    }

    [Fact]
    public void Registering_a_play_counts_it_and_returns_the_event()
    {
        var track = FeathersUp();
        var listener = Guid.NewGuid();

        var play = track.RegisterPlay(listener, Now);

        Assert.Equal(1, track.PlayCount);
        Assert.Equal(track.Id, play.TrackId);
        Assert.Equal(listener, play.ListenerId);
        Assert.Equal(Now, play.PlayedAt);
    }

    [Fact]
    public void An_anonymous_play_has_no_listener()
    {
        var play = FeathersUp().RegisterPlay(listenerId: null, Now);

        Assert.Null(play.ListenerId);
    }

    [Fact]
    public void A_withdrawn_track_is_not_playable()
    {
        var track = FeathersUp();

        track.Withdraw();

        Assert.False(track.IsPlayable);
    }

    [Fact]
    public void A_track_needs_a_title_and_a_positive_duration()
    {
        Assert.Throws<ArgumentException>(() => Track.Create(" ", Guid.NewGuid(), 222, null, Now));
        Assert.Throws<ArgumentOutOfRangeException>(() => Track.Create("Feathers Up", Guid.NewGuid(), 0, null, Now));
    }
}
