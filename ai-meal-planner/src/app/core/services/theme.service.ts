import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Initialize signal with value from localStorage or default to dark
  themeSignal = signal<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
  );

  constructor() {
    // This effect runs automatically whenever the signal changes
    effect(() => {
      const currentTheme = this.themeSignal();
      localStorage.setItem('theme', currentTheme);
      
      if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    });
  }

  toggleTheme() {
    this.themeSignal.update(theme => theme === 'dark' ? 'light' : 'dark');
  }
}