import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { LucideAngularModule, Search, Plus, Trash2, AlertCircle, Clock, CheckCircle2, X } from 'lucide-angular';

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiry_date: string;
}

@Component({
  selector: 'app-pantry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './pantry.component.html'
})
export class PantryComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private fb = inject(FormBuilder);

  readonly icons = { Search, Plus, Trash2, AlertCircle, Clock, CheckCircle2, X };
  Math = Math;
  // State
  items = signal<PantryItem[]>([]);
  searchQuery = signal('');
  isModalOpen = signal(false);
  isLoading = signal(false);

  // Computed state for instant search filtering
  filteredItems = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.items().filter(item => item.name.toLowerCase().includes(query));
  });

  // Form
  units = ['g', 'kg', 'ml', 'L', 'pieces', 'cups', 'tbsp'];
  itemForm = this.fb.group({
    name: ['', Validators.required],
    quantity: ['', [Validators.required, Validators.min(0.1)]],
    unit: ['pieces', Validators.required],
    expiry_date: ['', Validators.required]
  });

  async ngOnInit() {
    await this.loadItems();
  }

  async loadItems() {
    this.isLoading.set(true);
    const data = await this.supabase.getPantryItems();
    this.items.set(data as PantryItem[]);
    this.isLoading.set(false);
  }

  // Expiry Logic: Calculate days remaining
  getExpiryStatus(dateString: string): { status: 'expired' | 'warning' | 'safe', days: number } {
    const expiry = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'expired', days: diffDays };
    if (diffDays <= 3) return { status: 'warning', days: diffDays };
    return { status: 'safe', days: diffDays };
  }

  openModal() {
    this.itemForm.reset({ unit: 'pieces' });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async onSubmit() {
    if (this.itemForm.invalid) return;

    try {
      const newItem = await this.supabase.addPantryItem(this.itemForm.value as any);
      // Prepend to list instantly (optimistic UI update)
      this.items.update(current => [newItem, ...current]);
      this.closeModal();
    } catch (error) {
      console.error('Error adding item', error);
    }
  }

  async deleteItem(id: string) {
    try {
      await this.supabase.deletePantryItem(id);
      this.items.update(current => current.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting item', error);
    }
  }
}