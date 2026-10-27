using Hummi.Application;
using Hummi.Infrastructure;
using Hummi.Worker;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHostedService<Worker>();
builder.Services.AddHostedService<MonthlyListenersJob>();
builder.Services.AddHostedService<ReleaseDigestJob>();
builder.Services.AddHostedService<NotificationsJob>();

var host = builder.Build();
host.Run();
