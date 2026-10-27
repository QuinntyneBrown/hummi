using Microsoft.Extensions.DependencyInjection;

namespace Hummi.Application;

public static class DependencyInjection
{
    /// <summary>Registers the MediatR handlers and application services.</summary>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(config => config.RegisterServicesFromAssemblyContaining(typeof(DependencyInjection)));
        return services;
    }
}
