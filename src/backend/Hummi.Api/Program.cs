using Hummi.Api.Auth;
using Hummi.Application;
using Hummi.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHummiAuth(builder.Configuration);

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

/// <summary>Entry point, exposed to WebApplicationFactory in Hummi.Api.Tests.</summary>
public partial class Program;
