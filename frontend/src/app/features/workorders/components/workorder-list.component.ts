import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { DropdownColumnFilterComponent } from '../../../core/components/dropdown-column-filter/dropdown-column-filter.component';
import { WORKORDER_STATUS_OPTIONS, WORKORDER_PRIORITY_OPTIONS } from '../../../core/constants/select-options';
import { FilterOption } from '../../../core/models/filter-option';
import { InputTextModule } from 'primeng/inputtext';
import { forkJoin, Subscription } from 'rxjs';

import { WorkorderService, WorkOrder } from '../services/workorder.service';
import { Asset, AssetService } from '../../assets/services/asset.service';
import { User, UserService } from '../../users/services/user.service';
import { SyncService } from '../../../core/services/sync.service';

@Component({
  selector: 'app-workorder-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    TableModule,
    ButtonModule,
    TagModule,
    TranslatePipe, InputTextModule,
    DropdownColumnFilterComponent
  ],
  templateUrl: './workorder-list.component.html',
  styleUrl: './workorder-list.component.scss'
})
export class WorkorderListComponent implements OnInit, OnDestroy {
  workOrders = signal<WorkOrder[]>([]);
  loading = signal(true);
  assets = signal<Asset[]>([]);
  users = signal<User[]>([]);

  statusOptions = WORKORDER_STATUS_OPTIONS;
  priorityOptions = WORKORDER_PRIORITY_OPTIONS;
  assetFilterOptions = computed<FilterOption<number | undefined>[]>(() =>
    this.assets().map((asset) => ({
      label: `${asset.serialNumber || asset.id} - ${asset.name}`,
      value: asset.id
    }))
  );
  userFilterOptions = computed<FilterOption<number | undefined>[]>(() =>
    this.users().map((user) => ({
      label: `${user.employeeCode} - ${user.firstName} ${user.lastName}`,
      value: user.id
    }))
  );

  private readonly subscriptions: Subscription[] = [];

  constructor(
    private workorderService: WorkorderService,
    private assetService: AssetService,
    private userService: UserService,
    private syncService: SyncService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.subscriptions.push(
      this.syncService.syncCompleted.subscribe(() => this.loadData())
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  loadData(): void {
    this.loading.set(true);
    forkJoin({ workOrders: this.workorderService.list(), assets: this.assetService.list(), users: this.userService.list() }).subscribe({
      next: ({ workOrders, assets, users }) => {
        this.workOrders.set(workOrders); this.assets.set(assets); this.users.set(users); this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  assetName(id?: number | null): string { return this.assets().find((asset) => asset.id === id)?.name || '-'; }
  userName(id?: number | null): string {
    const user = this.users().find((candidate) => candidate.id === id);
    return user ? `${user.employeeCode} - ${user.firstName} ${user.lastName}` : '-';
  }
  priorityName(priority?: number): string { return ({ 1: '1 - Urgente', 2: '2 - Alta', 3: '3 - Media', 4: '4 - Baja' } as Record<number, string>)[priority || 3]; }

  delete(id: number): void {
    if (confirm('¿Eliminar esta orden de trabajo?')) {
      this.workorderService.delete(id).subscribe(() => this.loadData());
    }
  }

  getSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (status) {
      case 'OPEN': return 'info';
      case 'ASSIGNED': return 'secondary';
      case 'IN_PROGRESS': return 'warn';
      case 'ON_HOLD': return 'danger';
      case 'CLOSED': return 'success';
      default: return 'info';
    }
  }
}
