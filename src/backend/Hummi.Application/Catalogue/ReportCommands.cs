using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Domain.Catalogue;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Catalogue;

/// <summary>Send report (L2-038 AC1, AC2): a reason is required; details are optional, up to 1,000 characters.</summary>
public sealed record ReportTrackCommand(Guid ListenerId, string TrackId, string? Reason, string? Details) : IRequest<Result<ReportFiledDto>>;

public sealed record ReportFiledDto(string Id);

public sealed class ReportTrackCommandHandler(IHummiDbContext db, TimeProvider clock) : IRequestHandler<ReportTrackCommand, Result<ReportFiledDto>>
{
    public static readonly IReadOnlyDictionary<string, ReportReason> Reasons = new Dictionary<string, ReportReason>
    {
        ["copied"] = ReportReason.Copied,
        ["wrong-licence"] = ReportReason.WrongLicence,
        ["harmful"] = ReportReason.Harmful,
        ["other"] = ReportReason.Other,
    };

    public async Task<Result<ReportFiledDto>> Handle(ReportTrackCommand request, CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, FieldError>();
        if (request.Reason is null || !Reasons.TryGetValue(request.Reason, out var reason))
        {
            reason = default;
            errors["reason"] = new("REQUIRED", "Choose a reason");
        }

        if ((request.Details ?? string.Empty).Trim().Length > TrackReport.MaxDetails)
        {
            errors["details"] = new("TOO_LONG", "Keep the details under 1,000 characters");
        }

        if (errors.Count > 0)
        {
            return Error.Invalid("INVALID_REPORT", errors);
        }

        if (!Guid.TryParse(request.TrackId, out var trackId) || !await db.Tracks.AnyAsync(t => t.Id == trackId, cancellationToken))
        {
            return CatalogueErrors.TrackNotFound;
        }

        var report = TrackReport.File(trackId, request.ListenerId, reason, request.Details, clock.GetUtcNow());
        db.TrackReports.Add(report);
        await db.SaveChangesAsync(cancellationToken);
        return new ReportFiledDto(report.Id.ToString());
    }
}

/// <summary>An open report as reviewers see it: the track and the report, never who sent it (L2-038 AC5).</summary>
public sealed record OpenReportDto(string Id, string TrackSlug, string TrackTitle, string ArtistName, string Reason, string? Details, DateTimeOffset CreatedAt);

/// <summary>The open reports, oldest first, for the reviewers working outside the product (ADR 0018).</summary>
public sealed record GetOpenReportsQuery : IRequest<Result<IReadOnlyList<OpenReportDto>>>;

public sealed class GetOpenReportsQueryHandler(IHummiDbContext db) : IRequestHandler<GetOpenReportsQuery, Result<IReadOnlyList<OpenReportDto>>>
{
    public async Task<Result<IReadOnlyList<OpenReportDto>>> Handle(GetOpenReportsQuery request, CancellationToken cancellationToken)
    {
        var rows = await db.TrackReports.AsNoTracking().Where(r => r.Status == ReportStatus.Open)
            .OrderBy(r => r.CreatedAt)
            .Join(db.Tracks, r => r.TrackId, t => t.Id, (r, t) => new { r, t })
            .Join(db.Artists, x => x.t.ArtistId, a => a.Id, (x, a) => new { x.r, x.t, Artist = a.Name })
            .ToListAsync(cancellationToken);
        var reasons = ReportTrackCommandHandler.Reasons.ToDictionary(kv => kv.Value, kv => kv.Key);
        return rows.Select(x => new OpenReportDto(x.r.Id.ToString(), x.t.Slug, x.t.Title, x.Artist, reasons[x.r.Reason], x.r.Details, x.r.CreatedAt)).ToList();
    }
}

/// <summary>
/// A reviewer resolves a report (L2-038 AC5): upheld (the track is withdrawn) or dismissed, with a note
/// that is emailed to the reporter. Resolving twice answers 409. A failed email leaves the report resolved and answers 503.
/// </summary>
public sealed record ResolveReportCommand(string ReportId, bool Upheld, string Outcome) : IRequest<Result<Unit>>;

public sealed class ResolveReportCommandHandler(IHummiDbContext db, IEmailSender email, TimeProvider clock) : IRequestHandler<ResolveReportCommand, Result<Unit>>
{
    public static readonly Error ReportNotFound = Error.NotFound("REPORT_NOT_FOUND", "This report isn’t on Hummi");

    public static readonly Error AlreadyResolved = new(409, "ALREADY_RESOLVED", "This report is already resolved");

    public static readonly Error OutcomeNotSent = new(503, "EMAIL_UNAVAILABLE", "The outcome email wasn’t sent");

    public async Task<Result<Unit>> Handle(ResolveReportCommand request, CancellationToken cancellationToken)
    {
        var report = Guid.TryParse(request.ReportId, out var id) ? await db.TrackReports.SingleOrDefaultAsync(r => r.Id == id, cancellationToken) : null;
        if (report is null)
        {
            return ReportNotFound;
        }

        if (string.IsNullOrWhiteSpace(request.Outcome))
        {
            return Error.Invalid("INVALID_OUTCOME", new Dictionary<string, FieldError> { ["outcome"] = new("REQUIRED", "Write the outcome for the reporter") });
        }

        if (!report.Resolve(request.Upheld, request.Outcome, clock.GetUtcNow()))
        {
            return AlreadyResolved;
        }

        if (request.Upheld)
        {
            // An upheld report takes the track down, as its creator withdrawing it would (L2-009).
            var withdrawn = await db.Tracks.SingleAsync(t => t.Id == report.TrackId, cancellationToken);
            withdrawn.Withdraw();
        }

        await db.SaveChangesAsync(cancellationToken);
        var reporter = await db.Listeners.AsNoTracking().SingleOrDefaultAsync(l => l.Id == report.ReporterId, cancellationToken);
        var track = await db.Tracks.AsNoTracking().Where(t => t.Id == report.TrackId).Select(t => t.Title).SingleAsync(cancellationToken);
        if (reporter is null)
        {
            return Unit.Value;
        }

        try
        {
            await email.SendAsync(
                new EmailMessage(
                    reporter.Email,
                    $"Your report about “{track}”",
                    $"Hi {reporter.DisplayName},{Environment.NewLine}{Environment.NewLine}"
                    + (request.Upheld ? "Thanks for reporting it. We acted on your report." : "Thanks for reporting it. We reviewed it and left the track up.")
                    + $"{Environment.NewLine}{Environment.NewLine}{report.Outcome}"),
                cancellationToken);
        }
        catch (EmailNotSentException)
        {
            return OutcomeNotSent;
        }

        return Unit.Value;
    }
}
