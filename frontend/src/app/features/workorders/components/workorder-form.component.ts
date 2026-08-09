import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

import { WorkorderService, WorkOrder } from '../services/workorder.service';

@Component({
  selector: 'app-workorder-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    TranslatePipe
  ],
  providers: [MessageService],
  templateUrl: './workorder-form.component.html',
  styleUrl: './workorder-form.component.scss'
})
export class WorkorderFormComponent implements OnInit {
  workOrder: WorkOrder = {
    title: '',
    description: '',
    status: 'OPEN',
    priority: 3,
    assetId: undefined,
    assignedTo: undefined,
    estimatedHours: undefined
  };

  isEdit = false;
  id?: number;
  saving = false;

  statuses = [
    { label: 'WORKORDERS.STATUSES.OPEN', value: 'OPEN' },
    { label: 'WORKORDERS.STATUSES.ASSIGNED', value: 'ASSIGNED' },
    { label: 'WORKORDERS.STATUSES.IN_PROGRESS', value: 'IN_PROGRESS' },
    { label: 'WORKORDERS.STATUSES.ON_HOLD', value: 'ON_HOLD' },
    { label: 'WORKORDERS.STATUSES.CLOSED', value: 'CLOSED' }
  ];

  priorities = [
    { label: '1 - Urgente', value: 1 },
    { label: '2 - Alta', value: 2 },
    { label: '3 - Media', value: 3 },
    { label: '4 - Baja', value: 4 }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workorderService: WorkorderService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.id = +idParam;
      this.workorderService.get(this.id).subscribe({
        next: (data) => this.workOrder = data,
        error: () => this.router.navigate(['/workorders'])
      });
    }
  }

  save(): void {
    this.saving = true;
    const operation = this.isEdit && this.id
      ? this.workorderService.update(this.id, this.workOrder)
      : this.workorderService.create(this.workOrder);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: this.isEdit ? 'Orden actualizada' : 'Orden creada'
        });
        this.router.navigate(['/workorders']);
      },
      error: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la orden'
        });
      }
    });
  }
}
