using Hummi.Application.Abstractions;
using Hummi.Application.Catalogue;
using Hummi.Cli.Pixabay;
using Hummi.Domain.Accounts;
using Hummi.Domain.Catalogue;
using Hummi.Domain.Library;
using Hummi.Infrastructure.Accounts;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Cli;

/// <summary>How a seed went: tracks added, manifest tracks skipped with the reason, and whether it had run before.</summary>
public sealed record SeedReport(int Added, IReadOnlyList<string> Skipped, bool AlreadySeeded = false);

/// <summary>
/// Writes the Pixabay manifest's tracks into a local install (ADR 0021, L2-057): one artist per uploader with no
/// model or description, no albums, no plays, the Pixabay Content License, the genre the page names, the real
/// cover or a generated one, and the cached audio copied to <c>tracks/{id}.mp3</c>. Nothing else is added to
/// the catalogue. It also adds the confirmed demo listener Nadia Charles, whose likes, follows, playlist and
/// notifications refer only to seeded tracks, and Mei Rodríguez with a public playlist.
/// </summary>
public static class DemoSeeder
{
    /// <summary>The confirmed demo listener of the mocks, for signing in to a local install.</summary>
    public const string DemoEmail = "nadia@hummi.fm";

    public const string DemoPassword = "hummi-demo-password";

    /// <summary>Nadia's private playlist, holding her liked tracks (L2-023).</summary>
    public const string DemoPlaylist = "Road trip to the north coast";

    /// <summary>How many of the manifest's first tracks Nadia likes, and Mei's playlist holds.</summary>
    public const int DemoLikeCount = 3;

    public const int KitchenCount = 4;

    /// <summary>Adds the manifest's tracks and the demo listeners unless tracks already exist.</summary>
    public static async Task<SeedReport> SeedAsync(IHummiDbContext db, PixabayManifest manifest, string mediaRoot, TimeProvider clock, CancellationToken cancellationToken = default)
    {
        if (await db.Tracks.AnyAsync(cancellationToken))
        {
            return new SeedReport(0, [], AlreadySeeded: true);
        }

        var now = clock.GetUtcNow();
        var genres = await db.Genres.ToDictionaryAsync(g => g.Slug, cancellationToken);
        var artists = new Dictionary<string, Artist>(StringComparer.Ordinal);
        var slugs = new HashSet<string>(StringComparer.Ordinal);
        var tracks = new List<Track>();
        var skipped = new List<string>();
        Directory.CreateDirectory(Path.Combine(mediaRoot, "tracks"));
        foreach (var entry in manifest.Tracks)
        {
            if (Audio(entry, mediaRoot, out var reason) is not { } audio)
            {
                skipped.Add($"{entry.Title} ({entry.PixabayId}): {reason}; run hummi import");
                continue;
            }

            if (!artists.TryGetValue(entry.Artist, out var artist))
            {
                artist = Artist.Create(entry.Artist, modelName: null, slug: Unique(Slug.From(entry.Artist), artists.Values.Select(a => a.Slug).ToHashSet()));
                artists[entry.Artist] = artist;
                db.Artists.Add(artist);
            }

            var genre = GenreMatch.Slug(entry.Genre, entry.Tags) is { } slug ? genres.GetValueOrDefault(slug) : null;
            // Manifest order is newest first, so Recently added lists the tracks in that order.
            var track = Track.Create(
                entry.Title,
                artist.Id,
                entry.DurationSeconds,
                entry.CoverUrl ?? GeneratedCover.DataUrl(entry.Title, genre?.Tone),
                now.AddHours(-tracks.Count),
                genre?.Id,
                Licence.Pixabay,
                slug: Unique(Slug.From(entry.Title), slugs),
                sourceUrl: entry.SourceUrl,
                audioExtension: Path.GetExtension(entry.AudioFile));
            slugs.Add(track.Slug);
            db.Tracks.Add(track);
            tracks.Add(track);
            await File.WriteAllBytesAsync(Path.Combine(mediaRoot, track.AudioPath), audio, cancellationToken);
        }

        AddDemoListeners(db, tracks, now);
        await db.SaveChangesAsync(cancellationToken);
        return new SeedReport(tracks.Count, skipped);
    }

    /// <summary>The cached audio when it is there and matches the manifest's SHA-256.</summary>
    private static byte[]? Audio(ManifestTrack entry, string mediaRoot, out string reason)
    {
        var path = Path.Combine(mediaRoot, entry.AudioFile);
        if (!File.Exists(path))
        {
            reason = "its audio is not in the media cache";
            return null;
        }

        var audio = File.ReadAllBytes(path);
        if (PixabayImporter.Sha256(audio) != entry.AudioSha256)
        {
            reason = "its cached audio does not match its SHA-256";
            return null;
        }

        reason = string.Empty;
        return audio;
    }

    /// <summary>The slug, or the slug with -2, -3… when it is taken.</summary>
    private static string Unique(string slug, IReadOnlySet<string> taken)
    {
        var candidate = slug;
        for (var n = 2; taken.Contains(candidate); n++)
        {
            candidate = $"{slug}-{n}";
        }

        return candidate;
    }

    /// <summary>Nadia and Mei; every like, follow, playlist entry and notification refers to a seeded track (L2-057 AC5).</summary>
    private static void AddDemoListeners(IHummiDbContext db, List<Track> tracks, DateTimeOffset now)
    {
        var hasher = new IdentityPasswordHasher();
        var nadia = Listener.Create("Nadia Charles", DemoEmail, hasher.Hash(DemoPassword), now);
        nadia.ConfirmEmail(now);
        db.Listeners.Add(nadia);
        var liked = tracks.Take(DemoLikeCount).ToList();
        var playlist = Playlist.Create(nadia.Id, DemoPlaylist, isPublic: false, now);
        foreach (var track in liked)
        {
            db.TrackLikes.Add(TrackLike.Create(nadia.Id, track.Id, now));
            playlist.AddTrack(track.Id, now);
        }

        foreach (var artistId in liked.Select(t => t.ArtistId).Distinct())
        {
            db.ArtistFollows.Add(ArtistFollow.Create(nadia.Id, artistId, now));
        }

        db.Playlists.Add(playlist);

        // Mei's public playlist, for the read-only view of someone else's playlist (L2-024).
        var mei = Listener.Create("Mei Rodríguez", "mei@hummi.fm", hasher.Hash(DemoPassword), now);
        mei.ConfirmEmail(now);
        db.Listeners.Add(mei);
        var kitchen = Playlist.Create(mei.Id, "Sunday kitchen", isPublic: true, now);
        foreach (var track in tracks.Take(KitchenCount))
        {
            kitchen.AddTrack(track.Id, now);
        }

        db.Playlists.Add(kitchen);

        // Nadia's notifications: a release only when a track exists; no invented play milestone (L2-036).
        var product = Notification.Product(nadia.Id, "pixabay", "Hummi’s catalogue is now real music from Pixabay.", now.AddDays(-8));
        product.MarkRead(now);
        db.Notifications.AddRange(
            Notification.Share(nadia.Id, mei.DisplayName, kitchen.Id, kitchen.Name, $"/playlists/{kitchen.Id}", now.AddDays(-1)),
            product);
        if (tracks.FirstOrDefault() is { } newest)
        {
            var artist = db.Artists.Local.Single(a => a.Id == newest.ArtistId);
            db.Notifications.Add(Notification.Release(nadia.Id, artist.Name, artist.Slug, newest.Id, newest.Title, newest.Slug, now.AddHours(-2)));
        }
    }
}
