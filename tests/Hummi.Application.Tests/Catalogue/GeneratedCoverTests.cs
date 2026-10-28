using Hummi.Application.Catalogue;

namespace Hummi.Application.Tests.Catalogue;

public sealed class GeneratedCoverTests
{
    [Fact]
    public void L2_057_AC3_the_same_title_and_genre_give_the_same_cover()
    {
        var first = GeneratedCover.DataUrl("High Times", tone: 4);

        Assert.Equal(first, GeneratedCover.DataUrl("High Times", tone: 4));
        Assert.NotEqual(first, GeneratedCover.DataUrl("Dance Like Usyk", tone: 4));
        Assert.NotEqual(first, GeneratedCover.DataUrl("High Times", tone: 1));
    }

    [Fact]
    public void L2_057_AC3_the_cover_is_an_svg_data_url_drawn_with_the_genre_gradient()
    {
        var cover = GeneratedCover.DataUrl("High Times", tone: 4);
        var svg = Uri.UnescapeDataString(cover["data:image/svg+xml,".Length..]);

        Assert.StartsWith("data:image/svg+xml,", cover);
        Assert.StartsWith("<svg xmlns=\"http://www.w3.org/2000/svg\"", svg);
        Assert.Contains("#1b6b3c", svg);
        Assert.Contains("#24182b", svg);
        Assert.Contains(">HT<", svg);
        Assert.Contains("role=\"img\"", svg);
    }

    [Theory]
    [InlineData("A")]
    [InlineData("☘️ High Times - (Happy 420) & <Friends> \"live\"")]
    [InlineData("The Quiet Between Two Lighthouses, Revisited (Extended Panyard Mix) and an even longer subtitle that goes on and on")]
    public void L2_057_AC3_any_title_fits_the_cover_url_column_and_is_escaped(string title)
    {
        var cover = GeneratedCover.DataUrl(title, tone: null);
        var svg = Uri.UnescapeDataString(cover["data:image/svg+xml,".Length..]);

        Assert.True(cover.Length <= 2048, $"{cover.Length} characters");
        Assert.DoesNotContain("<Friends>", svg);
        Assert.DoesNotContain("\"live\"", svg);
        Assert.Matches("#[0-9a-f]{6}", svg);
    }

    [Fact]
    public void An_unclassified_track_takes_a_tone_from_its_title()
    {
        var tones = new[] { "High Times", "Dance Like Usyk", "Afrobeat Soca Fire", "Zouk", "Island", "Rain" }
            .Select(t => GeneratedCover.ToneFor(t, tone: null))
            .ToList();

        Assert.All(tones, tone => Assert.InRange(tone, 1, 6));
        Assert.Equal(tones, new[] { "High Times", "Dance Like Usyk", "Afrobeat Soca Fire", "Zouk", "Island", "Rain" }.Select(t => GeneratedCover.ToneFor(t, null)));
        Assert.Equal(3, GeneratedCover.ToneFor("High Times", tone: 3));
    }
}
