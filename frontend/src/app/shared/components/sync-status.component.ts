import { Component, ElementRef, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { SyncService } from '../../core/services/sync.service';

@Component({
  selector: 'app-sync-status',
  standalone: true,
  imports: [CommonModule, ButtonModule, ProgressSpinnerModule, TranslatePipe],
  templateUrl: './sync-status.component.html',
  styleUrl: './sync-status.component.scss'
})
export class SyncStatusComponent implements AfterViewInit, OnDestroy {
  private readonly syncService = inject(SyncService);
  private readonly host = inject(ElementRef);
  private observer: ResizeObserver | null = null;

  isOnline = this.syncService.isOnline;
  connectionVerified = this.syncService.connectionVerified;
  hasPending = this.syncService.hasPending;
  isSyncing = this.syncService.isSyncing;
  pendingCount = this.syncService.pendingCount;

  ngAfterViewInit(): void {
    const el = (this.host.nativeElement as HTMLElement).querySelector<HTMLElement>('.sync-status');
    if (el) {
      this.applyHeight(el);
      this.observer = new ResizeObserver(() => this.applyHeight(el));
      this.observer.observe(el);
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
    document.documentElement.style.setProperty('--sync-banner-height', '0px');
  }

  private applyHeight(el: HTMLElement): void {
    document.documentElement.style.setProperty('--sync-banner-height', `${el.offsetHeight}px`);
  }

  syncNow(): void {
    void this.syncService.sync();
  }
}
