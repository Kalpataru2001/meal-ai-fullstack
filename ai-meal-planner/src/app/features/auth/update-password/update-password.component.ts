import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { LucideAngularModule, Lock, Loader2, KeyRound } from 'lucide-angular';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './update-password.component.html'
})
export class UpdatePasswordComponent {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  readonly icons = { Lock, Loader2, KeyRound };

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  updateForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async updatePassword() {
    if (this.updateForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const newPassword = this.updateForm.value.password!;
      await this.supabase.updatePassword(newPassword);
      
      this.successMessage.set('Password updated successfully! Redirecting...');
      
      // Give them 2 seconds to read the success message, then send to dashboard
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 2000);
      
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to update password.');
    } finally {
      this.isLoading.set(false);
    }
  }
}