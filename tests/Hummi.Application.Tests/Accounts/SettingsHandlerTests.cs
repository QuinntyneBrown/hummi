using Hummi.Application.Accounts;
using Hummi.Application.Tests.Playback;
using Hummi.Domain.Accounts;
using Hummi.Domain.Catalogue;
using Hummi.Domain.Library;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Tests.Accounts;

public sealed class SettingsHandlerTests
{
    private readonly TestDb db = new();
    private readonly FakeClock clock = new(TestDb.Now);
    private readonly FakeEmailSender email = new();
    private readonly Listener nadia = Listener.Create("Nadia Charles", "nadia@example.com", "hash", TestDb.Now);

    public SettingsHandlerTests()
    {
        nadia.ConfirmEmail(TestDb.Now);
        db.Listeners.Add(nadia);
        db.SaveChanges();
    }

    private Task<Common.Result<SettingsDto>> Save(string name = "Nadia", string address = "nadia@example.com", bool autoplay = true, bool crossfade = false, string theme = "device", bool releases = true, bool news = false) =>
        new UpdateSettingsCommandHandler(db, email, new FakeLinks(), clock)
            .Handle(new UpdateSettingsCommand(nadia.Id, name, address, autoplay, crossfade, theme, releases, news), CancellationToken.None);

    [Fact]
    public async Task L2_033_L2_034_L2_035_L2_049_a_new_listener_has_the_defaults()
    {
        var settings = (await new GetSettingsQueryHandler(db).Handle(new GetSettingsQuery(nadia.Id), CancellationToken.None)).Value!;

        Assert.Equal("Nadia Charles", settings.DisplayName);
        Assert.True(settings.AutoplaySimilar);
        Assert.False(settings.Crossfade);
        Assert.Equal("device", settings.Theme);
        Assert.True(settings.NotifyNewReleases);
        Assert.False(settings.ProductNews);
    }

    [Fact]
    public async Task L2_033_AC4_saving_stores_every_setting_for_every_device()
    {
        var saved = (await Save(" Nadia C ", autoplay: false, crossfade: true, theme: "dark", releases: false, news: true)).Value!;

        var read = (await new GetSettingsQueryHandler(db).Handle(new GetSettingsQuery(nadia.Id), CancellationToken.None)).Value!;
        Assert.Equal(saved, read);
        Assert.Equal("Nadia C", read.DisplayName);
        Assert.Equal("dark", read.Theme);
        Assert.True(read.Crossfade);
        Assert.False(read.NotifyNewReleases);
        Assert.Empty(email.Sent);
    }

    [Fact]
    public async Task L2_033_AC2_an_empty_display_name_saves_nothing()
    {
        var result = await Save(name: "  ", crossfade: true);

        Assert.Equal(422, result.Error!.Status);
        Assert.Equal("Display name can’t be empty", result.Error.Errors!["displayName"].Message);
        Assert.False((await db.Listeners.SingleAsync()).Crossfade);
    }

    [Fact]
    public async Task A_new_email_is_confirmed_again_and_a_taken_one_is_refused()
    {
        db.Listeners.Add(Listener.Create("Mei", "mei@example.com", "hash", TestDb.Now));
        await db.SaveChangesAsync();

        Assert.Equal("That email is already in use", (await Save(address: "MEI@example.com")).Error!.Errors!["email"].Message);
        var changed = (await Save(address: "nadia@hummi.fm")).Value!;

        Assert.Equal("nadia@hummi.fm", changed.Email);
        Assert.False(changed.EmailConfirmed);
        Assert.Equal("nadia@hummi.fm", Assert.Single(email.Sent).To);
    }

    [Fact]
    public async Task An_unknown_theme_falls_back_to_the_device()
    {
        Assert.Equal("device", (await Save(theme: "sepia")).Value!.Theme);
    }

    private SendReleaseDigestsCommandHandler Digest() => new(db, email, clock);

    private Artist FollowedArtistWithTrack(DateTimeOffset addedAt)
    {
        var artist = Artist.Create("Kaiso Collective");
        db.Artists.Add(artist);
        db.Tracks.Add(Track.Create("Feathers Up", artist.Id, 222, null, addedAt));
        db.ArtistFollows.Add(ArtistFollow.Create(nadia.Id, artist.Id, TestDb.Now));
        db.SaveChanges();
        return artist;
    }

    [Fact]
    public async Task L2_035_AC2_new_tracks_from_followed_artists_send_at_most_one_email_a_week()
    {
        FollowedArtistWithTrack(TestDb.Now.AddDays(-1));

        Assert.Equal(1, (await Digest().Handle(new SendReleaseDigestsCommand(), CancellationToken.None)).Value);
        Assert.Contains("Feathers Up by Kaiso Collective", Assert.Single(email.Sent).Body, StringComparison.Ordinal);

        db.Tracks.Add(Track.Create("J’ouvert Morning", db.Artists.Single().Id, 238, null, TestDb.Now.AddHours(1)));
        await db.SaveChangesAsync();
        clock.Advance(TimeSpan.FromDays(6));
        Assert.Equal(0, (await Digest().Handle(new SendReleaseDigestsCommand(), CancellationToken.None)).Value);
        clock.Advance(TimeSpan.FromDays(1));
        Assert.Equal(1, (await Digest().Handle(new SendReleaseDigestsCommand(), CancellationToken.None)).Value);
        Assert.Contains("J’ouvert Morning", email.Sent[^1].Body, StringComparison.Ordinal);
        Assert.DoesNotContain("Feathers Up", email.Sent[^1].Body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task L2_035_AC2_with_the_switch_off_no_digest_is_sent()
    {
        FollowedArtistWithTrack(TestDb.Now.AddDays(-1));
        await Save(releases: false);

        Assert.Equal(0, (await Digest().Handle(new SendReleaseDigestsCommand(), CancellationToken.None)).Value);
        Assert.Empty(email.Sent);
    }

    [Fact]
    public async Task L2_035_AC3_product_news_goes_only_to_listeners_who_switched_it_on()
    {
        var handler = new GetProductNewsRecipientsQueryHandler(db);
        Assert.Empty((await handler.Handle(new GetProductNewsRecipientsQuery(), CancellationToken.None)).Value!);

        await Save(news: true);

        Assert.Equal(["nadia@example.com"], (await handler.Handle(new GetProductNewsRecipientsQuery(), CancellationToken.None)).Value!);
    }
}
