import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
    ReactiveFormsModule,
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
  form: FormGroup;
  isEdit = signal(false);
  id = signal<number | undefined>(undefined);
  saving = signal(false);

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
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private workorderService: WorkorderService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['OPEN'],
      priority: [3],
      assetId: [null],
      assignedTo: [null],
      estimatedHours: [null]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit.set(true);
      this.id.set(+idParam);
      this.workorderService.get(+idParam).subscribe({
        next: (data) => this.form.patchValue(data),
        error: () => this.router.navigate(['/workorders'])
      });
    }
  }

  save(): void {
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const workOrder: WorkOrder = {
      title: raw.title,
      description: raw.description,
      status: raw.status,
      priority: Number(raw.priority),
      assetId: this.toNumber(raw.assetId),
      assignedTo: this.toNumber(raw.assignedTo),
      estimatedHours: this.toNumber(raw.estimatedHours)
    };

    const operation = this.isEdit() && this.id() !== undefined
      ? this.workorderService.update(this.id()!, workOrder)
      : this.workorderService.create(workOrder);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: this.isEdit() ? 'Orden actualizada' : 'Orden creada'
        });
        this.router.navigate(['/workorders']);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la orden'
        });
      }
    });
  }

  private toNumber(value: unknown): number | undefined {
    if (value === null || value === '' || value === undefined) {
      return undefined;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
}
