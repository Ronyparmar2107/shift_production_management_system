# ---------- 1. Build ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs
WORKDIR /src
COPY . .
RUN dotnet publish SPMS.Server/SPMS.Server.csproj -c Release -o /app/publish

# ---------- 2. Run ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000
ENTRYPOINT ["dotnet", "SPMS.Server.dll"]