import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { DropdownColumnFilterComponent } from '../../../core/components/dropdown-column-filter/dropdown-column-filter.component';
import { TextColumnFilterComponent } from '../../../core/components/text-column-filter/text-column-filter.component';
import { WORKORDER_STATUS_OPTIONS, WORKORDER_PRIORITY_OPTIONS } from '../../../core/constants/select-options';
import { FilterOption } from '../../../core/models/filter-option';
import { InputTextModule } from 'primeng/inputtext';
import { forkJoin, Subscription } from 'rxjs';

import { WorkorderService, WorkOrder } from '../services/workorder.service';
import { Asset, AssetService } from '../../assets/services/asset.service';
import { User, UserService } from '../../users/services/user.service';
import { InventoryItem, InventoryItemService } from '../../inventory/services/inventory-item.service';
import { SyncService } from '../../../core/services/sync.service';

interface WorkOrderView extends WorkOrder {
  itemsCount: number;
  priorityLabel: string;
  assetLabel: string;
  userLabel: string;
  origin: 'preventive' | 'manual';
}

interface WorkOrderMetric {
  label: string;
  value: string;
  color: 'blue' | 'amber' | 'green' | 'red' | 'cyan';
}

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
    TooltipModule,
    TranslatePipe, InputTextModule,
    DropdownColumnFilterComponent,
    TextColumnFilterComponent
  ],
  templateUrl: './workorder-list.component.html',
  styleUrl: './workorder-list.component.scss'
})
export class WorkorderListComponent implements OnInit, OnDestroy {
  workOrders = signal<WorkOrder[]>([]);
  loading = signal(true);
  assets = signal<Asset[]>([]);
  users = signal<User[]>([]);
  inventoryItems = signal<InventoryItem[]>([]);

  rows = computed<WorkOrderView[]>(() =>
    this.workOrders().map((wo) => ({
      ...wo,
      itemsCount: (wo.items ?? []).length,
      priorityLabel: this.priorityName(wo.priority),
      assetLabel: this.assetName(wo.assetId),
      userLabel: this.userName(wo.assignedTo),
      origin: wo.preventivePlanId ? 'preventive' : 'manual'
    }))
  );

  metrics = computed<WorkOrderMetric[]>(() => {
    const orders = this.workOrders();
    const completed = orders.filter((wo) => wo.status === 'CLOSED').length;
    const open = orders.filter((wo) => wo.status !== 'CLOSED').length;
    const urgent = orders.filter((wo) => wo.priority === 1 && wo.status !== 'CLOSED').length;
    const corrective = orders.filter((wo) => !wo.preventivePlanId).length;
    const preventive = orders.filter((wo) => !!wo.preventivePlanId).length;
    const compliance = orders.length ? Math.round((completed / orders.length) * 100) : 0;

    return [
      { label: 'WORKORDERS.METRICS.TOTAL', value: `${orders.length}`, color: 'blue' },
      { label: 'WORKORDERS.METRICS.OPEN', value: `${open}`, color: 'amber' },
      { label: 'WORKORDERS.METRICS.COMPLETED', value: `${completed}`, color: 'green' },
      { label: 'WORKORDERS.METRICS.URGENT', value: `${urgent}`, color: 'red' },
      { label: 'WORKORDERS.METRICS.CORRECTIVE', value: `${corrective}`, color: 'red' },
      { label: 'WORKORDERS.METRICS.PREVENTIVE', value: `${preventive}`, color: 'cyan' },
      { label: 'WORKORDERS.METRICS.COMPLIANCE', value: `${compliance}%`, color: 'amber' },
      { label: 'WORKORDERS.METRICS.MTTR', value: this.averageRepairHours(orders), color: 'cyan' },
      { label: 'WORKORDERS.METRICS.TOTAL_COST', value: this.totalCost(orders), color: 'amber' }
    ];
  });

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
    private inventoryItemService: InventoryItemService,
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
    forkJoin({
      workOrders: this.workorderService.list(),
      assets: this.assetService.list(),
      users: this.userService.list(),
      inventoryItems: this.inventoryItemService.list()
    }).subscribe({
      next: ({ workOrders, assets, users, inventoryItems }) => {
        this.workOrders.set(workOrders); this.assets.set(assets); this.users.set(users); this.inventoryItems.set(inventoryItems); this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  assetName(id?: number | null): string { return this.assets().find((asset) => asset.id === id)?.name || ''; }
  userName(id?: number | null): string {
    const user = this.users().find((candidate) => candidate.id === id);
    return user ? `${user.employeeCode} - ${user.firstName} ${user.lastName}` : '';
  }
  priorityName(priority?: number): string {
    return WORKORDER_PRIORITY_OPTIONS.find((option) => option.value === priority)?.label ?? '';
  }

  private averageRepairHours(orders: WorkOrder[]): string {
    const hours = orders
      .filter((wo) => wo.status === 'CLOSED')
      .map((wo) => wo.actualHours ?? wo.estimatedHours)
      .filter((value): value is number => value !== undefined && value >= 0);
    return hours.length ? `${(hours.reduce((sum, value) => sum + value, 0) / hours.length).toFixed(1)}h` : '—';
  }

  private totalCost(orders: WorkOrder[]): string {
    const costs = orders
      .map((wo) => wo.actualCost ?? wo.cost)
      .filter((value): value is number => value !== undefined && value >= 0);
    if (!costs.length) return '—';
    const total = costs.reduce((sum, value) => sum + value, 0);
    return total >= 1000 ? `$${(total / 1000).toFixed(1)}K` : `$${total.toFixed(0)}`;
  }

  itemsTooltip(wo: WorkOrder): string {
    return (wo.items ?? [])
      .map((item) => {
        const name = this.inventoryItems().find((candidate) => candidate.id === item.inventoryItemId)?.name ?? `#${item.inventoryItemId}`;
        return `${name} × ${item.quantity}`;
      })
      .join(' | ');
  }

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
