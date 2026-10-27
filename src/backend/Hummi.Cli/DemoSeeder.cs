using Hummi.Application.Abstractions;
using Hummi.Domain.Accounts;
using Hummi.Domain.Catalogue;
using Hummi.Domain.Library;
using Hummi.Infrastructure.Accounts;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Cli;

/// <summary>
/// Writes the demo catalogue of the mocks (docs/mocks/_build/kit.py) into a local install: artists,
/// published albums, tracks with their licences and waveforms, plays that order the Top 10, and a
/// generated WAV per track on the media volume. There is no upload tooling; this is how a local
/// install gets music. It also adds the confirmed demo listener Nadia Charles with a few likes and follows.
/// </summary>
public static class DemoSeeder
{
    private const string Cdn = "https://cdn.magicpatterns.com/patterns/generated-images/";

    /// <summary>What Nadia Charles has liked and follows, so Library has something to show (L2-019).</summary>
    public static readonly IReadOnlyList<string> DemoLikes = ["Feathers Up", "Big Truck Energy", "Panyard Nights"];

    /// <summary>Nadia's private playlist, holding her liked tracks (L2-023).</summary>
    public const string DemoPlaylist = "Road trip to the north coast";

    public static readonly IReadOnlyList<string> DemoFollows = ["Kaiso Collective", "Lady Tamboo"];

    /// <summary>A demo track; Genre is the slug of one of the fixed genres and Album the title of the artist's release.</summary>
    public sealed record DemoTrack(string Title, string Artist, int Seconds, string CoverId, string Genre, string Album, Licence Licence);

    /// <summary>A demo artist: the open-weights model its tracks are generated with, and its description.</summary>
    public sealed record DemoArtist(string Name, string Model, string Description);

    public static readonly IReadOnlyList<DemoTrack> Tracks =
    [
        new("Feathers Up", "Kaiso Collective", 222, "9b9fc48a-3ebb-4459-991e-afb5a29c3e35", "soca", "Mas on the Avenue", Licence.Cc0),
        new("Big Truck Energy", "Lady Tamboo", 201, "fe585510-ffc6-478e-81f0-6608a23b6665", "soca", "Road March Riddim", Licence.CcBySa4),
        new("Panyard Nights", "Laventille Steel Orchestra", 400, "896df414-e435-4a74-b519-c4a5af63cda6", "steelpan", "Panyard Nights", Licence.CcBy4),
        new("Hummi Sings Hello", "Little Hummi", 132, "131d21b3-bfa9-4bd0-9576-3763d62fb19e", "kids", "Hummi Sings Hello", Licence.Cc0),
        new("Red Light Riddim", "Shanique", 182, "24248a6d-cee8-4765-89e1-b91730787283", "dancehall", "Red Light", Licence.CcBy4),
        new("Fisherman Dawn", "Quiet Harbour", 288, "05fc0c86-9896-4d6d-94ae-66420bdec091", "island-chill", "Slow Tide", Licence.CcBySa4),
        new("Road March Riddim", "Lady Tamboo", 245, "1d827d81-fe98-4fe1-a3b2-b0aab725c8dd", "soca", "Road March Riddim", Licence.Cc0),
        new("Wine Slow", "Marisol Vega", 214, "58574127-daa6-4e91-a17d-e563a94583fc", "soca", "Slow Wine", Licence.CcBy4),
        new("J’ouvert Morning", "Kaiso Collective", 238, "2ccf7ccc-f306-4b30-8bbb-fd5b6289ed11", "soca", "Mas on the Avenue", Licence.Cc0),
        new("Sunrise on Ariapita", "Marisol Vega", 257, "93469f13-cb45-4853-967e-5048ce0bb1b1", "soca", "Slow Wine", Licence.CcBySa4),
        new("Chrome & Copper", "Panorama Players", 312, "f920aaff-78ab-483a-a248-4802cff6140b", "steelpan", "Panyard Sessions", Licence.CcBy4),
        new("Mister Kaiso", "Lord Sundown", 188, "35d90c8b-d4da-48e9-b913-3796f30e0813", "steelpan", "Old Talk", Licence.Cc0),
        new("Panny the Pan", "Beach Band Buddies", 160, "6126bcb0-116f-4123-8335-825b39402296", "kids", "Beach Songs", Licence.Cc0),
        new("Conga in the Jungle", "The Iguana Crew", 175, "9620f04e-71db-4d7c-9a40-3d49303f196e", "kids", "Jungle Songs", Licence.Cc0),
        new("Fruit Salad Band", "Mango & Co.", 146, "e1d39d41-3fd0-407f-a429-d46d4b2b25eb", "kids", "Fruit Salad", Licence.Cc0),
        new("Sound System Sunday", "Yard Frequency", 196, "f0319604-bdd5-42cf-bb4a-f39c13616779", "dancehall", "Dubplates", Licence.CcBy4),
        new("Banana Leaf Rain", "lofi lagoon", 192, "e5921bbd-ca40-418c-8ca8-6300d8d1f0f0", "island-chill", "Lagoon Tapes", Licence.CcBySa4),
        new("The Quiet Between Two Lighthouses, Revisited (Extended Panyard Mix)", "Panorama Players", 439, "f920aaff-78ab-483a-a248-4802cff6140b", "steelpan", "Panyard Sessions", Licence.CcBy4),
    ];

