namespace MealPlannerAPI.Models
{
    public class RecipeRequest
    {
        public string Ingredients { get; set; } = string.Empty;
        public string Diet { get; set; } = "Normal";
        public string Cuisine { get; set; } = "Any";
        public int Time { get; set; } = 30;
        public int Servings { get; set; } = 2;
        public string MealType { get; set; } = "Dinner";
    }
}
