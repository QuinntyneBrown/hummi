using Hummi.Application.Catalogue;
using Hummi.Application.Tests.Accounts;
using Hummi.Application.Tests.Playback;
using Hummi.Domain.Accounts;
using Hummi.Domain.Catalogue;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Tests.Catalogue;

public sealed class ReportHandlerTests
{
    private readonly TestDb db = new();
    private readonly FakeClock clock = new(TestDb.Now);
    private readonly FakeEmailSender email = new();
    private readonly Listener nadia = Listener.Create("Nadia Charles", "nadia@example.com", "hash", TestDb.Now);
    private readonly Track track;

    public ReportHandlerTests()
    {
        db.Listeners.Add(nadia);
        db.SaveChanges();
        track = db.AddTracks("Kaiso Collective", ("Feathers Up", 3))[0];
    }

    private Task<Common.Result<ReportFiledDto>> Report(string? reason = "copied", string? details = null) =>
        new ReportTrackCommandHandler(db, clock).Handle(new ReportTrackCommand(nadia.Id, track.Id.ToString(), reason, details), CancellationToken.None);

    private Task<Common.Result<MediatR.Unit>> Resolve(string id, bool upheld = false, string outcome = "We checked the licence and it is correct.") =>
        new ResolveReportCommandHandler(db, email, clock).Handle(new ResolveReportCommand(id, upheld, outcome), CancellationToken.None);

    [Fact]
    public async Task L2_038_AC1_a_report_with_a_reason_and_details_is_stored_open()
    {
        var filed = (await Report("wrong-licence", "  It says CC0 but the original is CC BY.  ")).Value!;

        var stored = await db.TrackReports.SingleAsync();
        Assert.Equal(filed.Id, stored.Id.ToString());
        Assert.Equal(ReportReason.WrongLicence, stored.Reason);
        Assert.Equal("It says CC0 but the original is CC BY.", stored.Details);
        Assert.Equal(ReportStatus.Open, stored.Status);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("because")]
    public async Task L2_038_AC2_without_a_reason_nothing_is_stored(string? reason)
    {
        var result = await Report(reason);

        Assert.Equal(422, result.Error!.Status);
        Assert.Equal("Choose a reason", result.Error.Errors!["reason"].Message);
        Assert.Empty(db.TrackReports);
    }

    [Fact]
    public async Task Details_over_1000_characters_are_refused()
    {
        var result = await Report(details: new string('x', 1001));

        Assert.Equal("Keep the details under 1,000 characters", result.Error!.Errors!["details"].Message);
    }

    [Fact]
    public async Task L2_038_AC5_reviewers_see_the_report_but_never_the_reporter()
    {
        await Report(details: "Sounds like a known song.");

        var open = Assert.Single((await new GetOpenReportsQueryHandler(db).Handle(new GetOpenReportsQuery(), CancellationToken.None)).Value!);

        Assert.Equal("Feathers Up", open.TrackTitle);
        Assert.Equal("copied", open.Reason);
        var shown = System.Text.Json.JsonSerializer.Serialize(open);
        Assert.DoesNotContain(nadia.Id.ToString(), shown, StringComparison.Ordinal);
        Assert.DoesNotContain("Nadia", shown, StringComparison.Ordinal);
        Assert.DoesNotContain("nadia@example.com", shown, StringComparison.Ordinal);
    }

    [Fact]
    public async Task L2_038_AC5_resolving_emails_the_reporter_the_outcome_once()
    {
        var id = (await Report()).Value!.Id;

        Assert.True((await Resolve(id)).IsSuccess);
        Assert.Equal(409, (await Resolve(id)).Error!.Status);

        var sent = Assert.Single(email.Sent);
        Assert.Equal("nadia@example.com", sent.To);
        Assert.Contains("Feathers Up", sent.Subject, StringComparison.Ordinal);
        Assert.Contains("We checked the licence and it is correct.", sent.Body, StringComparison.Ordinal);
        Assert.Equal(ReportStatus.Dismissed, (await db.TrackReports.SingleAsync()).Status);
        Assert.Empty((await new GetOpenReportsQueryHandler(db).Handle(new GetOpenReportsQuery(), CancellationToken.None)).Value!);
        Assert.False((await db.Tracks.SingleAsync()).Withdrawn);
    }

    [Fact]
    public async Task An_upheld_report_withdraws_the_track()
    {
        var id = (await Report()).Value!.Id;

        await Resolve(id, upheld: true, outcome: "The track copied another artist; it is down.");

        Assert.True((await db.Tracks.SingleAsync()).Withdrawn);
        Assert.Equal(ReportStatus.Upheld, (await db.TrackReports.SingleAsync()).Status);
    }
}
