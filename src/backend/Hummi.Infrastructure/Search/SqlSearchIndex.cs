using Hummi.Application.Abstractions;
using Hummi.Application.Playback;
using Hummi.Application.Search;
using Hummi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Infrastructure.Search;

/// <summary>
/// <see cref="ISearchIndex"/> over the Hummi database with LIKE (ADR 0008): matches that start with the
/// text rank first, then the most played tracks and the artists with the most monthly listeners.
/// </summary>
public sealed class SqlSearchIndex(HummiDbContext db) : ISearchIndex
{
    private const string Escape = "\\";

    public async Task<SearchHits> SearchAsync(string text, int artistTake, int trackTake, CancellationToken cancellationToken)
    {
        var literal = text.Replace(Escape, Escape + Escape, StringComparison.Ordinal)
            .Replace("%", Escape + "%", StringComparison.Ordinal)
            .Replace("_", Escape + "_", StringComparison.Ordinal)
            .Replace("[", Escape + "[", StringComparison.Ordinal);
        var contains = $"%{literal}%";
        var prefix = $"{literal}%";
        try
        {
            var tracks = await db.Tracks.AsNoTracking()
                .Where(t => !t.Withdrawn && EF.Functions.Like(t.Title, contains, Escape))
                .OrderByDescending(t => EF.Functions.Like(t.Title, prefix, Escape))
                .ThenByDescending(t => t.PlayCount)
                .ThenBy(t => t.Title)
                .Take(trackTake)
                .ToSummaries()
                .ToListAsync(cancellationToken);
            var artists = await db.Artists.AsNoTracking()
                .Where(a => EF.Functions.Like(a.Name, contains, Escape) && db.Tracks.Any(t => t.ArtistId == a.Id && !t.Withdrawn))
                .OrderByDescending(a => EF.Functions.Like(a.Name, prefix, Escape))
                .ThenByDescending(a => a.MonthlyListeners)
                .ThenBy(a => a.Name)
                .Take(artistTake)
                .Select(a => new ArtistHitDto(a.Slug, a.Name))
                .ToListAsync(cancellationToken);
            return new SearchHits(artists, tracks);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            throw new SearchUnavailableException(exception);
        }
    }
}
