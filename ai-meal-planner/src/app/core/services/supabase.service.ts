import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  
  // Signals to hold our auth state
  currentUser = signal<User | null>(null);
  session = signal<Session | null>(null);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    
    // Load initial session
    this.supabase.auth.getSession().then(({ data }) => {
      this.session.set(data.session);
      this.currentUser.set(data.session?.user || null);
    });

    // Listen for auth changes (login, logout, token refresh)
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
      this.currentUser.set(session?.user || null);
    });
  }

  // Auth Methods
  async signInWithPassword(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  async signUp(email: string, password: string, profileData: any) {
    // Pack all custom data into the user_metadata object
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: profileData.name,
          age: profileData.age,
          weight: profileData.weight,
          height: profileData.height,
          diet_type: profileData.diet_type,
          allergies: profileData.allergies || [],
          cuisine_prefs: profileData.cuisine_prefs || [],
          calorie_goal: 2000
        }
      }
    });

    if (error) throw error;
    return data;
  }

   async signInWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  // Get raw client if needed for DB calls
  getClient() {
    return this.supabase;
  }

  async getUserProfile() {
    const user = this.currentUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  }

  async updateUserProfile(updates: { name?: string; calorie_goal?: number; cuisine_prefs?: string[]; allergies?: string[] }) {
    const user = this.currentUser();
    if (!user) throw new Error('Not logged in');

    const { error } = await this.supabase
      .from('users_profile')
      .update(updates)
      .eq('id', user.id); // Or 'user_id' depending on how you set up your profile table!

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
  

  // --- PANTRY METHODS ---

  async getPantryItems() {
    const user = this.currentUser();
    if (!user) return [];

    const { data, error } = await this.supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true }); // Expiring soonest first

    if (error) {
      console.error('Error fetching pantry:', error);
      return [];
    }
    return data;
  }

  async addPantryItem(item: { name: string; quantity: number; unit: string; expiry_date: string }) {
    const user = this.currentUser();
    if (!user) throw new Error('Not logged in');

    const { data, error } = await this.supabase
      .from('pantry_items')
      .insert({ ...item, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deletePantryItem(id: string) {
    const { error } = await this.supabase
      .from('pantry_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getWeeklyPlan() {
    const user = this.currentUser();
    if (!user) return [];

    const { data, error } = await this.supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching meal plan:', error);
      return [];
    }
    return data;
  }

  async addMealToPlan(meal: { day_of_week: string; meal_type: string; recipe_title: string; calories: number; prep_time: number; recipe_data?: any }) {
    const user = this.currentUser();
    if (!user) throw new Error('Not logged in');

    const { data, error } = await this.supabase
      .from('meal_plans')
      .insert({ ...meal, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteMealFromPlan(id: string) {
    const { error } = await this.supabase
      .from('meal_plans')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // --- GROCERY LIST METHODS ---

  async getGroceryItems() {
    const user = this.currentUser();
    if (!user) return [];

    const { data, error } = await this.supabase
      .from('grocery_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching groceries:', error);
      return [];
    }
    return data;
  }

  async addGroceryItem(item: { name: string; amount?: number; unit?: string }) {
    const user = this.currentUser();
    if (!user) throw new Error('Not logged in');

    const { data, error } = await this.supabase
      .from('grocery_items')
      .insert({ ...item, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async toggleGroceryItem(id: string, is_checked: boolean) {
    const { error } = await this.supabase
      .from('grocery_items')
      .update({ is_checked })
      .eq('id', id);

    if (error) throw error;
  }

  async deleteGroceryItem(id: string) {
    const { error } = await this.supabase
      .from('grocery_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }


  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`,
    });
    if (error) throw error;
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
  }
}