import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

import { WorkorderService, WorkOrder } from '../../workorders/services/workorder.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, TranslatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  workOrders = signal<WorkOrder[]>([]);
  loading = signal(true);

  openCount = computed(() => this.countByStatus('OPEN'));
  inProgressCount = computed(() => this.countByStatus('IN_PROGRESS') + this.countByStatus('ASSIGNED'));
  closedCount = computed(() => this.countByStatus('CLOSED'));
  urgentCount = computed(() => this.workOrders().filter(wo => wo.priority === 1 && wo.status !== 'CLOSED').length);

  constructor(private workorderService: WorkorderService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.workorderService.list().subscribe({
      next: (data) => {
        this.workOrders.set(data);
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
