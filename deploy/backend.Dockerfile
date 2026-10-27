# Builds the three backend services from one restore. Build context: src/backend.
#   docker build -f ../../deploy/backend.Dockerfile --target api .
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Directory.Build.props global.json Hummi.sln ./
COPY Hummi.Domain/Hummi.Domain.csproj Hummi.Domain/
COPY Hummi.Application/Hummi.Application.csproj Hummi.Application/
COPY Hummi.Infrastructure/Hummi.Infrastructure.csproj Hummi.Infrastructure/
COPY Hummi.Api/Hummi.Api.csproj Hummi.Api/
COPY Hummi.Worker/Hummi.Worker.csproj Hummi.Worker/
COPY Hummi.Migrator/Hummi.Migrator.csproj Hummi.Migrator/
RUN dotnet restore Hummi.Api/Hummi.Api.csproj \
 && dotnet restore Hummi.Worker/Hummi.Worker.csproj \
 && dotnet restore Hummi.Migrator/Hummi.Migrator.csproj
COPY . .
RUN dotnet publish Hummi.Api/Hummi.Api.csproj -c Release --no-restore -o /out/api \
 && dotnet publish Hummi.Worker/Hummi.Worker.csproj -c Release --no-restore -o /out/worker \
 && dotnet publish Hummi.Migrator/Hummi.Migrator.csproj -c Release --no-restore -o /out/migrator

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS api
WORKDIR /app
COPY --from=build /out/api .
RUN mkdir -p /data/media && chown app:app /data/media
ENV ASPNETCORE_URLS=http://+:8080 DOTNET_ENVIRONMENT=Production
EXPOSE 8080
USER app
ENTRYPOINT ["dotnet", "Hummi.Api.dll"]

FROM mcr.microsoft.com/dotnet/runtime:10.0 AS worker
WORKDIR /app
COPY --from=build /out/worker .
RUN mkdir -p /data/media && chown app:app /data/media
ENV DOTNET_ENVIRONMENT=Production
USER app
ENTRYPOINT ["dotnet", "Hummi.Worker.dll"]

FROM mcr.microsoft.com/dotnet/runtime:10.0 AS migrator
WORKDIR /app
COPY --from=build /out/migrator .
USER app
ENTRYPOINT ["dotnet", "Hummi.Migrator.dll"]
