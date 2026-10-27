using System.Text.Json;
using System.Text.Json.Serialization;
using Hummi.Api.Auth;
using Hummi.Application;
using Hummi.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Enums travel as camelCase strings, e.g. the licence "ccBySa4".
builder.Services.AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)));
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHummiAuth(builder.Configuration);

var app = builder.Build();

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

/// <summary>Entry point, exposed to WebApplicationFactory in Hummi.Api.Tests.</summary>
public partial class Program;
