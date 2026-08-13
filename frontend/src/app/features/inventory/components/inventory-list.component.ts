import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { forkJoin, Subscription } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { SyncService } from '../../../core/services/sync.service';
import { InventoryItem, InventoryItemService } from '../services/inventory-item.service';
import { Location, LocationService } from '../../locations/services/location.service';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, TableModule, ButtonModule, TagModule, InputTextModule, TranslatePipe],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.scss'
})
export class InventoryListComponent implements OnInit, OnDestroy {
  items = signal<InventoryItem[]>([]);
  locations = signal<Location[]>([]);
  loading = signal(true);

  lowStockCount = computed(() => this.items().filter((item) => (item.currentStock ?? 0) <= (item.minimumStock ?? 0)).length);

  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly inventoryItemService: InventoryItemService,
    private readonly locationService: LocationService,
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
      locations: this.locationService.list()
    }).subscribe({
      next: ({ items, locations }) => {
        this.items.set(items);
        this.locations.set(locations);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  locationName(id?: number | null): string {
    return this.locations().find((location) => location.id === id)?.name || '-';
  }

  isLowStock(item: InventoryItem): boolean {
    return (item.currentStock ?? 0) <= (item.minimumStock ?? 0);
  }

  delete(id: number): void {
    if (confirm('¿Eliminar este artículo de inventario?')) {
      this.inventoryItemService.delete(id).subscribe(() => this.loadData());
    }
  }
}
