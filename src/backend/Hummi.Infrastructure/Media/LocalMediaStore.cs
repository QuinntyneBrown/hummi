using Hummi.Application.Abstractions;

namespace Hummi.Infrastructure.Media;

/// <summary>Reads media files from a directory, the media volume in production (MediaStorage:RootPath).</summary>
public sealed class LocalMediaStore(string rootPath) : IMediaStore
{
    private static readonly Dictionary<string, string> ContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        [".wav"] = "audio/wav",
        [".mp3"] = "audio/mpeg",
        [".ogg"] = "audio/ogg",
    };

    private readonly string root = Path.GetFullPath(rootPath);

    public MediaFile? Open(string relativePath)
    {
        var full = Path.GetFullPath(Path.Combine(root, relativePath));
        var inside = full.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.Ordinal);
        if (!inside || !File.Exists(full))
        {
            return null;
        }

        var type = ContentTypes.GetValueOrDefault(Path.GetExtension(full), "application/octet-stream");
        return new MediaFile(File.OpenRead(full), type);
    }
}
