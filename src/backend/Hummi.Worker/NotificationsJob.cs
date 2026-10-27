using Hummi.Application.Library;
using MediatR;

namespace Hummi.Worker;

/// <summary>
/// Creates release and play-milestone notifications (L2-036): every <see cref="Interval"/> it notifies the
/// followers of artists with new tracks or tracks that passed a milestone. A failed run is retried next tick.
/// </summary>
public sealed class NotificationsJob(IServiceScopeFactory scopes, ILogger<NotificationsJob>? logger = null) : BackgroundService
{
    public static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        do
        {
            try
            {
                using var scope = scopes.CreateScope();
                await scope.ServiceProvider.GetRequiredService<ISender>().Send(new CreateDueNotificationsCommand(), stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger?.LogError(ex, "Creating notifications failed; retrying in {Interval}", Interval);
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
