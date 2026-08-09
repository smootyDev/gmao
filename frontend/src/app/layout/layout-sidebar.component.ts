import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LayoutMenuComponent } from './layout-menu.component';

@Component({
  selector: 'app-layout-sidebar',
  standalone: true,
  imports: [RouterModule, LayoutMenuComponent],
  template: `<div class="layout-sidebar">
    <div class="layout-menu-container">
      <app-layout-menu></app-layout-menu>
    </div>
  </div>`
})
export class LayoutSidebarComponent {}
