import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { LucideAngularModule, Calendar, Plus, Trash2, Clock, Flame, X,ChefHat } from 'lucide-angular';

export interface PlannedMeal {
  id: string;
  day_of_week: string;
  meal_type: string;
  recipe_title: string;
  calories: number;
  prep_time: number;
  recipe_data?: any;
}

@Component({
  selector: 'app-meal-planner',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './meal-planner.component.html'
})
export class MealPlannerComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private fb = inject(FormBuilder);

  readonly icons = { Calendar, Plus, Trash2, Clock, Flame, X ,ChefHat};

  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  mealTypes = ['Breakfast', 'Lunch', 'Dinner'];

  meals = signal<PlannedMeal[]>([]);
  isLoading = signal(true);
  
  // Modal State
  isModalOpen = signal(false);
  selectedDay = signal('Monday');
  selectedMealType = signal('Dinner');
  selectedViewMeal = signal<PlannedMeal | null>(null);

  mealForm = this.fb.group({
    recipe_title: ['', Validators.required],
    calories: [500, [Validators.required, Validators.min(0)]],
    prep_time: [30, [Validators.required, Validators.min(0)]]
  });

  async ngOnInit() {
    await this.loadMeals();
  }

  async loadMeals() {
    this.isLoading.set(true);
    const data = await this.supabase.getWeeklyPlan();
    this.meals.set(data as PlannedMeal[]);
    this.isLoading.set(false);
  }

  openViewModal(meal: PlannedMeal) {
    if (meal.recipe_data) {
      this.selectedViewMeal.set(meal);
    } else {
      alert("This meal was saved before we added the recipe details feature!");
    }
  }

  closeViewModal() {
    this.selectedViewMeal.set(null);
  }

  // Helper function to get a specific meal for the grid
  getMeal(day: string, type: string): PlannedMeal | undefined {
    return this.meals().find(m => m.day_of_week === day && m.meal_type === type);
  }

  openAddModal(day: string, type: string) {
    this.selectedDay.set(day);
    this.selectedMealType.set(type);
    this.mealForm.reset({ calories: 500, prep_time: 30 });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async onSubmit() {
    if (this.mealForm.invalid) return;

    const newMeal = {
      day_of_week: this.selectedDay(),
      meal_type: this.selectedMealType(),
      recipe_title: this.mealForm.value.recipe_title!,
      calories: this.mealForm.value.calories!,
      prep_time: this.mealForm.value.prep_time!
    };

    try {
      const added = await this.supabase.addMealToPlan(newMeal);
      this.meals.update(current => [...current, added]);
      this.closeModal();
    } catch (error) {
      console.error('Error adding meal:', error);
    }
  }

  async deleteMeal(id: string) {
    try {
      await this.supabase.deleteMealFromPlan(id);
      this.meals.update(current => current.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  }
}