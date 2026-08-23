import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

import { WorkorderService, WorkOrder } from '../../workorders/services/workorder.service';
import { Asset, AssetService } from '../../assets/services/asset.service';
import { Location, LocationService } from '../../locations/services/location.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule, TableModule, TagModule, ButtonModule, RouterModule, TranslatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly translate = inject(TranslateService);

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

  recentWorkOrders = computed(() => [...this.workOrders()]
    .sort((a, b) => this.timestamp(b.createdAt) - this.timestamp(a.createdAt))
    .slice(0, 5));

  statusChartData = computed(() => ({
    labels: [
      this.translate.instant('DASHBOARD.STATUS_PENDING'),
      this.translate.instant('DASHBOARD.STATUS_IN_PROGRESS'),
      this.translate.instant('DASHBOARD.STATUS_COMPLETED'),
      this.translate.instant('DASHBOARD.STATUS_ON_HOLD')
    ],
    datasets: [{
      data: [
        this.countByStatus('OPEN') + this.countByStatus('ASSIGNED'),
        this.countByStatus('IN_PROGRESS'),
        this.countByStatus('CLOSED'),
        this.countByStatus('ON_HOLD')
      ],
      backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'],
      borderWidth: 0,
      hoverOffset: 8
    }]
  }));

  monthlyTrendData = computed(() => {
    const months = this.lastMonths();
    return {
      labels: months.map((month) => month.label),
      datasets: [
        {
          label: this.translate.instant('DASHBOARD.OPENED'),
          data: months.map((month) => month.opened),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 3
        },
        {
          label: this.translate.instant('DASHBOARD.CLOSED'),
          data: months.map((month) => month.closed),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          fill: true,
          tension: 0.35,
          pointRadius: 3
        }
      ]
    };
  });

  chartOptions = {
    plugins: {
      legend: { position: 'bottom' as const, labels: { usePointStyle: true, padding: 18 } }
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
      x: { grid: { display: false } }
    }
  };

  doughnutChartOptions = {
    plugins: {
      legend: { 
        position: 'right' as const, 
        labels: { usePointStyle: true, padding: 14 } 
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    radius: '95%'
  };

  alerts = computed(() => {
    const result: DashboardAlert[] = [];
    const urgent = this.urgentCount();
    const unavailable = this.assets().filter((asset) => asset.status && asset.status !== 'OPERATIVE').length;
    const onHold = this.countByStatus('ON_HOLD');

    if (urgent > 0) result.push({ severity: 'danger', icon: 'pi pi-exclamation-triangle', message: 'DASHBOARD.URGENT_ALERT', count: urgent });
    if (unavailable > 0) result.push({ severity: 'warn', icon: 'pi pi-box', message: 'DASHBOARD.UNAVAILABLE_ALERT', count: unavailable });
    if (onHold > 0) result.push({ severity: 'info', icon: 'pi pi-pause-circle', message: 'DASHBOARD.ON_HOLD_ALERT', count: onHold });
    return result;
  });

  constructor(private workorderService: WorkorderService, private assetService: AssetService, private locationService: LocationService) { }

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

  private timestamp(value?: string): number {
    return value ? new Date(value).getTime() : 0;
  }

  assetName(id?: number | null): string {
    return this.assets().find((asset) => asset.id === id)?.name || '';
  }

  private lastMonths(): MonthlyTrend[] {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const inMonth = (value?: string) => {
        if (!value) return false;
        const itemDate = new Date(value);
        return itemDate.getFullYear() === year && itemDate.getMonth() === month;
      };
      return {
        label: date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
        opened: this.workOrders().filter((wo) => inMonth(wo.createdAt)).length,
        closed: this.workOrders().filter((wo) => wo.status === 'CLOSED' && inMonth(wo.updatedAt || wo.createdAt)).length
      };
    });
  }
}

interface MonthlyTrend {
  label: string;
  opened: number;
  closed: number;
}

interface DashboardAlert {
  severity: 'danger' | 'warn' | 'info';
  icon: string;
  message: string;
  count: number;
}
