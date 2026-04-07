# Use the official .NET SDK to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# THE WILDCARD TRICK: Grab any .csproj file regardless of exact casing
COPY *.csproj ./
RUN dotnet restore

# Copy the rest of the code and compile it
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Use the lighter ASP.NET runtime to actually run the app
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Tell Render what port to use
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

# Start the application
ENTRYPOINT ["dotnet", "MealPlannerAPI.dll"]