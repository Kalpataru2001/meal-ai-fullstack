import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { LucideAngularModule, User, Target, Utensils, AlertTriangle, Save, Loader2 } from 'lucide-angular';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private fb = inject(FormBuilder);

  readonly icons = { User, Target, Utensils, AlertTriangle, Save, Loader2 };

  isLoading = signal(true);
  isSaving = signal(false);
  saveSuccess = signal(false);

  // Common options for our dropdowns
  cuisineOptions = ['Italian', 'Mexican', 'Indian', 'Chinese', 'American', 'Mediterranean', 'Thai', 'Japanese'];
  allergyOptions = ['Peanuts', 'Dairy', 'Gluten', 'Shellfish', 'Eggs', 'Tree Nuts', 'Soy'];

  settingsForm = this.fb.group({
    name: ['', Validators.required],
    calorie_goal: [2000, [Validators.required, Validators.min(1000), Validators.max(5000)]],
    cuisine_prefs: [[] as string[]],
    allergies: [[] as string[]]
  });

  async ngOnInit() {
    try {
      const profile = await this.supabase.getUserProfile();
      if (profile) {
        this.settingsForm.patchValue({
          name: profile.name || '',
          calorie_goal: profile.calorie_goal || 2000,
          cuisine_prefs: profile.cuisine_prefs || [],
          allergies: profile.allergies || []
        });
      }
    } catch (error) {
      console.error('Error loading profile', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Helper methods to handle multi-select toggles
  toggleArrayItem(field: 'cuisine_prefs' | 'allergies', value: string) {
    const currentArray = this.settingsForm.get(field)?.value || [];
    const index = currentArray.indexOf(value);
    
    if (index === -1) {
      this.settingsForm.patchValue({ [field]: [...currentArray, value] });
    } else {
      const newArray = currentArray.filter(item => item !== value);
      this.settingsForm.patchValue({ [field]: newArray });
    }
    this.settingsForm.markAsDirty();
  }

  isItemActive(field: 'cuisine_prefs' | 'allergies', value: string): boolean {
    const currentArray = this.settingsForm.get(field)?.value || [];
    return currentArray.includes(value);
  }

  async onSubmit() {
    if (this.settingsForm.invalid) return;

    this.isSaving.set(true);
    this.saveSuccess.set(false);

    try {
      await this.supabase.updateUserProfile({
        name: this.settingsForm.value.name!,
        calorie_goal: this.settingsForm.value.calorie_goal!,
        cuisine_prefs: this.settingsForm.value.cuisine_prefs!,
        allergies: this.settingsForm.value.allergies!
      });
      
      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 3000); // Hide success message after 3 seconds
      this.settingsForm.markAsPristine();
    } catch (error) {
      alert('Failed to save settings.');
    } finally {
      this.isSaving.set(false);
    }
  }
}