    public static readonly IReadOnlyList<DemoArtist> Artists =
    [
        new("Kaiso Collective", "openmusic-3b", "A soca band generated with an open-weights model. Brass sections, iron rhythm and road-march hooks, recorded live on the Avenue."),
        new("Lady Tamboo", "openmusic-3b", "Big-truck soca for the road, with tamboo bamboo rhythms under every chorus."),
        new("Marisol Vega", "synthbloom-1.5", "Slow-wine soca and sunrise grooves from the Ariapita Avenue end of town."),
        new("Panorama Players", "swingnet-open", "A full steel orchestra rehearsing for Panorama, one long arrangement at a time."),
        new("Lord Sundown", "openmusic-3b", "Kaiso storytelling in the old tent style: picong, wit and a horn section."),
        new("Laventille Steel Orchestra", "swingnet-open", "Panyard sessions recorded after dark on the hill."),
        new("Little Hummi", "openmusic-3b", "Sing-along songs for small listeners, hosted by the Hummi hummingbird."),
        new("Beach Band Buddies", "openmusic-3b", "Steelpan songs for kids, made for the beach and the back seat."),
        new("The Iguana Crew", "openmusic-3b", "Counting songs and conga lines from the rainforest."),
        new("Mango & Co.", "openmusic-3b", "Fruit-stall songs for little ones, sweet and short."),
        new("Yard Frequency", "synthbloom-1.5", "Sound-system riddims for Sunday afternoons."),
        new("Shanique", "synthbloom-1.5", "Late-night dancehall selections with a red-light glow."),
        new("Quiet Harbour", "openmusic-3b", "Slow, sunny island chill for early mornings by the water."),
        new("lofi lagoon", "openmusic-3b", "Rain on banana leaves and tapes from the lagoon."),
    ];

    /// <summary>The year every demo album was released, as the mocks show it.</summary>
    public const int ReleaseYear = 2026;

    /// <summary>The mock's Top 10, most played first.</summary>
    private static readonly string[] TopTen =
    [
        "Big Truck Energy", "Red Light Riddim", "Feathers Up", "Fruit Salad Band", "Panyard Nights",
        "Road March Riddim", "Fisherman Dawn", "Sound System Sunday", "Hummi Sings Hello", "Wine Slow",
    ];

    /// <summary>The confirmed demo listener of the mocks, for signing in to a local install.</summary>
    public const string DemoEmail = "nadia@hummi.fm";

    public const string DemoPassword = "hummi-demo-password";

