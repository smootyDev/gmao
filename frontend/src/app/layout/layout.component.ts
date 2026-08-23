import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { LayoutFooterComponent } from './layout-footer.component';
import { LayoutSidebarComponent } from './layout-sidebar.component';
import { LayoutTopbarComponent } from './layout-topbar.component';
import { LayoutService } from './layout.service';
import { SyncStatusComponent } from '../shared/components/sync-status.component';
import { AiChatComponent } from '../features/ai/chat/components/ai-chat.component';
import { AiStateService } from '../features/ai/services/ai-state.service';
import { TranslatePipe } from '../core/pipes/translate.pipe';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LayoutTopbarComponent, LayoutSidebarComponent, LayoutFooterComponent, SyncStatusComponent, ButtonModule, DialogModule, AiChatComponent, TranslatePipe],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  private readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);
  readonly aiState = inject(AiStateService);

  aiDialogVisible = signal(false);

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
      .subscribe(() => {
        this.layoutService.hideMenu();
        this.aiState.refresh();
      });
  }

  ngOnInit(): void {
    this.aiState.refresh();
  }

  openAiChat(): void {
    this.aiState.refresh();
    if (this.aiState.enabled()) {
      this.aiDialogVisible.set(true);
    }
  }

  hideMenu(): void {
    this.layoutService.hideMenu();
  }
}
