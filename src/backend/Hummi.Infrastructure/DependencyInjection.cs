using Hummi.Application.Abstractions;
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
        return services;
    }
}
