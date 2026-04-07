using MealPlannerAPI.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MealPlannerAPI.Models;

namespace MealPlannerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecipeController : ControllerBase
    {
        private readonly GeminiService _geminiService;

        public RecipeController(GeminiService geminiService)
        {
            _geminiService = geminiService;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateRecipe([FromBody] RecipeRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Ingredients))
                return BadRequest("Ingredients are required.");

            var prompt = $@"
            You are an expert culinary chef. I will give you a list of ingredients in my kitchen, but YOU DO NOT HAVE TO USE ALL OF THEM. 
            
            Your task is to look at my pantry and create the single best {request.Cuisine} {request.MealType} possible.
            
            Available Ingredients: {request.Ingredients}.
            Dietary Restriction: {request.Diet}.
            Max cooking time: {request.Time} minutes.
            Servings: {request.Servings}.
            
            STRICT RULES:
            1. You MUST NOT use all the ingredients provided. You are required to leave some out.
            2. Create ONE single, cohesive main dish. DO NOT create side dishes or pairings just to use up extra ingredients.
            3. IGNORE completely incompatible items (e.g., do not use sweet biscuits, snacks, or desserts).
            4. You may assume I have basic staples available (salt, pepper, standard cooking oil, water).
            
            Return ONLY a raw JSON object (no markdown formatting, no backticks) with these exact fields: 
            title (string), 
            description (string), 
            ingredients (array of objects with 'name', 'amount', 'unit'), 
            steps (array of strings), 
            nutrition (object with integer fields: 'calories', 'protein', 'carbs', 'fat'), 
            difficulty (string), 
            cooking_time (integer), 
            cuisine_type (string)";

            try
            {
                var jsonResponse = await _geminiService.GenerateRecipeAsync(prompt);
                return Content(jsonResponse, "application/json"); // Return raw JSON to Angular
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
