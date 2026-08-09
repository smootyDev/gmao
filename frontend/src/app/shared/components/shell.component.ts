import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToolbarModule,
    ButtonModule,
    MenuModule,
    AvatarModule,
    BadgeModule,
    TranslatePipe
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  sidebarVisible = true;

  menuItems = [
    { label: 'MENU.DASHBOARD', icon: 'pi pi-home', routerLink: '/dashboard' },
    { label: 'MENU.WORKORDERS', icon: 'pi pi-wrench', routerLink: '/workorders' },
    { label: 'MENU.ASSETS', icon: 'pi pi-box', routerLink: '/assets' }
  ];

  languageItems = [
    { label: 'Español', command: () => this.languageService.setLanguage('es') },
    { label: 'English', command: () => this.languageService.setLanguage('en') }
  ];

  userMenuItems = [
    { label: 'MENU.LOGOUT', icon: 'pi pi-sign-out', command: () => this.authService.logout() }
  ];

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    public languageService: LanguageService
  ) {}

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }
}
