import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeKey = 'gmao_theme';
  darkMode = signal<boolean>(this.loadTheme());

  constructor() {
    effect(() => {
      const isDark = this.darkMode();
      localStorage.setItem(this.themeKey, isDark ? 'dark' : 'light');
      if (isDark) {
        document.documentElement.classList.add('app-dark');
      } else {
        document.documentElement.classList.remove('app-dark');
      }
    });
  }

  toggleTheme(): void {
    this.darkMode.update(value => !value);
  }

  private loadTheme(): boolean {
    return localStorage.getItem(this.themeKey) === 'dark';
  }
}
