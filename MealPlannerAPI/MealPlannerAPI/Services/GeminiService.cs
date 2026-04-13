using System.Text;
using System.Text.Json;

namespace MealPlannerAPI.Services
{
    public class GeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private const string ApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

        public GeminiService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _apiKey = config["Gemini:ApiKey"] ?? throw new ArgumentNullException("Gemini API Key is missing!");
        }

        public async Task<string> GenerateRecipeAsync(string prompt)
        {
            var requestBody = new
            {
                contents = new[] { new { parts = new[] { new { text = prompt } } } },
                // Force Gemini to return clean JSON
                generationConfig = new { response_mime_type = "application/json" }
            };

            var jsonBody = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{ApiUrl}?key={_apiKey}", content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Gemini API Error: {error}");
            }

            var responseString = await response.Content.ReadAsStringAsync();
            using var jsonDoc = JsonDocument.Parse(responseString);

            var generatedText = jsonDoc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return generatedText ?? "{}";
        }
    }
}
