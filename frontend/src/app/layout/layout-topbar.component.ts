import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { StyleClass } from 'primeng/styleclass';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../core/pipes/translate.pipe';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../core/services/auth.service';
import { LanguageService } from '../core/services/language.service';
import { LayoutService } from './layout.service';
import { LayoutConfiguratorComponent } from './layout-configurator.component';

@Component({
  selector: 'app-layout-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MenuModule, TranslatePipe, LayoutConfiguratorComponent, StyleClass],
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

  private readonly logoutLabel = toSignal(this.translateService.stream('MENU.LOGOUT'), { initialValue: 'MENU.LOGOUT' });

  userItems = computed<MenuItem[]>(() => [
    {
      label: this.logoutLabel() ?? 'MENU.LOGOUT',
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
