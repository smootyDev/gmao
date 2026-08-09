import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { LayoutMenuitemComponent } from './layout-menuitem.component';

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

  ngOnInit() {
    this.model = [
      {
        label: 'MENU.SECTION',
        items: [
          { label: 'MENU.DASHBOARD', icon: 'pi pi-fw pi-home', routerLink: ['/dashboard'] },
          { label: 'MENU.WORKORDERS', icon: 'pi pi-fw pi-wrench', routerLink: ['/workorders'] },
          { label: 'MENU.ASSETS', icon: 'pi pi-fw pi-box', routerLink: ['/assets'] }
        ]
      }
    ];
  }
}
