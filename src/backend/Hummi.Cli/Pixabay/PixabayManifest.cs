using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Hummi.Cli.Pixabay;

/// <summary>A licence as the track's page names it and its licence page states it.</summary>
public sealed record ManifestLicence(string Name, string Url, string Text);

/// <summary>One imported Pixabay track: everything here is read from its page or computed from its file.</summary>
public sealed record ManifestTrack(
    long PixabayId,
    string SourceUrl,
    string Title,
    string Artist,
    string? ArtistUrl,
    int DurationSeconds,
    string? Genre,
    IReadOnlyList<string> Tags,
    string? CoverUrl,
    string AudioUrl,
    string AudioFile,
    long AudioBytes,
    string AudioSha256,
    ManifestLicence Licence,
    DateTimeOffset ImportedAt);

/// <summary>
/// The catalogue's source of truth (ADR 0021): the Pixabay track pages to import and the tracks imported from
/// them. Audio is not committed; <see cref="ManifestTrack.AudioUrl"/> and its SHA-256 restore it.
/// </summary>
public sealed class PixabayManifest
{
    /// <summary>The manifest next to the CLI binary, copied there from Catalogue/pixabay-manifest.json.</summary>
    public static string DefaultPath => Path.Combine(AppContext.BaseDirectory, "Catalogue", "pixabay-manifest.json");

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        DefaultIgnoreCondition = JsonIgnoreCondition.Never,
    };

    /// <summary>What the file is, for whoever opens it.</summary>
    public string About { get; set; } =
        "Hummi's catalogue (ADR 0021). Add Pixabay music track pages to sources, then run `hummi import` to fill tracks and the media cache, and `hummi seed` to write them into a database.";

    public List<string> Sources { get; set; } = [];

    public List<ManifestTrack> Tracks { get; set; } = [];

    public static PixabayManifest Load(string path) =>
        JsonSerializer.Deserialize<PixabayManifest>(File.ReadAllText(path), Json)
        ?? throw new InvalidDataException($"{path} is not a Pixabay manifest.");

    public void Save(string path) => File.WriteAllText(path, JsonSerializer.Serialize(this, Json) + "\n");
}
