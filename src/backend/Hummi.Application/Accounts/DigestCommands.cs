using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Accounts;

/// <summary>
/// The release digest (L2-035 AC2): every listener with "New tracks from artists I follow" on, whose last
/// digest is at least a week old, gets one email listing their followed artists' tracks added since then
/// (or in the last week). Nothing new, no email. Returns how many emails went out.
/// </summary>
public sealed record SendReleaseDigestsCommand : IRequest<Result<int>>;

public sealed class SendReleaseDigestsCommandHandler(IHummiDbContext db, IEmailSender email, TimeProvider clock)
    : IRequestHandler<SendReleaseDigestsCommand, Result<int>>
{
    public static readonly TimeSpan Every = TimeSpan.FromDays(7);

    public async Task<Result<int>> Handle(SendReleaseDigestsCommand request, CancellationToken cancellationToken)
    {
        var now = clock.GetUtcNow();
        var due = now - Every;
        var listeners = await db.Listeners
            .Where(l => l.NotifyNewReleases && (l.LastDigestAt == null || l.LastDigestAt <= due))
            .ToListAsync(cancellationToken);
        var sent = 0;
        foreach (var listener in listeners)
        {
            var since = listener.LastDigestAt ?? due;
            var followed = db.ArtistFollows.Where(f => f.ListenerId == listener.Id).Select(f => f.ArtistId);
            var fresh = await db.Tracks.AsNoTracking()
                .Where(t => followed.Contains(t.ArtistId) && !t.Withdrawn && t.AddedAt > since)
                .OrderByDescending(t => t.AddedAt)
                .Join(db.Artists, t => t.ArtistId, a => a.Id, (t, a) => new { t.Title, Artist = a.Name })
                .ToListAsync(cancellationToken);
            if (fresh.Count == 0)
            {
                continue;
            }

            try
            {
                await email.SendAsync(Message(listener.Email, listener.DisplayName, fresh.Select(f => $"{f.Title} by {f.Artist}").ToList()), cancellationToken);
            }
            catch (EmailNotSentException)
            {
                continue;
            }

            listener.DigestSent(now);
            sent++;
        }

        await db.SaveChangesAsync(cancellationToken);
        return sent;
    }

    private static EmailMessage Message(string to, string name, IReadOnlyList<string> lines) => new(
        to,
        lines.Count == 1 ? "1 new track from artists you follow" : $"{lines.Count} new tracks from artists you follow",
        $"Hi {name},{Environment.NewLine}{Environment.NewLine}New this week on Hummi:{Environment.NewLine}"
        + string.Join(Environment.NewLine, lines.Select(l => "- " + l))
        + $"{Environment.NewLine}{Environment.NewLine}Turn these emails off in Settings.");
}

/// <summary>Who gets product news (L2-035 AC3): only listeners who switched it on. The sending tool is deferred.</summary>
public sealed record GetProductNewsRecipientsQuery : IRequest<Result<IReadOnlyList<string>>>;

public sealed class GetProductNewsRecipientsQueryHandler(IHummiDbContext db) : IRequestHandler<GetProductNewsRecipientsQuery, Result<IReadOnlyList<string>>>
{
    public async Task<Result<IReadOnlyList<string>>> Handle(GetProductNewsRecipientsQuery request, CancellationToken cancellationToken) =>
        await db.Listeners.Where(l => l.ProductNews).Select(l => l.Email).ToListAsync(cancellationToken);
}
