using Hummi.Application.Abstractions;
using Hummi.Infrastructure.Media;
using Hummi.Infrastructure.Persistence;
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
        services.AddSingleton(TimeProvider.System);
        var mediaRoot = configuration["MediaStorage:RootPath"] is { Length: > 0 } root ? root : Path.Combine(AppContext.BaseDirectory, "media");
        services.AddSingleton<IMediaStore>(new LocalMediaStore(mediaRoot));
        return services;
    }
}
