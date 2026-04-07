import { Component, OnInit, inject, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { SupabaseService } from '../../core/services/supabase.service';
import { ThemeService } from '../../core/services/theme.service';
import { RouterLink } from '@angular/router';
import { 
  LucideAngularModule, Flame, AlertCircle, Plus, Sparkles, 
  MessageSquare, ChevronRight, Clock, Utensils,
  Activity,
  Droplet,
  Wheat,
  Zap
} from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, LucideAngularModule,RouterLink],
  providers: [DatePipe],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService);
  private themeService = inject(ThemeService);
  private datePipe = inject(DatePipe);

  // Added new icons here!
  readonly icons = { Flame, AlertCircle, Plus, Sparkles, MessageSquare, ChevronRight, Clock, Utensils, Activity, Droplet, Wheat, Zap };

  // State
  userName = signal<string>('Chef');
  todayDate = signal<string>('');
  currentDayName = '';
  
  // Dynamic Data
  todaysMeals = signal<any[]>([]);
  lowStockItems = signal<any[]>([]);
  
  // Stats
  calorieGoal = signal<number>(2000);
  animatedCalories = signal<number>(0);
  
  // NEW: Macros & Week Status
  macros = signal({ protein: 0, carbs: 0, fat: 0 });
  weekStatus = signal<{day: string, planned: boolean}[]>([]);
  
  private animationInterval: any;

  // Chart Configuration (Made the ring slightly thicker)
  public doughnutChartType: 'doughnut' = 'doughnut';
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: [ 'Consumed', 'Remaining' ],
    datasets: [{ data: [0, 2000], backgroundColor: ['#6c63ff', '#e5e7eb'], borderWidth: 0 }]
  };
  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    cutout: '75%', // Thicker ring
    plugins: { legend: { display: false }, tooltip: { enabled: false } }
  };

  constructor() {
    const now = new Date();
    this.todayDate.set(this.datePipe.transform(now, 'EEEE, MMMM d') || '');
    this.currentDayName = this.datePipe.transform(now, 'EEEE') || 'Monday';

    effect(() => {
      const isDark = this.themeService.themeSignal() === 'dark';
      this.doughnutChartData.datasets[0].backgroundColor = ['#6c63ff', isDark ? '#374151' : '#e5e7eb'];
      this.doughnutChartData = { ...this.doughnutChartData };
    });
  }

  async ngOnInit() {
    const profile = await this.supabase.getUserProfile();
    if (profile) {
      this.userName.set(profile.name ? profile.name.split(' ')[0] : 'Chef');
      this.calorieGoal.set(profile.calorie_goal || 2000);
    }

    const allMeals = await this.supabase.getWeeklyPlan();
    
    // Calculate Weekly Pulse (M, T, W, T, F, S, S)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const status = days.map(day => ({
      day: day.substring(0, 1), // Get just 'M', 'T', etc.
      planned: allMeals.some((m: any) => m.day_of_week === day)
    }));
    this.weekStatus.set(status);

    // Get Today's Meals
    const mealsForToday = allMeals.filter((m: any) => m.day_of_week === this.currentDayName);
    const order: { [key: string]: number } = { 'Breakfast': 1, 'Lunch': 2, 'Dinner': 3 };
    mealsForToday.sort((a: any, b: any) => (order[a.meal_type] || 4) - (order[b.meal_type] || 4));
    this.todaysMeals.set(mealsForToday);

    // Calculate Calories AND Macros from the saved recipe_data!
    let totalCals = 0;
    let totalPro = 0, totalCarb = 0, totalFat = 0;

    mealsForToday.forEach((meal: any) => {
      totalCals += (meal.calories || 0);
      if (meal.recipe_data?.nutrition) {
        totalPro += (meal.recipe_data.nutrition.protein || 0);
        totalCarb += (meal.recipe_data.nutrition.carbs || 0);
        totalFat += (meal.recipe_data.nutrition.fat || 0);
      }
    });

    this.macros.set({ protein: totalPro, carbs: totalCarb, fat: totalFat });
    this.updateChartData(totalCals, this.calorieGoal());
    this.animateCountUp(totalCals);

    const pantry = await this.supabase.getPantryItems();
    this.lowStockItems.set(pantry.slice(0, 3));
  }

  ngOnDestroy() {
    if (this.animationInterval) clearInterval(this.animationInterval);
  }

  updateChartData(consumed: number, goal: number) {
    const remaining = Math.max(0, goal - consumed);
    this.doughnutChartData.datasets[0].data = [consumed, remaining];
    this.doughnutChartData = { ...this.doughnutChartData };
  }

  animateCountUp(target: number) {
    if (target === 0) {
      this.animatedCalories.set(0);
      return;
    }
    let current = 0;
    const increment = Math.ceil(target / 40); 
    
    this.animationInterval = setInterval(() => {
      current += increment;
      if (current >= target) {
        this.animatedCalories.set(target);
        clearInterval(this.animationInterval);
      } else {
        this.animatedCalories.set(current);
      }
    }, 20);
  }
}