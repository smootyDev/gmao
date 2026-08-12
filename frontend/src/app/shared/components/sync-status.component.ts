import { Component, inject } from '@angular/core';
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
export class SyncStatusComponent {
  private readonly syncService = inject(SyncService);

  isOnline = this.syncService.isOnline;
  hasPending = this.syncService.hasPending;
  isSyncing = this.syncService.isSyncing;
  pendingCount = this.syncService.pendingCount;

  syncNow(): void {
    void this.syncService.sync();
  }
}
