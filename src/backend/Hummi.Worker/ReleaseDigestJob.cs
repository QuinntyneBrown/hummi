using Hummi.Application.Accounts;
using MediatR;

namespace Hummi.Worker;

/// <summary>
/// Sends the weekly release digest (L2-035 AC2): every <see cref="Interval"/> it emails the listeners whose
/// last digest is a week old and whose followed artists added tracks. A failed run is retried next tick.
/// </summary>
public sealed class ReleaseDigestJob(IServiceScopeFactory scopes, ILogger<ReleaseDigestJob>? logger = null) : BackgroundService
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
                await scope.ServiceProvider.GetRequiredService<ISender>().Send(new SendReleaseDigestsCommand(), stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger?.LogError(ex, "Sending release digests failed; retrying in {Interval}", Interval);
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
