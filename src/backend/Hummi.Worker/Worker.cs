namespace Hummi.Worker;

/// <summary>Host for background jobs; add each job as its own hosted service.</summary>
public sealed class Worker : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken stoppingToken) => Task.CompletedTask;
}
