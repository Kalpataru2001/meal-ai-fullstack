import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { LucideAngularModule, LayoutDashboard, Utensils, Calendar, ShoppingCart, Activity, User, Sun, Moon, Menu,ChefHat,Database, Settings, LogOut } from 'lucide-angular';
import { SupabaseService } from './core/services/supabase.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, LucideAngularModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  themeService = inject(ThemeService);
  supabase = inject(SupabaseService);
  isSidebarOpen = false;
  private router = inject(Router);
  // Define icons to use in template
  readonly icons = {
    LayoutDashboard, Utensils, Calendar, ShoppingCart, Activity, User, Sun, Moon, Menu,ChefHat,Database, Settings, LogOut
  };

  ngOnInit() {
    this.supabase.getClient().auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        this.router.navigate(['/update-password']);
      }
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  async handleLogout() {
    try {
      await this.supabase.getClient().auth.signOut();
      
      this.router.navigate(['/login']);
    } catch (error) {
      console.error("Error logging out", error);
    }
  }
}
