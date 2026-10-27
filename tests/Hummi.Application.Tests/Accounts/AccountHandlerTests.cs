using Hummi.Application.Abstractions;
using Hummi.Application.Accounts;
using Hummi.Application.Tests.Playback;
using Hummi.Domain.Accounts;
using Microsoft.EntityFrameworkCore;

namespace Hummi.Application.Tests.Accounts;

public sealed class AccountHandlerTests
{
    private readonly TestDb db = new();
    private readonly FakeClock clock = new(TestDb.Now);
    private readonly FakeEmailSender email = new();
    private readonly FakePasswordHasher hasher = new();
    private readonly FakeLinks links = new();

    private Task<Common.Result<MediatR.Unit>> Register(string name = "Nadia", string address = "nadia@example.com", string password = "a-long-password", bool terms = true) =>
        new RegisterListenerCommandHandler(db, hasher, email, links, clock)
            .Handle(new RegisterListenerCommand(name, address, password, terms), CancellationToken.None);

    private string LinkToken() => email.Sent[^1].Body.Split("token=")[1].Split(Environment.NewLine)[0].Trim();

    [Fact]
    public async Task L2_027_AC4_sign_up_creates_an_unconfirmed_listener_and_emails_a_24_hour_link()
    {
        var result = await Register();

        Assert.True(result.IsSuccess);
        var listener = await db.Listeners.SingleAsync();
        Assert.Equal("nadia@example.com", listener.Email);
        Assert.Equal("hashed:a-long-password", listener.PasswordHash);
        Assert.False(listener.EmailConfirmed);
        var token = await db.EmailTokens.SingleAsync();
        Assert.Equal(TestDb.Now.AddHours(24), token.ExpiresAt);
        var sent = Assert.Single(email.Sent);
        Assert.Equal("nadia@example.com", sent.To);
        Assert.Equal(SecretToken.Hash(LinkToken()), token.TokenHash);
    }

    [Fact]
    public async Task L2_027_AC2_invalid_input_returns_the_field_messages_and_saves_nothing()
    {
        var result = await Register(name: " ", address: "nadia@exam", password: "short", terms: false);

        Assert.Equal(422, result.Error!.Status);
        Assert.Equal("Enter a display name", result.Error.Errors!["displayName"].Message);
        Assert.Equal("That email address looks incomplete", result.Error.Errors["email"].Message);
        Assert.Equal("Use at least 10 characters", result.Error.Errors["password"].Message);
        Assert.Equal("Agree to the terms to continue", result.Error.Errors["acceptedTerms"].Message);
        Assert.Empty(db.Listeners);
        Assert.Empty(email.Sent);
    }

    [Fact]
    public async Task L2_027_AC5_when_the_email_cannot_be_sent_no_account_exists()
    {
        email.Fail = true;

        var result = await Register();

        Assert.Equal(503, result.Error!.Status);
        Assert.Empty(db.Listeners);
        Assert.Empty(db.EmailTokens);
    }

    [Fact]
    public async Task A_registered_email_gets_the_same_answer_and_no_second_account()
    {
        await Register();

        var again = await Register(name: "Someone", address: "NADIA@example.com");

        Assert.True(again.IsSuccess);
        Assert.Single(db.Listeners);
        Assert.Single(email.Sent);
    }

    [Fact]
    public async Task L2_028_AC2_a_fresh_link_confirms_the_email_and_names_the_listener()
    {
        await Register();
        clock.Advance(TimeSpan.FromHours(23));

        var result = await new ConfirmEmailCommandHandler(db, clock).Handle(new ConfirmEmailCommand(LinkToken()), CancellationToken.None);

        Assert.Equal("Nadia", result.Value!.DisplayName);
        Assert.True(result.Value.EmailConfirmed);
        Assert.True((await db.Listeners.SingleAsync()).EmailConfirmed);
    }

    [Fact]
    public async Task L2_028_AC3_a_link_older_than_24_hours_has_expired()
    {
        await Register();
        clock.Advance(TimeSpan.FromHours(25));

        var result = await new ConfirmEmailCommandHandler(db, clock).Handle(new ConfirmEmailCommand(LinkToken()), CancellationToken.None);

        Assert.Equal(410, result.Error!.Status);
        Assert.Equal("LINK_EXPIRED", result.Error.Code);
        Assert.False((await db.Listeners.SingleAsync()).EmailConfirmed);
    }

    [Fact]
    public async Task L2_028_AC3_an_unknown_link_is_refused_as_expired()
    {
        var result = await new ConfirmEmailCommandHandler(db, clock).Handle(new ConfirmEmailCommand("nope"), CancellationToken.None);

        Assert.Equal("LINK_EXPIRED", result.Error!.Code);
    }

    [Fact]
    public async Task L2_028_AC3_send_a_new_link_from_an_expired_one_issues_a_fresh_token_and_closes_the_old()
    {
        await Register();
        var expired = LinkToken();
        clock.Advance(TimeSpan.FromHours(25));

        var result = await new ResendConfirmationCommandHandler(db, email, links, clock)
            .Handle(new ResendConfirmationCommand(null, expired), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, email.Sent.Count);
        var confirm = await new ConfirmEmailCommandHandler(db, clock).Handle(new ConfirmEmailCommand(LinkToken()), CancellationToken.None);
        Assert.True(confirm.IsSuccess);
    }

