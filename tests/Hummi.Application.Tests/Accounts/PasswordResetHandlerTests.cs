using Hummi.Application.Accounts;
using Hummi.Application.Tests.Playback;
using Hummi.Domain.Accounts;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Tests.Accounts;

public sealed class PasswordResetHandlerTests
{
    private readonly TestDb db = new();
    private readonly FakeClock clock = new(TestDb.Now);
    private readonly FakeEmailSender email = new();
    private readonly FakePasswordHasher hasher = new();
    private readonly FakeLinks links = new();

    private async Task<Listener> Account()
    {
        var listener = Listener.Create("Nadia", "nadia@example.com", hasher.Hash("a-long-password"), TestDb.Now);
        db.Listeners.Add(listener);
        await db.SaveChangesAsync();
        return listener;
    }

    private Task<Common.Result<MediatR.Unit>> Request(string address = "nadia@example.com") =>
        new RequestPasswordResetCommandHandler(db, email, links, clock)
            .Handle(new RequestPasswordResetCommand(address), CancellationToken.None);

    private Task<Common.Result<MediatR.Unit>> Reset(string token, string password = "a-new-long-password") =>
        new ResetPasswordCommandHandler(db, hasher, clock)
            .Handle(new ResetPasswordCommand(token, password), CancellationToken.None);

    private string LinkToken() => email.Sent[^1].Body.Split("token=")[1].Split(Environment.NewLine)[0].Trim();

    [Fact]
    public async Task L2_030_AC4_a_known_email_gets_a_1_hour_reset_link()
    {
        var listener = await Account();

        var result = await Request(" Nadia@Example.com ");

        Assert.True(result.IsSuccess);
        var sent = Assert.Single(email.Sent);
        Assert.Equal("nadia@example.com", sent.To);
        Assert.Contains("https://hummi.test/new-password?token=", sent.Body, StringComparison.Ordinal);
        var token = await db.EmailTokens.SingleAsync();
        Assert.Equal(EmailTokenPurpose.ResetPassword, token.Purpose);
        Assert.Equal(listener.Id, token.ListenerId);
        Assert.Equal(TestDb.Now.AddHours(1), token.ExpiresAt);
        Assert.Equal(SecretToken.Hash(LinkToken()), token.TokenHash);
    }

    [Fact]
    public async Task L2_030_AC4_an_unknown_email_gets_the_same_answer_and_no_email()
    {
        await Account();

        var result = await Request("nobody@example.com");

        Assert.True(result.IsSuccess);
        Assert.Empty(email.Sent);
        Assert.Empty(db.EmailTokens);
    }

    [Fact]
    public async Task L2_030_AC2_an_empty_email_is_refused_with_the_field_message()
    {
        var result = await Request(" ");

        Assert.Equal(422, result.Error!.Status);
        Assert.Equal("Enter the email you signed up with", result.Error.Errors!["email"].Message);
    }

    [Fact]
    public async Task L2_030_AC6_when_the_email_cannot_be_sent_the_request_fails()
    {
        await Account();
        email.Fail = true;

        var result = await Request();

        Assert.Equal(503, result.Error!.Status);
        Assert.Equal("We couldn’t send the email", result.Error.Title);
    }

    [Fact]
    public async Task A_new_request_closes_the_open_reset_links()
    {
        await Account();
        await Request();
        var first = LinkToken();
        await Request();

        Assert.Equal("LINK_EXPIRED", (await Reset(first)).Error!.Code);
        Assert.True((await Reset(LinkToken())).IsSuccess);
    }

    [Fact]
    public async Task L2_055_AC4_a_fresh_link_changes_the_password_and_signs_out_every_session()
    {
        var listener = await Account();
        db.RefreshTokens.Add(RefreshToken.Issue(listener.Id, true, TestDb.Now).Token);
        db.RefreshTokens.Add(RefreshToken.Issue(listener.Id, false, TestDb.Now).Token);
        await db.SaveChangesAsync();
        await Request();
        clock.Advance(TimeSpan.FromMinutes(59));

        var result = await Reset(LinkToken());

        Assert.True(result.IsSuccess);
        Assert.Equal("hashed:a-new-long-password", (await db.Listeners.SingleAsync()).PasswordHash);
        Assert.All(await db.RefreshTokens.ToListAsync(), t => Assert.False(t.IsActive(clock.GetUtcNow())));
    }

    [Fact]
    public async Task L2_055_AC4_a_used_link_cannot_be_used_again()
    {
        await Account();
        await Request();
        var token = LinkToken();
        await Reset(token);

        var again = await Reset(token, "another-long-password");

        Assert.Equal(410, again.Error!.Status);
        Assert.Equal("hashed:a-new-long-password", (await db.Listeners.SingleAsync()).PasswordHash);
    }

    [Fact]
    public async Task L2_030_AC5_a_link_older_than_1_hour_no_longer_resets_the_password()
    {
        await Account();
        await Request();
        clock.Advance(TimeSpan.FromMinutes(61));

        var result = await Reset(LinkToken());

        Assert.Equal(410, result.Error!.Status);
        Assert.Equal("LINK_EXPIRED", result.Error.Code);
        Assert.Equal("hashed:a-long-password", (await db.Listeners.SingleAsync()).PasswordHash);
    }

    [Fact]
    public async Task L2_055_AC5_an_unknown_link_or_a_confirmation_link_is_refused_as_expired()
    {
        var listener = await Account();
        var (confirm, secret) = EmailToken.Issue(listener.Id, EmailTokenPurpose.ConfirmEmail, TestDb.Now);
        db.EmailTokens.Add(confirm);
        await db.SaveChangesAsync();

        Assert.Equal("LINK_EXPIRED", (await Reset("nope")).Error!.Code);
        Assert.Equal("LINK_EXPIRED", (await Reset(secret)).Error!.Code);
    }

    [Fact]
    public async Task L2_055_AC2_a_short_password_is_refused_and_keeps_the_link()
    {
        await Account();
        await Request();

        var result = await Reset(LinkToken(), "short");

        Assert.Equal(422, result.Error!.Status);
        Assert.Equal("Use at least 10 characters", result.Error.Errors!["password"].Message);
        Assert.Null((await db.EmailTokens.SingleAsync()).UsedAt);
    }
}
