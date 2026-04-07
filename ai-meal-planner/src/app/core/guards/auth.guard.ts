import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { map, from } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  // We check the session directly from Supabase to ensure it's valid
  return from(supabaseService.getClient().auth.getSession()).pipe(
    map(({ data }) => {
      if (data.session) {
        return true;
      }
      
      // Redirect to login if not authenticated
      router.navigate(['/login']);
      return false;
    })
  );
};