namespace Hummi.Application.Abstractions;

/// <summary>
/// The persistence port. Application code talks to the database only through this interface;
/// <c>Hummi.Infrastructure</c> implements it. Add one <c>DbSet</c> property per aggregate.
/// </summary>
public interface IHummiDbContext
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
