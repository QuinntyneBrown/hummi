using Hummi.Application.Abstractions;
using Hummi.Application.Common;
using Hummi.Application.Playback;
using MediatR;

namespace Hummi.Application.Search;

/// <summary>Songs and artists matching the text, for the search overlay (L2-006, L2-007).</summary>
public sealed record SearchCatalogueQuery(string? Text) : IRequest<Result<SearchResultsDto>>;

/// <summary>One artist result; the overlay links it to /artists/{slug}.</summary>
public sealed record ArtistHitDto(string Slug, string Name);

/// <summary>The trimmed query, the best song (null with no songs), up to 3 artists and up to 7 songs.</summary>
public sealed record SearchResultsDto(string Query, TrackSummaryDto? TopResult, IReadOnlyList<ArtistHitDto> Artists, IReadOnlyList<TrackSummaryDto> Songs);

public sealed class SearchCatalogueQueryHandler(ISearchIndex index) : IRequestHandler<SearchCatalogueQuery, Result<SearchResultsDto>>
{
    public const int MaxLength = 100;
    public const int ArtistCount = 3;
    public const int SongCount = 7;

    public async Task<Result<SearchResultsDto>> Handle(SearchCatalogueQuery request, CancellationToken cancellationToken)
    {
        var text = request.Text?.Trim() ?? string.Empty;
        if (text.Length is 0 or > MaxLength)
        {
            return Error.Invalid(
                "SEARCH_QUERY_INVALID",
                new Dictionary<string, FieldError> { ["q"] = new("QUERY_LENGTH", $"Search for 1 to {MaxLength} characters") },
                "Check your search");
        }

        SearchHits hits;
        try
        {
            hits = await index.SearchAsync(text, ArtistCount, SongCount, cancellationToken);
        }
        catch (SearchUnavailableException)
        {
            return new Error(503, "SEARCH_UNAVAILABLE", "Search isn’t working right now");
        }

        var songs = hits.Tracks.Take(SongCount).ToList();
        return new SearchResultsDto(text, songs.FirstOrDefault(), hits.Artists.Take(ArtistCount).ToList(), songs);
    }
}
