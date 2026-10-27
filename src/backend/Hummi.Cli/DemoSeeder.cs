using Hummi.Application.Abstractions;
using Hummi.Domain.Catalogue;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Cli;

/// <summary>
/// Writes the demo catalogue of the mocks (docs/mocks/_build/kit.py) into a local install: artists,
/// tracks, plays that order the Top 10, and a generated WAV per track on the media volume. There is no
/// upload tooling; this is how a local install gets music.
/// </summary>
public static class DemoSeeder
{
    private const string Cdn = "https://cdn.magicpatterns.com/patterns/generated-images/";

    /// <summary>A demo track; Genre is the slug of one of the fixed genres.</summary>
    public sealed record DemoTrack(string Title, string Artist, int Seconds, string CoverId, string Genre);

    public static readonly IReadOnlyList<DemoTrack> Tracks =
    [
        new("Feathers Up", "Kaiso Collective", 222, "9b9fc48a-3ebb-4459-991e-afb5a29c3e35", "soca"),
        new("Big Truck Energy", "Lady Tamboo", 201, "fe585510-ffc6-478e-81f0-6608a23b6665", "soca"),
        new("Panyard Nights", "Laventille Steel Orchestra", 400, "896df414-e435-4a74-b519-c4a5af63cda6", "steelpan"),
        new("Hummi Sings Hello", "Little Hummi", 132, "131d21b3-bfa9-4bd0-9576-3763d62fb19e", "kids"),
        new("Red Light Riddim", "Shanique", 182, "24248a6d-cee8-4765-89e1-b91730787283", "dancehall"),
        new("Fisherman Dawn", "Quiet Harbour", 288, "05fc0c86-9896-4d6d-94ae-66420bdec091", "island-chill"),
        new("Road March Riddim", "Lady Tamboo", 245, "1d827d81-fe98-4fe1-a3b2-b0aab725c8dd", "soca"),
        new("Wine Slow", "Marisol Vega", 214, "58574127-daa6-4e91-a17d-e563a94583fc", "soca"),
        new("J’ouvert Morning", "Kaiso Collective", 238, "2ccf7ccc-f306-4b30-8bbb-fd5b6289ed11", "soca"),
        new("Sunrise on Ariapita", "Marisol Vega", 257, "93469f13-cb45-4853-967e-5048ce0bb1b1", "soca"),
        new("Chrome & Copper", "Panorama Players", 312, "f920aaff-78ab-483a-a248-4802cff6140b", "steelpan"),
        new("Mister Kaiso", "Lord Sundown", 188, "35d90c8b-d4da-48e9-b913-3796f30e0813", "steelpan"),
        new("Panny the Pan", "Beach Band Buddies", 160, "6126bcb0-116f-4123-8335-825b39402296", "kids"),
        new("Conga in the Jungle", "The Iguana Crew", 175, "9620f04e-71db-4d7c-9a40-3d49303f196e", "kids"),
        new("Fruit Salad Band", "Mango & Co.", 146, "e1d39d41-3fd0-407f-a429-d46d4b2b25eb", "kids"),
        new("Sound System Sunday", "Yard Frequency", 196, "f0319604-bdd5-42cf-bb4a-f39c13616779", "dancehall"),
        new("Banana Leaf Rain", "lofi lagoon", 192, "e5921bbd-ca40-418c-8ca8-6300d8d1f0f0", "island-chill"),
        new("The Quiet Between Two Lighthouses, Revisited (Extended Panyard Mix)", "Panorama Players", 439, "f920aaff-78ab-483a-a248-4802cff6140b", "steelpan"),
    ];

    /// <summary>The mock's Top 10, most played first.</summary>
    private static readonly string[] TopTen =
    [
        "Big Truck Energy", "Red Light Riddim", "Feathers Up", "Fruit Salad Band", "Panyard Nights",
        "Road March Riddim", "Fisherman Dawn", "Sound System Sunday", "Hummi Sings Hello", "Wine Slow",
    ];

    /// <summary>Adds the catalogue unless tracks already exist; returns how many tracks it added.</summary>
    public static async Task<int> SeedAsync(IHummiDbContext db, string mediaRoot, TimeProvider clock, CancellationToken cancellationToken = default)
    {
        if (await db.Tracks.AnyAsync(cancellationToken))
        {
            return 0;
        }

        var now = clock.GetUtcNow();
        var genres = await db.Genres.ToDictionaryAsync(g => g.Slug, g => g.Id, cancellationToken);
        var artists = Tracks.Select(t => t.Artist).Distinct().ToDictionary(name => name, Artist.Create);
        db.Artists.AddRange(artists.Values);
        Directory.CreateDirectory(Path.Combine(mediaRoot, "tracks"));
        for (var i = 0; i < Tracks.Count; i++)
        {
            var demo = Tracks[i];
            // Listed order is newest first, so Recently added matches the Home mock.
            var track = Track.Create(demo.Title, artists[demo.Artist].Id, demo.Seconds, $"{Cdn}{demo.CoverId}.jpg", now.AddHours(-i), genres.GetValueOrDefault(demo.Genre));
            var rank = Array.IndexOf(TopTen, demo.Title);
            for (var p = 0; rank >= 0 && p < TopTen.Length - rank; p++)
            {
                db.PlayEvents.Add(track.RegisterPlay(null, now));
            }

            db.Tracks.Add(track);
            await File.WriteAllBytesAsync(Path.Combine(mediaRoot, track.AudioPath), Tone(demo.Seconds, seed: i), cancellationToken);
        }

        await db.SaveChangesAsync(cancellationToken);
        return Tracks.Count;
    }

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
