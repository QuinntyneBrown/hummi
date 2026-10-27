namespace Hummi.Worker.Tests;

public sealed class WorkerTests
{
    [Fact]
    public async Task The_host_service_completes_immediately()
    {
        using var worker = new Worker();

        await worker.StartAsync(CancellationToken.None);
        await worker.StopAsync(CancellationToken.None);
    }
}
