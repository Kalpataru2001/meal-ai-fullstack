import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RecipeRequest {
  ingredients: string;
  diet: string;
  cuisine: string;
  time: number;
  servings: number;
  mealType: string;
}
export interface GeneratedRecipe {
  title: string;
  description: string;
  ingredients: { name: string; amount: number | string; unit: string }[];
  steps: string[];
  nutrition: { calories: number; protein: number; carbs: number; fat: number };
  difficulty: string;
  cooking_time: number;
  cuisine_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class RecipeService {

  private http = inject(HttpClient);
  
  private apiUrl = `${environment.apiUrl}/Recipe`;

  async generateRecipe(request: RecipeRequest): Promise<GeneratedRecipe> {
    return firstValueFrom(this.http.post<GeneratedRecipe>(`${this.apiUrl}/generate`, request));
  }
}
