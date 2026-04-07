import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard'; // <-- Add this import

export const routes: Routes = [
  // PUBLIC ROUTES
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  { 
    path: 'register', 
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  { 
    path: 'update-password', 
    loadComponent: () => import('./features/auth/update-password/update-password.component').then(m => m.UpdatePasswordComponent)
  },

  // PROTECTED ROUTES (Added canActivate)
  { 
    path: 'dashboard', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  { 
    path: 'pantry', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/pantry/pantry.component').then(m => m.PantryComponent)
  },
  { 
    path: 'recipes', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/recipes/recipes.component').then(m => m.RecipesComponent)
  },
  { 
    path: 'planner', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/meal-planner/meal-planner.component').then(m => m.MealPlannerComponent)
  },
  { 
    path: 'grocery-list', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/grocery-list/grocery-list.component').then(m => m.GroceryListComponent)
  },
  { 
    path: 'settings', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];