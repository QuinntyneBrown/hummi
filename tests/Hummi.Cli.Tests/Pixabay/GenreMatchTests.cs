using Hummi.Application.Catalogue;

namespace Hummi.Cli.Tests.Pixabay;

public sealed class GenreMatchTests
{
    [Theory]
    [InlineData("Reggae", new string[0], "reggae")]
    [InlineData("reggae", new[] { "dub" }, "reggae")]
    [InlineData("Beats", new[] { "summer", "Zouk" }, "zouk")]
    [InlineData("Island", new[] { "Steel Drum" }, "steelpan")]
    [InlineData(null, new[] { "calypso" }, "steelpan")]
    [InlineData("Afrobeat", new[] { "Soca", "Afrobeat" }, "soca")]
    [InlineData("Kids", new string[0], "kids")]
    [InlineData(null, new[] { "children" }, "kids")]
    [InlineData("Island chill", new string[0], "island-chill")]
    [InlineData("Pop", new[] { "summer", "happy" }, null)]
    [InlineData("Beats", new[] { "reggaeton" }, null)]
    [InlineData(null, new string[0], null)]
    public void L2_057_AC2_a_genre_or_tag_that_equals_a_genre_name_slug_or_alias_classifies_the_track(string? genre, string[] tags, string? slug) =>
        Assert.Equal(slug, GenreMatch.Slug(genre, tags));

    [Fact]
    public void The_pixabay_genre_wins_over_tags() =>
        Assert.Equal("dancehall", GenreMatch.Slug("Dancehall", ["reggae"]));
}