    [Fact]
    public async Task L2_028_AC4_the_banner_resends_the_email_for_the_signed_in_listener()
    {
        await Register();
        var listener = await db.Listeners.SingleAsync();

        var result = await new ResendConfirmationCommandHandler(db, email, links, clock)
            .Handle(new ResendConfirmationCommand(listener.Id, null), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, email.Sent.Count);
        Assert.Equal(1, await db.EmailTokens.CountAsync(t => t.UsedAt == null));
    }

    private async Task<Listener> Account()
    {
        var listener = Listener.Create("Nadia", "nadia@example.com", hasher.Hash("a-long-password"), TestDb.Now);
        db.Listeners.Add(listener);
        await db.SaveChangesAsync();
        return listener;
    }

    private Task<Common.Result<SessionGrant>> SignIn(string address, string password, bool keep = true) =>
        new SignInCommandHandler(db, hasher, clock).Handle(new SignInCommand(address, password, keep), CancellationToken.None);

    [Fact]
    public async Task L2_029_AC5_correct_credentials_issue_a_persistent_session_when_keep_me_signed_in()
    {
        var listener = await Account();

        var result = await SignIn(" Nadia@Example.com", "a-long-password");

        Assert.Equal(listener.Id, result.Value!.ListenerId);
        Assert.True(result.Value.Persistent);
        Assert.Equal(TestDb.Now.AddDays(30), result.Value.RefreshExpiresAt);
        var stored = await db.RefreshTokens.SingleAsync();
        Assert.Equal(SecretToken.Hash(result.Value.RefreshSecret), stored.TokenHash);
    }

    [Fact]
    public async Task L2_029_AC5_without_keep_me_signed_in_the_session_is_not_persistent()
    {
        await Account();

        var result = await SignIn("nadia@example.com", "a-long-password", keep: false);

        Assert.False(result.Value!.Persistent);
    }

    [Theory]
    [InlineData("nadia@example.com", "wrong-password")]
    [InlineData("nobody@example.com", "a-long-password")]
    public async Task L2_029_AC4_a_wrong_email_or_password_gives_one_error(string address, string password)
    {
        await Account();

        var result = await SignIn(address, password);

        Assert.Equal(401, result.Error!.Status);
        Assert.Equal("INVALID_CREDENTIALS", result.Error.Code);
        Assert.Empty(db.RefreshTokens);
    }

    [Fact]
    public async Task L2_029_AC2_empty_fields_return_both_messages()
    {
        var result = await SignIn("", "");

        Assert.Equal("Enter the email you signed up with", result.Error!.Errors!["email"].Message);
        Assert.Equal("Enter your password", result.Error.Errors["password"].Message);
    }

    [Fact]
    public async Task A_refresh_rotates_the_token_and_keeps_its_persistence()
    {
        await Account();
        var first = (await SignIn("nadia@example.com", "a-long-password", keep: false)).Value!;

        var refreshed = await new RefreshSessionCommandHandler(db, clock).Handle(new RefreshSessionCommand(first.RefreshSecret), CancellationToken.None);
        var replay = await new RefreshSessionCommandHandler(db, clock).Handle(new RefreshSessionCommand(first.RefreshSecret), CancellationToken.None);

        Assert.False(refreshed.Value!.Persistent);
        Assert.NotEqual(first.RefreshSecret, refreshed.Value.RefreshSecret);
        Assert.Equal(401, replay.Error!.Status);
    }

    [Fact]
    public async Task L2_031_AC2_sign_out_revokes_the_refresh_token_and_keeps_the_account()
    {
        await Account();
        var session = (await SignIn("nadia@example.com", "a-long-password")).Value!;

        var result = await new SignOutCommandHandler(db, clock).Handle(new SignOutCommand(session.RefreshSecret), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.False((await db.RefreshTokens.SingleAsync()).IsActive(clock.GetUtcNow()));
        Assert.Single(db.Listeners);
        var refresh = await new RefreshSessionCommandHandler(db, clock).Handle(new RefreshSessionCommand(session.RefreshSecret), CancellationToken.None);
        Assert.False(refresh.IsSuccess);
    }

    [Fact]
    public async Task Me_returns_the_listener_with_the_confirmed_flag()
    {
        var listener = await Account();

        var result = await new GetCurrentListenerQueryHandler(db).Handle(new GetCurrentListenerQuery(listener.Id), CancellationToken.None);

        Assert.Equal(new ListenerDto("Nadia", "nadia@example.com", false), result.Value);
    }
}

internal sealed class FakeClock(DateTimeOffset now) : TimeProvider
{
    private DateTimeOffset now = now;

    public override DateTimeOffset GetUtcNow() => now;

    public void Advance(TimeSpan by) => now += by;
}

internal sealed class FakeEmailSender : IEmailSender
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
}

internal sealed class FakePasswordHasher : IPasswordHasher
{
    public string Hash(string password) => "hashed:" + password;

    public bool Verify(string hash, string password) => hash == "hashed:" + password;
}

internal sealed class FakeLinks : IAppLinks
{
    public Uri VerifyEmail(string token) => new($"https://hummi.test/verify-email?token={token}");
}
