namespace Hummi.Application.Common;

/// <summary>
/// The text of an id as the API returns it: <see cref="Guid.ToString()"/>, lower-case. Used in the final projection
/// of a query, where EF Core runs it on the client: SQL Server would otherwise convert a uniqueidentifier to
/// upper-case text, and ids built in memory (likes, playlist entries, fresh badges) would no longer match.
/// </summary>
public static class IdText
{
    public static string Of(Guid id) => id.ToString();
}
