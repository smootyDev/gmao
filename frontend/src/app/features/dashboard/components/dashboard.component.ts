import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

import { WorkorderService, WorkOrder } from '../../workorders/services/workorder.service';
import { Asset, AssetService } from '../../assets/services/asset.service';
import { Location, LocationService } from '../../locations/services/location.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, TranslatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  workOrders = signal<WorkOrder[]>([]);
  assets = signal<Asset[]>([]);
  locations = signal<Location[]>([]);
  loading = signal(true);

  openCount = computed(() => this.countByStatus('OPEN'));
  inProgressCount = computed(() => this.countByStatus('IN_PROGRESS') + this.countByStatus('ASSIGNED'));
  closedCount = computed(() => this.countByStatus('CLOSED'));
  urgentCount = computed(() => this.workOrders().filter(wo => wo.priority === 1 && wo.status !== 'CLOSED').length);
  pendingCount = computed(() => this.workOrders().filter((wo) => wo.status !== 'CLOSED').length);
  activeAssetCount = computed(() => this.assets().filter((asset) => asset.status === 'OPERATIVE').length);
  availability = computed(() => this.assets().length ? ((this.activeAssetCount() / this.assets().length) * 100).toFixed(1) : '0.0');

  constructor(private workorderService: WorkorderService, private assetService: AssetService, private locationService: LocationService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    forkJoin({ workOrders: this.workorderService.list(), assets: this.assetService.list(), locations: this.locationService.list() }).subscribe({
      next: ({ workOrders, assets, locations }) => {
        this.workOrders.set(workOrders);
        this.assets.set(assets);
        this.locations.set(locations);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private countByStatus(status: string): number {
    return this.workOrders().filter(wo => wo.status === status).length;
  }
}
