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

    DbSet<Genre> Genres { get; }

    DbSet<Album> Albums { get; }

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

/// <summary>
/// The search port (ADR 0008): ranked songs and artists whose title or name contains the text. Only
/// published tracks, and artists with at least one, are returned. Throws
/// <see cref="SearchUnavailableException"/> when the index cannot be reached.
/// </summary>
public interface ISearchIndex
{
    Task<SearchHits> SearchAsync(string text, int artistTake, int trackTake, CancellationToken cancellationToken);
}

/// <summary>What the index found, best match first.</summary>
public sealed record SearchHits(IReadOnlyList<Search.ArtistHitDto> Artists, IReadOnlyList<Playback.TrackSummaryDto> Tracks);

/// <summary>The search index could not answer; the API reports 503 SEARCH_UNAVAILABLE.</summary>
public sealed class SearchUnavailableException(Exception innerException)
    : Exception("The search index is unreachable.", innerException);
