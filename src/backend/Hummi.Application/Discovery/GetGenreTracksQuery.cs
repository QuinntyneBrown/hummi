using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Application.Playback;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Discovery;

/// <summary>One page of a genre's published tracks, newest first or most played first (L2-004).</summary>
public sealed record GetGenreTracksQuery(string Slug, string Sort = GenreTrackSort.Newest, int Page = 1) : IRequest<Result<GenreTracksDto>>;

/// <summary>The sort values the query string accepts.</summary>
public static class GenreTrackSort
{
    public const string Newest = "newest";
    public const string MostPlayed = "most-played";
}

public sealed record GenreTracksDto(
    string Slug,
    string Name,
    string Description,
    int Tone,
    int TrackCount,
    string Sort,
    int Page,
    int PageSize,
    IReadOnlyList<TrackSummaryDto> Tracks);

public sealed class GetGenreTracksQueryHandler(IHummiDbContext db) : IRequestHandler<GetGenreTracksQuery, Result<GenreTracksDto>>
{
    public const int PageSize = 50;

    public async Task<Result<GenreTracksDto>> Handle(GetGenreTracksQuery request, CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, FieldError>();
        if (request.Sort is not (GenreTrackSort.Newest or GenreTrackSort.MostPlayed))
        {
            errors["sort"] = new FieldError("SORT_INVALID", "Sort by newest or most-played");
        }

        if (request.Page < 1)
        {
            errors["page"] = new FieldError("PAGE_INVALID", "Pages start at 1");
        }

        if (errors.Count > 0)
        {
            return Error.Invalid("GENRE_QUERY_INVALID", errors, "Check the sort and page");
        }

        var genre = await db.Genres.AsNoTracking().SingleOrDefaultAsync(g => g.Slug == request.Slug, cancellationToken);
        if (genre is null)
        {
            return Error.NotFound("GENRE_NOT_FOUND", "This genre isn’t on Hummi");
        }

        var tracks = db.Tracks.AsNoTracking().Where(t => t.GenreId == genre.Id && !t.Withdrawn);
        var total = await tracks.CountAsync(cancellationToken);
        var ordered = request.Sort == GenreTrackSort.MostPlayed
            ? tracks.OrderByDescending(t => t.PlayCount).ThenByDescending(t => t.AddedAt)
            : tracks.OrderByDescending(t => t.AddedAt).ThenBy(t => t.Title);
        var page = await ordered.Skip((request.Page - 1) * PageSize).Take(PageSize).ToSummaries().ToListAsync(cancellationToken);
        return new GenreTracksDto(genre.Slug, genre.Name, genre.Description, genre.Tone, total, request.Sort, request.Page, PageSize, page);
    }
}
