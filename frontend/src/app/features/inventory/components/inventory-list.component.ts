import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { forkJoin, Subscription } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { TextColumnFilterComponent } from '../../../core/components/text-column-filter/text-column-filter.component';
import { SyncService } from '../../../core/services/sync.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { InventoryItem, InventoryItemService } from '../services/inventory-item.service';
import { Location, LocationService } from '../../locations/services/location.service';
import { WorkOrder, WorkorderService } from '../../workorders/services/workorder.service';

interface InventoryItemView extends InventoryItem {
  locationLabel: string;
  associated: boolean;
}

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, TableModule, ButtonModule, TagModule, InputTextModule, DialogModule, ProgressSpinnerModule, TranslatePipe, TextColumnFilterComponent],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.scss'
})
export class InventoryListComponent implements OnInit, OnDestroy {
  readonly permissions = inject(PermissionsService);
  items = signal<InventoryItem[]>([]);
  locations = signal<Location[]>([]);
  loading = signal(true);

  usageDialogVisible = signal(false);
  usageItem = signal<InventoryItem | null>(null);
  usageWorkOrders = signal<WorkOrder[]>([]);
  usageLoading = signal(false);

  lowStockCount = computed(() => this.items().filter((item) => (item.currentStock ?? 0) <= (item.minimumStock ?? 0)).length);

  rows = computed<InventoryItemView[]>(() =>
    this.items().map((item) => ({
      ...item,
      locationLabel: this.locationName(item.locationId),
      associated: this.isAssociated(item)
    }))
  );

  private usedItemIds = signal<Set<number>>(new Set());
  associatedCount = computed(() => this.items().filter((item) => item.id != null && this.usedItemIds().has(item.id)).length);

  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly inventoryItemService: InventoryItemService,
    private readonly locationService: LocationService,
    private readonly workorderService: WorkorderService,
    private readonly syncService: SyncService
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
      items: this.inventoryItemService.list(),
      locations: this.locationService.list(),
      workOrders: this.workorderService.list()
    }).subscribe({
      next: ({ items, locations, workOrders }) => {
        this.items.set(items);
        this.locations.set(locations);
        this.usedItemIds.set(new Set(
          workOrders.flatMap((wo) => (wo.items ?? []).map((item) => item.inventoryItemId))
        ));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  locationName(id?: number | null): string {
    return this.locations().find((location) => location.id === id)?.name || '';
  }

  isLowStock(item: InventoryItem): boolean {
    return (item.currentStock ?? 0) <= (item.minimumStock ?? 0);
  }

  isAssociated(item: InventoryItem): boolean {
    return item.id != null && this.usedItemIds().has(item.id);
  }

  showUsage(item: InventoryItem): void {
    this.usageItem.set(item);
    this.usageDialogVisible.set(true);
    this.usageWorkOrders.set([]);
    this.usageLoading.set(true);
    this.inventoryItemService.usedInWorkOrders(item.id!).subscribe({
      next: (workOrders) => {
        this.usageWorkOrders.set(workOrders);
        this.usageLoading.set(false);
      },
      error: () => {
        this.usageLoading.set(false);
      }
    });
  }

  usageTitle(): string {
    const item = this.usageItem();
    if (!item) {
      return '';
    }
    return `#${item.id} - ${item.code} - ${item.name}`;
  }

  delete(id: number): void {
    if (confirm('¿Eliminar este artículo de inventario?')) {
      this.inventoryItemService.delete(id).subscribe(() => this.loadData());
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


