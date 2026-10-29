using System.Security.Cryptography;
using Hummi.Application.Catalogue;
using Hummi.Domain.Catalogue;
using Hummi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Infrastructure.Catalogue;

public sealed record PublicationTrack(string SourceUrl, string Title, string Artist, int DurationSeconds,
    string? CoverUrl, string? Genre, string[] Tags, string AudioUrl, string AudioSha256, long AudioBytes);

/// <summary>Publishes manifest tracks without demo accounts or changes to existing listening data.</summary>
public sealed class CataloguePublisher(HummiDbContext db, string mediaRoot, Func<Uri, Task<byte[]>> download)
{
    public async Task PublishAsync(IEnumerable<PublicationTrack> entries)
    {
        var genres = await db.Genres.ToDictionaryAsync(g => g.Slug);
        var tracks = await db.Tracks.ToListAsync();
        var artists = await db.Artists.ToListAsync();
        Directory.CreateDirectory(Path.Combine(mediaRoot, "tracks"));
        foreach (var entry in entries)
        {
            var source = new Uri(entry.SourceUrl);
            var audioUrl = new Uri(entry.AudioUrl);
            if (source.Scheme != "https" || source.Host != "pixabay.com" || !source.AbsolutePath.StartsWith("/music/", StringComparison.Ordinal)
                || audioUrl.Scheme != "https" || audioUrl.Host != "cdn.pixabay.com")
            {
                throw new InvalidDataException("Catalogue sources must be Pixabay Music and audio must use its HTTPS CDN.");
            }

            var track = tracks.SingleOrDefault(t => t.SourceUrl == entry.SourceUrl);
            var artist = artists.FirstOrDefault(a => a.Name == entry.Artist)
                ?? Artist.Create(entry.Artist, slug: Unique(Slug.From(entry.Artist), artists.Select(a => a.Slug)));
            var genre = GenreMatch.Slug(entry.Genre, entry.Tags) is { } slug ? genres.GetValueOrDefault(slug) : null;
            var candidate = track ?? Track.Create(entry.Title, artist.Id, entry.DurationSeconds,
                entry.CoverUrl ?? GeneratedCover.DataUrl(entry.Title, genre?.Tone), DateTimeOffset.UtcNow.AddHours(-tracks.Count),
                genre?.Id, Licence.Pixabay, slug: Unique(Slug.From(entry.Title), tracks.Select(t => t.Slug)), sourceUrl: entry.SourceUrl);
            var path = Path.Combine(mediaRoot, candidate.AudioPath);
            if (!File.Exists(path) || !Matches(await File.ReadAllBytesAsync(path), entry))
            {
                var audio = await download(audioUrl);
                if (!Matches(audio, entry))
                {
                    throw new InvalidDataException($"Audio integrity check failed: {entry.SourceUrl}");
                }

                var temporary = path + ".tmp";
                await File.WriteAllBytesAsync(temporary, audio);
                File.Move(temporary, path, overwrite: true);
            }

            if (track is null)
            {
                if (!artists.Contains(artist))
                {
                    db.Artists.Add(artist);
                    artists.Add(artist);
                }

                db.Tracks.Add(candidate);
                tracks.Add(candidate);
                await db.SaveChangesAsync();
            }
        }
    }

    private static bool Matches(byte[] audio, PublicationTrack entry) => audio.LongLength == entry.AudioBytes
        && string.Equals(Convert.ToHexStringLower(SHA256.HashData(audio)), entry.AudioSha256, StringComparison.OrdinalIgnoreCase);

    private static string Unique(string slug, IEnumerable<string> used)
    {
        var taken = used.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var candidate = slug;
        for (var n = 2; taken.Contains(candidate); n++)
        {
            candidate = $"{slug}-{n}";
        }

        return candidate;
    }
}
