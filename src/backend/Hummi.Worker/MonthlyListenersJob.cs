using Hummi.Application.Catalogue;
using MediatR;

namespace Hummi.Worker;

/// <summary>
/// Keeps artists' monthly listener counts current (L2-010): refreshes them when the worker starts and
/// then every <see cref="Interval"/>. A failed run is logged and retried on the next tick.
/// </summary>
public sealed class MonthlyListenersJob(IServiceScopeFactory scopes, ILogger<MonthlyListenersJob>? logger = null) : BackgroundService
{
    public static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        do
        {
            try
            {
                using var scope = scopes.CreateScope();
                await scope.ServiceProvider.GetRequiredService<ISender>().Send(new RefreshMonthlyListenersCommand(), stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger?.LogError(ex, "Refreshing monthly listeners failed; retrying in {Interval}", Interval);
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
