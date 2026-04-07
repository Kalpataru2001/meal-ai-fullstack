import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { LucideAngularModule, Mail, Lock, Loader2 } from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  resetEmailSent = signal(false);
  // Icons
  readonly icons = { Mail, Lock, Loader2 };

  // State
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    try {
      const { error } = await this.supabase.signInWithPassword(email!, password!);
      
      if (error) throw error;
      
      // Navigate to dashboard on success
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'An error occurred during login.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loginWithGoogle() {
    try {
      await this.supabase.signInWithGoogle();
    } catch (error) {
      console.error('Google login error:', error);
      this.errorMessage.set('Could not initialize Google login.');
    }
  }

  async forgotPassword() {
    const email = this.loginForm.get('email')?.value;
    
    if (!email) {
      this.errorMessage.set('Please enter your email address first to reset your password.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    
    try {
      await this.supabase.resetPassword(email);
      
      // Turn on the success message
      this.resetEmailSent.set(true);
      
      // Turn it off after 5 seconds so the UI stays clean
      setTimeout(() => {
        this.resetEmailSent.set(false);
      }, 5000);

    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to send reset email.');
    } finally {
      this.isLoading.set(false);
    }
  }
}