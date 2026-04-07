# Use the official .NET SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# THE NUCLEAR OPTION: Copy absolutely everything immediately
COPY . .

# Let .NET automatically find the .csproj or .sln and build it
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

# Use the lighter ASP.NET runtime to run the app
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Tell Render what port to use
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

# Start the application (Make sure this matches your exact project name casing!)
ENTRYPOINT ["dotnet", "MealPlannerAPI.dll"]