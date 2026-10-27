using Hummi.Api.Http;
using Hummi.Application.Common;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Hummi.Api.Auth;

/// <summary>Answers 401 and 403 as problem details.</summary>
public sealed class ProblemAuthorizationResultHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _default = new();

    public Task HandleAsync(RequestDelegate next, HttpContext context, AuthorizationPolicy policy, PolicyAuthorizationResult result)
    {
        if (result.Challenged)
        {
            return ProblemResults.WriteAsync(context, new Error(401, "UNAUTHENTICATED", "Sign in to continue"));
        }

        if (result.Forbidden)
        {
            return ProblemResults.WriteAsync(context, new Error(403, "FORBIDDEN", "You can't do that"));
        }

        return _default.HandleAsync(next, context, policy, result);
    }
}

public static class AuthSetup
{
    public static IServiceCollection AddHummiAuth(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<AuthOptions>(configuration.GetSection("Auth"));
        services.AddSingleton<SessionCookies>();
        services.AddSingleton<IAuthorizationMiddlewareResultHandler, ProblemAuthorizationResultHandler>();

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<AuthOptions>, TimeProvider>((jwt, auth, clock) =>
            {
                jwt.MapInboundClaims = false;
                jwt.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidIssuer = auth.Value.Issuer,
                    ValidAudience = auth.Value.Issuer,
                    IssuerSigningKey = auth.Value.Key,
                    ClockSkew = TimeSpan.Zero,
                    LifetimeValidator = (notBefore, expires, _, _) =>
                    {
                        var now = clock.GetUtcNow().UtcDateTime;
                        return (notBefore is null || notBefore <= now) && expires > now;
                    },
                };
                jwt.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        context.Token = context.Request.Cookies[SessionCookies.AccessCookie];
                        return Task.CompletedTask;
                    },
                };
            });

        services.AddAuthorization();
        return services;
    }
}
