using Hummi.Application.Abstractions;
using Hummi.Infrastructure.Accounts;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Hummi.Infrastructure.Tests.Accounts;

public sealed class AccountAdapterTests
{
    [Fact]
    public void The_password_hasher_verifies_only_the_hashed_password()
    {
        var hasher = new IdentityPasswordHasher();

        var hash = hasher.Hash("a-long-password");

        Assert.DoesNotContain("a-long-password", hash, StringComparison.Ordinal);
        Assert.True(hasher.Verify(hash, "a-long-password"));
        Assert.False(hasher.Verify(hash, "another-password"));
    }

    [Fact]
    public void Links_point_at_the_public_web_app()
    {
        var links = new AppLinks(new Uri("https://www.hummi.example/"));

        Assert.Equal("https://www.hummi.example/verify-email?token=abc-_1", links.VerifyEmail("abc-_1").ToString());
    }

    [Fact]
    public void Smtp_settings_come_from_configuration_without_connecting()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:Hummi"] = "Server=unset",
            ["App:BaseUrl"] = "https://www.hummi.example",
            ["Email:Smtp:Host"] = "smtp.example",
            ["Email:Smtp:Port"] = "2525",
            ["Email:From"] = "Hummi <hello@hummi.example>",
        }).Build();
        var services = new ServiceCollection().AddInfrastructure(configuration).BuildServiceProvider();

        var sender = Assert.IsType<SmtpEmailSender>(services.GetRequiredService<IEmailSender>());

        Assert.Equal("smtp.example", sender.Options.Host);
        Assert.Equal(2525, sender.Options.Port);
        Assert.Equal("Hummi <hello@hummi.example>", sender.Options.From);
    }

    [Fact]
    public async Task An_unreachable_smtp_server_is_reported_as_not_sent()
    {
        var sender = new SmtpEmailSender(new SmtpOptions { Host = "127.0.0.1", Port = 1, From = "hello@hummi.example" });

        await Assert.ThrowsAsync<EmailNotSentException>(() =>
            sender.SendAsync(new EmailMessage("nadia@example.com", "Hi", "Body"), CancellationToken.None));
    }
}
