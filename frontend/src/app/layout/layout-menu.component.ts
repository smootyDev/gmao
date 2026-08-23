import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { LayoutMenuitemComponent } from './layout-menuitem.component';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-layout-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, LayoutMenuitemComponent],
  template: `<ul class="layout-menu">
    @for (item of model; track item.label) {
      @if (!item.separator) {
        <li app-layout-menuitem [item]="item" [root]="true"></li>
      } @else {
        <li class="menu-separator"></li>
      }
    }
  </ul>`
})
export class LayoutMenuComponent {
  model: MenuItem[] = [];
  private readonly authService = inject(AuthService);

  ngOnInit() {
    const isAdmin = this.authService.currentUser()?.role === 'ADMIN';
    this.model = [
      {
        label: 'MENU.SECTION',
        items: [
          { label: 'MENU.DASHBOARD', icon: 'pi pi-fw pi-home', path: '/dashboard', routerLink: ['/dashboard'] },
          { label: 'MENU.WORKORDERS', icon: 'pi pi-fw pi-wrench', path: '/workorders', routerLink: ['/workorders'] },
          { label: 'MENU.ASSETS', icon: 'pi pi-fw pi-box', path: '/assets', routerLink: ['/assets'] },
          { label: 'MENU.INVENTORY', icon: 'pi pi-fw pi-shopping-cart', path: '/inventory', routerLink: ['/inventory'] },
          { label: 'MENU.PREVENTIVE', icon: 'pi pi-fw pi-calendar-clock', path: '/preventive', routerLink: ['/preventive'] },
          { label: 'MENU.LOCATIONS', icon: 'pi pi-fw pi-map-marker', path: '/locations', routerLink: ['/locations'] }
        ]
      }, {
        label: 'MENU.CATALOGS',
        items: [
          { label: 'MENU.ASSET_TYPES', icon: 'pi pi-fw pi-tags', path: '/catalogs/asset-types', routerLink: ['/asset-types'] }
        ]
      },
      ...(isAdmin
        ? [{
            label: 'MENU.ADMINISTRATION',
            items: [
              { label: 'MENU.USERS', icon: 'pi pi-fw pi-users', path: '/users', routerLink: ['/users'] },
              { label: 'MENU.AI_SETTINGS', icon: 'pi pi-fw pi-cog', path: '/ai/settings', routerLink: ['/ai/settings'] },
              { label: 'MENU.AUDIT_LOGS', icon: 'pi pi-fw pi-history', path: '/audit-logs', routerLink: ['/audit-logs'] }
            ]
          }]
        : [])
    ];
  }
}
