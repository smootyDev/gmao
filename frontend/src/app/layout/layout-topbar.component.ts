import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { TranslatePipe } from '../core/pipes/translate.pipe';
import { AuthService } from '../core/services/auth.service';
import { LanguageService } from '../core/services/language.service';
import { TranslateService } from '../core/services/translate.service';
import { LayoutService } from './layout.service';

@Component({
  selector: 'app-layout-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MenuModule, TranslatePipe],
  templateUrl: './layout-topbar.component.html'
})
export class LayoutTopbarComponent {
  readonly layoutService = inject(LayoutService);
  readonly languageService = inject(LanguageService);
  readonly authService = inject(AuthService);

  private readonly translateService = inject(TranslateService);

  languageItems: MenuItem[] = [
    { label: 'Español', command: () => this.languageService.setLanguage('es') },
    { label: 'English', command: () => this.languageService.setLanguage('en') }
  ];

  userItems = computed<MenuItem[]>(() => [
    {
      label: this.translateService.translate('MENU.LOGOUT'),
      icon: 'pi pi-sign-out',
      command: () => this.authService.logout()
    }
  ]);

  themeIcon = computed(() => (this.layoutService.isDarkTheme() ? 'pi pi-moon' : 'pi pi-sun'));

  toggleTheme(): void {
    this.layoutService.layoutConfig.update((state) => ({
      ...state,
      darkTheme: !state.darkTheme
    }));
  }
}
