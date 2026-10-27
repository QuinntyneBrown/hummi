using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Domain.Catalogue;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Discovery;

/// <summary>Browse: every genre with its published-track count, the mood chips and the catalogue total (L2-003).</summary>
public sealed record GetGenreDirectoryQuery : IRequest<Result<GenreDirectoryDto>>;

/// <summary>
/// Every published Hummi track carries CC0 1.0, CC BY 4.0 or CC BY-SA 4.0, so the openly licensed
/// count is the count of published tracks.
/// </summary>
public sealed record GenreDirectoryDto(int GenreCount, int OpenlyLicensedTrackCount, IReadOnlyList<GenreTileDto> Moods, IReadOnlyList<GenreTileDto> Genres);

public sealed record GenreTileDto(string Slug, string Name, int Tone, int TrackCount);

public sealed class GetGenreDirectoryQueryHandler(IHummiDbContext db) : IRequestHandler<GetGenreDirectoryQuery, Result<GenreDirectoryDto>>
{
    public async Task<Result<GenreDirectoryDto>> Handle(GetGenreDirectoryQuery request, CancellationToken cancellationToken)
    {
        var counts = await db.Tracks.AsNoTracking()
            .Where(t => !t.Withdrawn && t.GenreId != null)
            .GroupBy(t => t.GenreId!.Value)
            .Select(g => new { GenreId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.GenreId, g => g.Count, cancellationToken);
        var genres = (await db.Genres.AsNoTracking().OrderBy(g => g.Position).ToListAsync(cancellationToken))
            .Select(g => new GenreTileDto(g.Slug, g.Name, g.Tone, counts.GetValueOrDefault(g.Id)))
            .ToList();
        var total = await db.Tracks.CountAsync(t => !t.Withdrawn, cancellationToken);
        return new GenreDirectoryDto(genres.Count, total, genres.Take(Genre.MoodCount).ToList(), genres);
    }
}
