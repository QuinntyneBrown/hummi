using Hummi.Domain.Catalogue;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Abstractions;

/// <summary>
/// The persistence port. Application code talks to the database only through this interface;
/// <c>Hummi.Infrastructure</c> implements it. Add one <c>DbSet</c> property per aggregate.
/// </summary>
public interface IHummiDbContext
{
    DbSet<Artist> Artists { get; }

    DbSet<Track> Tracks { get; }

    DbSet<PlayEvent> PlayEvents { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

/// <summary>The media volume port: audio files by their path relative to the media root.</summary>
public interface IMediaStore
{
    /// <summary>Opens a seekable stream over the file, or returns null when it does not exist.</summary>
    MediaFile? Open(string relativePath);
}

/// <summary>An open media file. The caller disposes <see cref="Content"/>.</summary>
public sealed record MediaFile(Stream Content, string ContentType);
