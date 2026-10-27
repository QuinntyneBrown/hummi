using Hummi.Application.Abstractions;
using Hummi.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Hummi.Api.Tests.Accounts;

/// <summary>The API over an EF Core in-memory database with a fake email sender; nothing external.</summary>
public sealed class AuthApiFactory : WebApplicationFactory<Program>
{
    private readonly string databaseName = Guid.NewGuid().ToString();

    public FakeEmailSender Email { get; } = new();

    public int RequestsPerMinute { get; init; } = 100;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Auth:RequestsPerMinute", RequestsPerMinute.ToString(System.Globalization.CultureInfo.InvariantCulture));
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<HummiDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<HummiDbContext>>();
            services.AddDbContext<HummiDbContext>(options => options.UseInMemoryDatabase(databaseName));
            services.RemoveAll<IEmailSender>();
            services.AddSingleton<IEmailSender>(Email);
        });
    }

    /// <summary>A client over https, so the Secure session cookies round-trip.</summary>
    public HttpClient CreateHttpsClient() =>
        CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

    public T Query<T>(Func<HummiDbContext, T> query)
    {
        using var scope = Services.CreateScope();
        return query(scope.ServiceProvider.GetRequiredService<HummiDbContext>());
    }
}

public sealed class FakeEmailSender : IEmailSender
{
    public List<EmailMessage> Sent { get; } = [];

    public bool Fail { get; set; }

    public Task SendAsync(EmailMessage message, CancellationToken cancellationToken)
    {
        if (Fail)
        {
            throw new EmailNotSentException(new InvalidOperationException("SMTP down"));
        }

        Sent.Add(message);
        return Task.CompletedTask;
    }

    /// <summary>The token of the last confirmation link sent.</summary>
    public string LastToken() => Uri.UnescapeDataString(Sent[^1].Body.Split("token=")[1].Split(Environment.NewLine)[0].Trim());
}
