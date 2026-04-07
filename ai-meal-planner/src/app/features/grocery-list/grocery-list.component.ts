import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { LucideAngularModule, ShoppingCart, Plus, Trash2, CheckCircle2, Circle } from 'lucide-angular';

export interface GroceryItem {
  id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  is_checked: boolean;
}

@Component({
  selector: 'app-grocery-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './grocery-list.component.html'
})
export class GroceryListComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private fb = inject(FormBuilder);

  readonly icons = { ShoppingCart, Plus, Trash2, CheckCircle2, Circle };

  // State
  items = signal<GroceryItem[]>([]);
  isLoading = signal(true);

  // Computed views for active and completed items
  activeItems = computed(() => this.items().filter(item => !item.is_checked));
  completedItems = computed(() => this.items().filter(item => item.is_checked));
  
  // Calculate progress bar percentage
  progress = computed(() => {
    const total = this.items().length;
    if (total === 0) return 0;
    return Math.round((this.completedItems().length / total) * 100);
  });

  // Simple Add Form
  addForm = this.fb.group({
    name: ['', Validators.required]
  });

  async ngOnInit() {
    await this.loadItems();
  }

  async loadItems() {
    this.isLoading.set(true);
    const data = await this.supabase.getGroceryItems();
    this.items.set(data as GroceryItem[]);
    this.isLoading.set(false);
  }

  async addItem() {
    if (this.addForm.invalid) return;

    const itemName = this.addForm.value.name!;
    this.addForm.reset();

    try {
      const newItem = await this.supabase.addGroceryItem({ name: itemName });
      this.items.update(current => [newItem, ...current]);
    } catch (error) {
      console.error('Error adding grocery item:', error);
    }
  }

  async toggleItem(item: GroceryItem) {
    const newStatus = !item.is_checked;
    
    // Optimistic UI update (feels instant to the user)
    this.items.update(current => 
      current.map(i => i.id === item.id ? { ...i, is_checked: newStatus } : i)
    );

    try {
      await this.supabase.toggleGroceryItem(item.id, newStatus);
    } catch (error) {
      console.error('Error toggling item:', error);
      // Revert if database fails
      this.items.update(current => 
        current.map(i => i.id === item.id ? { ...i, is_checked: !newStatus } : i)
      );
    }
  }

  async deleteItem(id: string) {
    try {
      await this.supabase.deleteGroceryItem(id);
      this.items.update(current => current.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }
}