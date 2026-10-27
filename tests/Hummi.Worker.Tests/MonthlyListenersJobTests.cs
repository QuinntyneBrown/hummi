using Hummi.Application.Catalogue;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace Hummi.Worker.Tests;

public sealed class MonthlyListenersJobTests
{
    [Fact]
    public void L2_010_the_job_runs_hourly()
    {
        Assert.Equal(TimeSpan.FromHours(1), MonthlyListenersJob.Interval);
    }

    [Fact]
    public async Task L2_010_the_job_refreshes_monthly_listeners_as_soon_as_it_starts()
    {
        var sender = new RecordingSender();
        using var services = new ServiceCollection().AddSingleton<ISender>(sender).BuildServiceProvider();
        using var job = new MonthlyListenersJob(services.GetRequiredService<IServiceScopeFactory>());

        await job.StartAsync(CancellationToken.None);
        var first = await sender.FirstRequest.Task.WaitAsync(TimeSpan.FromSeconds(5));
        await job.StopAsync(CancellationToken.None);

        Assert.IsType<RefreshMonthlyListenersCommand>(first);
    }

    [Fact]
    public async Task L2_035_the_digest_job_sends_digests_hourly_from_the_start()
    {
        var sender = new RecordingSender();
        using var services = new ServiceCollection().AddSingleton<ISender>(sender).BuildServiceProvider();
        using var job = new ReleaseDigestJob(services.GetRequiredService<IServiceScopeFactory>());

        await job.StartAsync(CancellationToken.None);
        var first = await sender.FirstRequest.Task.WaitAsync(TimeSpan.FromSeconds(5));
        await job.StopAsync(CancellationToken.None);

        Assert.Equal(TimeSpan.FromHours(1), ReleaseDigestJob.Interval);
        Assert.IsType<Hummi.Application.Accounts.SendReleaseDigestsCommand>(first);
    }

    [Fact]
    public async Task L2_036_the_notifications_job_sweeps_every_15_minutes_from_the_start()
    {
        var sender = new RecordingSender();
        using var services = new ServiceCollection().AddSingleton<ISender>(sender).BuildServiceProvider();
        using var job = new NotificationsJob(services.GetRequiredService<IServiceScopeFactory>());

        await job.StartAsync(CancellationToken.None);
        var first = await sender.FirstRequest.Task.WaitAsync(TimeSpan.FromSeconds(5));
        await job.StopAsync(CancellationToken.None);

        Assert.Equal(TimeSpan.FromMinutes(15), NotificationsJob.Interval);
        Assert.IsType<Hummi.Application.Library.CreateDueNotificationsCommand>(first);
    }

    /// <summary>A fake mediator that keeps the first request it is sent.</summary>
    private sealed class RecordingSender : ISender
    {
        public TaskCompletionSource<object> FirstRequest { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken cancellationToken = default)
        {
            FirstRequest.TrySetResult(request);
            return Task.FromResult(default(TResponse)!);
        }

        public Task Send<TRequest>(TRequest request, CancellationToken cancellationToken = default)
            where TRequest : IRequest
        {
            FirstRequest.TrySetResult(request!);
            return Task.CompletedTask;
        }

        public Task<object?> Send(object request, CancellationToken cancellationToken = default)
        {
            FirstRequest.TrySetResult(request);
            return Task.FromResult<object?>(null);
        }

        public IAsyncEnumerable<TResponse> CreateStream<TResponse>(IStreamRequest<TResponse> request, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public IAsyncEnumerable<object?> CreateStream(object request, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
    }
}
