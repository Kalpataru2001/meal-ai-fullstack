# Use the official .NET SDK to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the project file and restore dependencies
COPY ["MealPlannerAPI.csproj", "./"]
RUN dotnet restore "./MealPlannerAPI.csproj"

# Copy the rest of the code and compile it
COPY . .
RUN dotnet publish "MealPlannerAPI.csproj" -c Release -o /app/publish

# Use the lighter ASP.NET runtime to actually run the app
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Tell Render what port to use
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

# Start the application
ENTRYPOINT ["dotnet", "MealPlannerAPI.dll"]