import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { LayoutFooterComponent } from './layout-footer.component';
import { LayoutSidebarComponent } from './layout-sidebar.component';
import { LayoutTopbarComponent } from './layout-topbar.component';
import { LayoutService } from './layout.service';
import { SyncStatusComponent } from '../shared/components/sync-status.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LayoutTopbarComponent, LayoutSidebarComponent, LayoutFooterComponent, SyncStatusComponent],
  templateUrl: './layout.component.html'
})
export class LayoutComponent {
  private readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);

  containerClass = computed(() => {
    const config = this.layoutService.layoutConfig();
    const state = this.layoutService.layoutState();
    return {
      'layout-overlay': config.menuMode === 'overlay',
      'layout-static': config.menuMode === 'static',
      'layout-static-inactive': state.staticMenuDesktopInactive && config.menuMode === 'static',
      'layout-overlay-active': state.overlayMenuActive,
      'layout-mobile-active': state.mobileMenuActive
    };
  });

  constructor() {
    effect(() => {
      const { mobileMenuActive } = this.layoutService.layoutState();
      document.body.classList.toggle('blocked-scroll', mobileMenuActive);
    });

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.layoutService.hideMenu());
  }

  hideMenu(): void {
    this.layoutService.hideMenu();
  }
}
