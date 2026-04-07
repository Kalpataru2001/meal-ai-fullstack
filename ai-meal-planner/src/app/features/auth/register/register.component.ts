import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { LucideAngularModule, User, Mail, Lock, ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-angular';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  readonly icons = { User, Mail, Lock, ChevronRight, ChevronLeft, Check, Loader2 };

  // Wizard State
  currentStep = signal(1);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  isSuccess = signal(false);

  // Available options
  availableAllergies = ['Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat', 'Soy', 'Fish', 'Shellfish', 'Gluten'];
  availableCuisines = ['Indian', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Mediterranean', 'American', 'Thai'];
  dietTypes = ['Normal', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Pescatarian'];

  // Form Definition
  registerForm = this.fb.group({
    credentials: this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    }),
    personal: this.fb.group({
      age: ['', [Validators.required, Validators.min(10), Validators.max(120)]],
      weight: ['', [Validators.required, Validators.min(20)]], // in kg
      height: ['', [Validators.required, Validators.min(100)]] // in cm
    }),
    preferences: this.fb.group({
      diet_type: ['Normal', Validators.required],
      allergies: [[] as string[]],
      cuisine_prefs: [[] as string[]]
    })
  });

  // Getters for form groups
  get credentialsForm() { return this.registerForm.get('credentials')!; }
  get personalForm() { return this.registerForm.get('personal')!; }
  get preferencesForm() { return this.registerForm.get('preferences')!; }

  // Navigation
  nextStep() {
    if (this.currentStep() === 1 && this.credentialsForm.valid) this.currentStep.set(2);
    else if (this.currentStep() === 2 && this.personalForm.valid) this.currentStep.set(3);
  }

  prevStep() {
    if (this.currentStep() > 1) this.currentStep.update(s => s - 1);
  }

  // Toggle selection for arrays
  toggleSelection(controlName: 'allergies' | 'cuisine_prefs', item: string) {
    const control = this.preferencesForm.get(controlName);
    const currentValues = control?.value as string[];
    
    if (currentValues.includes(item)) {
      control?.setValue(currentValues.filter(v => v !== item));
    } else {
      control?.setValue([...currentValues, item]);
    }
  }
  isSelected(controlName: 'allergies' | 'cuisine_prefs', item: string): boolean {
    const control = this.preferencesForm.get(controlName);
    const values = control?.value as string[] | null;
    return values ? values.includes(item) : false;
  }

  async onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formValue = this.registerForm.value;
    
    const profileData = {
      name: formValue.credentials?.name,
      age: formValue.personal?.age,
      weight: formValue.personal?.weight,
      height: formValue.personal?.height,
      diet_type: formValue.preferences?.diet_type,
      allergies: formValue.preferences?.allergies,
      cuisine_prefs: formValue.preferences?.cuisine_prefs
    };

    try {
      await this.supabase.signUp(
        formValue.credentials!.email!, 
        formValue.credentials!.password!, 
        profileData
      );
      
      // Instead of navigating to the dashboard, show the success screen!
      this.isSuccess.set(true);

    } catch (error: any) {
      this.errorMessage.set(error.message || 'An error occurred during registration.');
    } finally {
      this.isLoading.set(false);
    }
  }
}