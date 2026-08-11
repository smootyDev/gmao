import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { WORKORDER_STATUS_OPTIONS, WORKORDER_PRIORITY_OPTIONS } from '../../../core/constants/select-options';
import { forkJoin } from 'rxjs';

import { WorkorderService, WorkOrder } from '../services/workorder.service';
import { Asset, AssetService } from '../../assets/services/asset.service';
import { User, UserService } from '../../users/services/user.service';

@Component({
  selector: 'app-workorder-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TextareaModule,
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
  assets = signal<Asset[]>([]);
  users = signal<User[]>([]);

  statuses = WORKORDER_STATUS_OPTIONS;
  priorities = WORKORDER_PRIORITY_OPTIONS;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private workorderService: WorkorderService,
    private assetService: AssetService,
    private userService: UserService,
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
    forkJoin({ assets: this.assetService.list(), users: this.userService.list() }).subscribe(({ assets, users }) => {
      this.assets.set(assets);
      this.users.set(users);
    });
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
