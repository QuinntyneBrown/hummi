using Hummi.Application.Abstractions;
using Hummi.Infrastructure.Accounts;
using Hummi.Infrastructure.Media;
using Hummi.Infrastructure.Persistence;
using Hummi.Infrastructure.Search;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Hummi.Infrastructure;

public static class DependencyInjection
{
    /// <summary>Registers the Hummi database and the adapters behind the application ports.</summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<HummiDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("Hummi")));
        services.AddScoped<IHummiDbContext>(sp => sp.GetRequiredService<HummiDbContext>());
        services.AddScoped<ISearchIndex, SqlSearchIndex>();
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<IPasswordHasher, IdentityPasswordHasher>();
        var smtp = configuration.GetSection("Email:Smtp").Get<SmtpOptions>() ?? new SmtpOptions();
        smtp.From = configuration["Email:From"] is { Length: > 0 } from ? from : smtp.From;
        services.AddSingleton<IEmailSender>(new SmtpEmailSender(smtp));
        var baseUrl = configuration["App:BaseUrl"] is { Length: > 0 } url ? url : "http://localhost:4200";
        services.AddSingleton<IAppLinks>(new AppLinks(new Uri(baseUrl)));
        var mediaRoot = configuration["MediaStorage:RootPath"] is { Length: > 0 } root ? root : Path.Combine(AppContext.BaseDirectory, "media");
        services.AddSingleton<IMediaStore>(new LocalMediaStore(mediaRoot));
        return services;
    }
}
