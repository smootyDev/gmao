import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

import { WorkorderService, WorkOrder } from '../services/workorder.service';

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
    TranslatePipe
  ],
  templateUrl: './workorder-list.component.html',
  styleUrl: './workorder-list.component.scss'
})
export class WorkorderListComponent implements OnInit {
  workOrders = signal<WorkOrder[]>([]);
  loading = signal(true);

  constructor(private workorderService: WorkorderService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
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
