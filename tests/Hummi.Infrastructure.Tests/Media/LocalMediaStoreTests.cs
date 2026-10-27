using Hummi.Infrastructure.Media;

namespace Hummi.Infrastructure.Tests.Media;

/// <summary>The adapter's own subject is the file system, so these tests use a throwaway directory.</summary>
public sealed class LocalMediaStoreTests : IDisposable
{
    private readonly string root = Directory.CreateTempSubdirectory("hummi-media-").FullName;

    public void Dispose() => Directory.Delete(root, recursive: true);

    [Fact]
    public void Opens_a_file_under_the_root_with_its_content_type()
    {
        Directory.CreateDirectory(Path.Combine(root, "tracks"));
        File.WriteAllBytes(Path.Combine(root, "tracks", "a.wav"), [1, 2, 3]);

        using var file = new LocalMediaStore(root).Open("tracks/a.wav")!.Content;

        Assert.Equal(3, file.Length);
        Assert.True(file.CanSeek);
    }

    [Fact]
    public void Reports_the_wav_content_type()
    {
        Directory.CreateDirectory(Path.Combine(root, "tracks"));
        File.WriteAllBytes(Path.Combine(root, "tracks", "a.wav"), [1]);

        var file = new LocalMediaStore(root).Open("tracks/a.wav")!;
        file.Content.Dispose();

        Assert.Equal("audio/wav", file.ContentType);
    }

    [Fact]
    public void A_missing_file_is_null()
    {
        Assert.Null(new LocalMediaStore(root).Open("tracks/missing.wav"));
    }

    [Fact]
    public void A_path_outside_the_root_is_refused()
    {
        File.WriteAllBytes(Path.Combine(Path.GetDirectoryName(root)!, "outside.wav"), [1]);

        Assert.Null(new LocalMediaStore(root).Open("../outside.wav"));
    }
}
