using Hummi.Application.Abstractions;
using Hummi.Application.Playback;
using Hummi.Application.Search;

namespace Hummi.Application.Tests.Search;

public sealed class SearchHandlerTests
{
    private static TrackSummaryDto Song(string title) => new(title, title.ToLowerInvariant(), title, "Laventille Steel Orchestra", 400, null, false);

    [Fact]
    public async Task L2_006_returns_the_first_song_as_top_result_with_up_to_3_artists_and_7_songs()
    {
        var index = new FakeSearchIndex(new SearchHits(
            [new ArtistHitDto("laventille-steel", "Laventille Steel Orchestra"), new ArtistHitDto("panorama-players", "Panorama Players")],
            [Song("Panyard Nights"), Song("Chrome and Copper")]));

        var result = await new SearchCatalogueQueryHandler(index).Handle(new SearchCatalogueQuery("  pan "), default);

        Assert.True(result.IsSuccess);
        Assert.Equal("pan", index.Text);
        Assert.Equal((3, 7), (index.ArtistTake, index.TrackTake));
        Assert.Equal("pan", result.Value!.Query);
        Assert.Equal("Panyard Nights", result.Value.TopResult!.Title);
        Assert.Equal(2, result.Value.Artists.Count);
        Assert.Equal(["Panyard Nights", "Chrome and Copper"], result.Value.Songs.Select(s => s.Title));
    }

    [Fact]
    public async Task L2_007_no_matches_return_an_empty_result_without_a_top_result()
    {
        var result = await new SearchCatalogueQueryHandler(new FakeSearchIndex(new SearchHits([], []))).Handle(new SearchCatalogueQuery("rainfall in b-flat"), default);

        Assert.Null(result.Value!.TopResult);
        Assert.Empty(result.Value.Artists);
        Assert.Empty(result.Value.Songs);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task An_empty_query_is_invalid(string text)
    {
        var result = await new SearchCatalogueQueryHandler(new FakeSearchIndex(new SearchHits([], []))).Handle(new SearchCatalogueQuery(text), default);

        Assert.Equal(422, result.Error!.Status);
        Assert.Equal("SEARCH_QUERY_INVALID", result.Error.Code);
    }

    [Fact]
    public async Task A_query_over_100_characters_is_invalid()
    {
        var result = await new SearchCatalogueQueryHandler(new FakeSearchIndex(new SearchHits([], []))).Handle(new SearchCatalogueQuery(new string('a', 101)), default);

        Assert.Equal(422, result.Error!.Status);
    }

    [Fact]
    public async Task L2_007_an_unreachable_index_is_503_search_unavailable()
    {
        var result = await new SearchCatalogueQueryHandler(new FakeSearchIndex(null)).Handle(new SearchCatalogueQuery("pan"), default);

        Assert.Equal(503, result.Error!.Status);
        Assert.Equal("SEARCH_UNAVAILABLE", result.Error.Code);
        Assert.Equal("Search isn’t working right now", result.Error.Title);
    }

    /// <summary>Answers with fixed hits, or throws SearchUnavailableException when hits is null.</summary>
    private sealed class FakeSearchIndex(SearchHits? hits) : ISearchIndex
    {
        public string? Text { get; private set; }

        public int ArtistTake { get; private set; }

        public int TrackTake { get; private set; }

        public Task<SearchHits> SearchAsync(string text, int artistTake, int trackTake, CancellationToken cancellationToken)
        {
            (Text, ArtistTake, TrackTake) = (text, artistTake, trackTake);
            return hits is null ? throw new SearchUnavailableException(new InvalidOperationException("down")) : Task.FromResult(hits);
        }
    }
}