    /// <summary>Adds the catalogue unless tracks already exist; returns how many tracks it added.</summary>
    public static async Task<int> SeedAsync(IHummiDbContext db, string mediaRoot, TimeProvider clock, CancellationToken cancellationToken = default)
    {
        if (await db.Tracks.AnyAsync(cancellationToken))
        {
            return 0;
        }

        var now = clock.GetUtcNow();
        var genres = await db.Genres.ToDictionaryAsync(g => g.Slug, g => g.Id, cancellationToken);
        var artists = Artists.ToDictionary(a => a.Name, a => Artist.Create(a.Name, a.Model, a.Description));
        db.Artists.AddRange(artists.Values);
        var albums = Tracks.Select(t => (t.Artist, t.Album)).Distinct()
            .ToDictionary(key => key, key => Album.Create(key.Album, artists[key.Artist].Id, ReleaseYear));
        db.Albums.AddRange(albums.Values);
        var albumTracks = albums.Keys.ToDictionary(key => key, _ => new List<Track>());
        Directory.CreateDirectory(Path.Combine(mediaRoot, "tracks"));
        for (var i = 0; i < Tracks.Count; i++)
        {
            var demo = Tracks[i];
            // Listed order is newest first, so Recently added matches the Home mock.
            var onAlbum = albumTracks[(demo.Artist, demo.Album)];
            var track = Track.Create(
                demo.Title,
                artists[demo.Artist].Id,
                demo.Seconds,
                $"{Cdn}{demo.CoverId}.jpg",
                now.AddHours(-i),
                genres.GetValueOrDefault(demo.Genre),
                demo.Licence,
                albumId: albums[(demo.Artist, demo.Album)].Id,
                albumPosition: onAlbum.Count + 1);
            track.SetWaveform(Peaks(seed: i));
            onAlbum.Add(track);
            var rank = Array.IndexOf(TopTen, demo.Title);
            for (var p = 0; rank >= 0 && p < TopTen.Length - rank; p++)
            {
                db.PlayEvents.Add(track.RegisterPlay(null, now));
            }

            db.Tracks.Add(track);
            await File.WriteAllBytesAsync(Path.Combine(mediaRoot, track.AudioPath), Tone(demo.Seconds, seed: i), cancellationToken);
        }

        foreach (var (key, album) in albums)
        {
            album.Publish(albumTracks[key]);
        }

        var listener = Listener.Create("Nadia Charles", DemoEmail, new IdentityPasswordHasher().Hash(DemoPassword), now);
        listener.ConfirmEmail(now);
        db.Listeners.Add(listener);
        foreach (var title in DemoLikes)
        {
            db.TrackLikes.Add(TrackLike.Create(listener.Id, db.Tracks.Local.Single(t => t.Title == title).Id, now));
        }

        foreach (var name in DemoFollows)
        {
            db.ArtistFollows.Add(ArtistFollow.Create(listener.Id, artists[name].Id, now));
        }

        var playlist = Playlist.Create(listener.Id, DemoPlaylist, isPublic: false, now);
        foreach (var title in DemoLikes)
        {
            playlist.AddTrack(db.Tracks.Local.Single(t => t.Title == title).Id, now);
        }

        db.Playlists.Add(playlist);

        await db.SaveChangesAsync(cancellationToken);
        return Tracks.Count;
    }

    /// <summary>64 waveform peaks from 25 to 95, in the shape the track page mock draws, shifted per track.</summary>
    internal static byte[] Peaks(int seed) =>
        [.. Enumerable.Range(seed, 64).Select(i => (byte)(25 + (int)(70 * Math.Abs(Math.Sin(i * 0.7) * Math.Cos(i * 0.21)))))];

    /// <summary>An 8 kHz, 8-bit mono WAV of quiet arpeggiated notes, so each track sounds a little different.</summary>
    internal static byte[] Tone(int seconds, int seed)
    {
        const int rate = 8000;
        int[] semitones = [0, 4, 7, 12, 7, 4];
        var samples = rate * seconds;
        var wav = new byte[44 + samples];
        using (var writer = new BinaryWriter(new MemoryStream(wav)))
        {
            writer.Write("RIFF"u8);
            writer.Write(36 + samples);
            writer.Write("WAVEfmt "u8);
            writer.Write(16);
            writer.Write((short)1);
            writer.Write((short)1);
            writer.Write(rate);
            writer.Write(rate);
            writer.Write((short)1);
            writer.Write((short)8);
            writer.Write("data"u8);
            writer.Write(samples);
        }

        var root = 220.0 * Math.Pow(2, seed % 7 / 12.0);
        for (var n = 0; n < samples; n++)
        {
            var note = semitones[n / (rate / 2) % semitones.Length];
            var frequency = root * Math.Pow(2, note / 12.0);
            wav[44 + n] = (byte)(128 + (24 * Math.Sin(2 * Math.PI * frequency * n / rate)));
        }

        return wav;
    }
}
