import { Injectable, signal } from '@angular/core';
import { TranslateService } from './translate.service';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly languageKey = 'gmao_language';
  currentLang = signal<string>(this.loadLanguage());

  constructor(private translate: TranslateService) {}

  setLanguage(lang: string): void {
    this.currentLang.set(lang);
    localStorage.setItem(this.languageKey, lang);
    this.translate.use(lang);
  }

  private loadLanguage(): string {
    return localStorage.getItem(this.languageKey) || 'es';
  }
}
