namespace Hummi.Domain.Catalogue;

/// <summary>Why a track was reported (L2-038 AC1).</summary>
public enum ReportReason
{
    /// <summary>Copied from an artist without permission.</summary>
    Copied = 1,

    /// <summary>Wrong licence.</summary>
    WrongLicence = 2,

    /// <summary>Harmful or hateful content.</summary>
    Harmful = 3,

    /// <summary>Something else.</summary>
    Other = 4,
}

public enum ReportStatus
{
    Open = 1,
    Upheld = 2,
    Dismissed = 3,
}

/// <summary>
/// A listener's report of a track (L2-038). ReporterId is kept only to email the outcome; nothing shown about
/// the track or its artist carries it (AC5).
/// </summary>
public sealed class TrackReport
{
    public const int MaxDetails = 1000;

    private TrackReport(Guid id, Guid trackId, Guid reporterId, ReportReason reason, string? details, DateTimeOffset createdAt)
    {
        Id = id;
        TrackId = trackId;
        ReporterId = reporterId;
        Reason = reason;
        Details = details;
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }

    public Guid TrackId { get; private set; }

    public Guid ReporterId { get; private set; }

    public ReportReason Reason { get; private set; }

    public string? Details { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public ReportStatus Status { get; private set; } = ReportStatus.Open;

    /// <summary>The reviewer's note, emailed to the reporter.</summary>
    public string? Outcome { get; private set; }

    public DateTimeOffset? ResolvedAt { get; private set; }

    public static TrackReport File(Guid trackId, Guid reporterId, ReportReason reason, string? details, DateTimeOffset now) =>
        new(Guid.NewGuid(), trackId, reporterId, reason, string.IsNullOrWhiteSpace(details) ? null : details.Trim(), now);

    /// <summary>Closes the report; false when it was already resolved.</summary>
    public bool Resolve(bool upheld, string outcome, DateTimeOffset now)
    {
        if (Status != ReportStatus.Open)
        {
            return false;
        }

        Status = upheld ? ReportStatus.Upheld : ReportStatus.Dismissed;
        Outcome = outcome.Trim();
        ResolvedAt = now;
        return true;
    }
}
