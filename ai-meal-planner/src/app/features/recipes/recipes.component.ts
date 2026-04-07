import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { RecipeService, GeneratedRecipe } from '../../core/services/recipe.service';
import { LucideAngularModule, ChefHat, Clock, Users, Flame, Utensils, Sparkles, Loader2, BookmarkPlus, Database, ShoppingCart } from 'lucide-angular';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule,FormsModule],
  templateUrl: './recipes.component.html'
})
export class RecipesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private recipeService = inject(RecipeService);

  readonly icons = { ChefHat, Clock, Users, Flame, Utensils, Sparkles, Loader2, BookmarkPlus, Database , ShoppingCart};

  private supabase = inject(SupabaseService);
  isFetchingPantry = signal(false);

  isSaveModalOpen = signal(false);
  isSaving = signal(false);
  selectedDay = signal('Monday');
  selectedMealType = signal('Dinner');
  
  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  mealTypes = ['Breakfast', 'Lunch', 'Dinner'];

  async ngOnInit() {
    try {
      // Use your ALREADY EXISTING method!
      const profileData = await this.supabase.getUserProfile();

      if (profileData) {
        // 1. Auto-fill Cuisine based on their profile
        // Make sure 'cuisine_prefs' matches the exact column name in your database!
        if (profileData.cuisine_prefs && profileData.cuisine_prefs.length > 0) {
          const topChoice = profileData.cuisine_prefs[0]; 
          if (this.cuisineOptions.includes(topChoice)) {
             this.recipeForm.patchValue({ cuisine: topChoice });
          }
        }

        // 2. Auto-fill Allergies into the Diet field
        // Make sure 'allergies' matches the exact column name in your database!
        if (profileData.allergies && profileData.allergies.length > 0) {
          const currentDiet = this.recipeForm.value.diet || 'Normal';
          const allergyString = `Allergies: ${profileData.allergies.join(', ')}`;
          this.recipeForm.patchValue({ diet: `${currentDiet} (${allergyString})` });
        }
      }
    } catch (error) {
      console.error("Could not load user preferences", error);
    }
  }

  async fillFromPantry() {
    this.isFetchingPantry.set(true);
    try {
      const items = await this.supabase.getPantryItems();
      
      if (items && items.length > 0) {
        const ingredientString = items.map((item: any) => item.name).join(', ');
        this.recipeForm.patchValue({ ingredients: ingredientString });
      } else {
        alert("Your pantry is empty! Go to the Pantry Tracker to add some items first.");
      }
    } catch (error) {
      console.error('Error fetching pantry:', error);
      alert("Failed to load pantry items.");
    } finally {
      this.isFetchingPantry.set(false);
    }
  }

  // State
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  generatedRecipe = signal<GeneratedRecipe | null>(null);
  isSendingToGroceries = signal(false);

  // Form setup
  dietOptions = ['Normal', 'Vegetarian', 'Vegan', 'Keto', 'Paleo'];
  cuisineOptions = ['Any', 'Indian', 'Italian', 'Mexican', 'Asian', 'Mediterranean', 'American'];

  recipeForm = this.fb.group({
    ingredients: ['', Validators.required],
    diet: ['Normal'],
    cuisine: ['Any'],
    time: [30, [Validators.min(5), Validators.max(120)]],
    servings: [2, [Validators.min(1), Validators.max(12)]],
    mealType: ['Dinner']
  });

  async generate() {
    if (this.recipeForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.generatedRecipe.set(null); // Clear previous recipe

    try {
      const result = await this.recipeService.generateRecipe(this.recipeForm.value as any);
      this.generatedRecipe.set(result);
    } catch (error: any) {
      console.error(error);
      this.errorMessage.set('Failed to generate recipe. Make sure your .NET backend is running and the API key is correct!');
    } finally {
      this.isLoading.set(false);
    }
  }

  // --- SAVE TO PLANNER METHODS ---
  openSaveModal() {
    this.isSaveModalOpen.set(true);
  }

  closeSaveModal() {
    this.isSaveModalOpen.set(false);
  }

  async confirmSave() {
    const recipe = this.generatedRecipe();
    if (!recipe) return;

    this.isSaving.set(true);
    try {
      // Reusing the exact same method we built for the Meal Planner!
      await this.supabase.addMealToPlan({
        day_of_week: this.selectedDay(),
        meal_type: this.selectedMealType(),
        recipe_title: recipe.title,
        calories: recipe.nutrition.calories,
        prep_time: recipe.cooking_time,
        recipe_data: recipe
      });
      
      alert('Successfully saved to your Meal Plan!');
      this.closeSaveModal();
    } catch (error) {
      console.error('Error saving to planner:', error);
      alert('Failed to save meal.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async sendMissingToGroceryList() {
    const recipe = this.generatedRecipe();
    if (!recipe) return;

    this.isSendingToGroceries.set(true);
    try {
      // 1. Fetch what you currently own
      const pantryItems = await this.supabase.getPantryItems();
      const pantryNames = pantryItems.map((item: any) => item.name.toLowerCase());

      // 2. Cross-reference: Find ingredients NOT in the pantry
      // (Using a simple check to see if the words overlap)
      const missingIngredients = recipe.ingredients.filter((ing: any) => {
        const recipeIngName = ing.name.toLowerCase();
        return !pantryNames.some((pName: string) => 
          pName.includes(recipeIngName) || recipeIngName.includes(pName)
        );
      });

      // 3. If nothing is missing, tell the user!
      if (missingIngredients.length === 0) {
        alert("Good news! You already have all these ingredients in your pantry.");
        return;
      }

      // 4. Send the missing items to the Grocery List database
      for (const item of missingIngredients) { 
        let parsedAmount: number | undefined = undefined;
        if (item.amount !== null && item.amount !== undefined) {
          parsedAmount = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount);
          if (isNaN(parsedAmount)) {
            parsedAmount = undefined; 
          }
        }

        await this.supabase.addGroceryItem({
          name: item.name,
          amount: parsedAmount,
          unit: item.unit
        });
      }

      alert(`Successfully added ${missingIngredients.length} missing items to your Grocery List!`);
    } catch (error) {
      console.error('Error adding to grocery list:', error);
      alert('Failed to send items to grocery list.');
    } finally {
      this.isSendingToGroceries.set(false);
    }
  }
}