import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ListboxModule } from 'primeng/listbox';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { PermissionsService } from '../../../core/services/permissions.service';
import { WORKORDER_STATUS_OPTIONS, WORKORDER_PRIORITY_OPTIONS } from '../../../core/constants/select-options';
import { workOrderStatusSeverity, priorityIcon, priorityColor } from '../../../core/utils/workorder-visual';
import { forkJoin } from 'rxjs';

import { WorkorderService, WorkOrder, WorkOrderItem } from '../services/workorder.service';
import { Asset, AssetService } from '../../assets/services/asset.service';
import { User, UserService } from '../../users/services/user.service';
import { InventoryItem, InventoryItemService } from '../../inventory/services/inventory-item.service';
import { PreventivePlan, PreventivePlanService } from '../../preventive/services/preventive-plan.service';

interface WorkOrderItemRow extends WorkOrderItem {
  name?: string;
  unit?: string;
}

@Component({
  selector: 'app-workorder-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ListboxModule,
    TagModule,
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
  readonly permissions = inject(PermissionsService);
  readonly statusSeverity = workOrderStatusSeverity;
  readonly priorityIcon = priorityIcon;
  readonly priorityColor = priorityColor;

  form: FormGroup;
  isEdit = signal(false);
  id = signal<number | undefined>(undefined);
  saving = signal(false);
  isReadOnly = signal(false);
  assets = signal<Asset[]>([]);
  users = signal<User[]>([]);
  inventoryItems = signal<InventoryItem[]>([]);
  preventivePlans = signal<PreventivePlan[]>([]);
  preventivePlanId = signal<number | undefined>(undefined);
  itemRows = signal<WorkOrderItemRow[]>([]);

  statuses = WORKORDER_STATUS_OPTIONS;
  priorities = WORKORDER_PRIORITY_OPTIONS;

  readonly canSave = computed(
    () => !this.isReadOnly() && (this.permissions.isAdmin() || this.permissions.isManager() || this.permissions.isTech())
  );
  readonly isTechView = computed(() => this.permissions.isTech());
  readonly availableStatuses = computed(() => {
    if (!this.permissions.isTech()) {
      return this.statuses;
    }
    return this.statuses.filter((status) => status.value !== 'OPEN');
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private workorderService: WorkorderService,
    private assetService: AssetService,
    private userService: UserService,
    private inventoryItemService: InventoryItemService,
    private preventivePlanService: PreventivePlanService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['OPEN'],
      priority: [3],
      assetId: [null],
      assignedTo: [null],
      estimatedHours: [null],
      actualHours: [null]
    });
  }

  ngOnInit(): void {
    forkJoin({
      assets: this.assetService.list(),
      users: this.userService.list(),
      inventoryItems: this.inventoryItemService.list(),
      preventivePlans: this.preventivePlanService.list()
    }).subscribe(({ assets, users, inventoryItems, preventivePlans }) => {
      this.assets.set(assets);
      this.users.set(users);
      this.inventoryItems.set(inventoryItems);
      this.preventivePlans.set(preventivePlans);
    });
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit.set(true);
      this.id.set(+idParam);
      this.workorderService.get(+idParam).subscribe({
        next: (data) => {
          this.form.patchValue(data);
          this.preventivePlanId.set(data.preventivePlanId);
          this.itemRows.set(this.decorateItems(data.items ?? []));
          this.isReadOnly.set(
            this.permissions.isTech() && !this.permissions.isWorkOrderAssigned(data.assignedTo)
          );
          this.applyPermissions();
        },
        error: () => this.router.navigate(['/workorders'])
      });
    }
  }

  private applyPermissions(): void {
    const tech = this.permissions.isTech();
    if (this.isReadOnly()) {
      Object.values(this.form.controls).forEach((control) => control.disable());
      return;
    }
    if (tech) {
      ['title', 'priority', 'assetId', 'assignedTo', 'estimatedHours'].forEach((name) => {
        this.form.get(name)?.disable();
      });
    }
  }

  preventivePlanName(): string {
    const plan = this.preventivePlans().find((candidate) => candidate.id === this.preventivePlanId());
    return plan ? `#${plan.id} - ${plan.name}` : '';
  }

  addItem(): void {
    const available = this.inventoryItems().filter(
      (item) => !this.itemRows().some((row) => row.inventoryItemId === item.id)
    );
    if (available.length === 0) {
      return;
    }
    const first = available[0];
    this.itemRows.update((rows) => [...rows, { inventoryItemId: first.id!, quantity: 1, name: first.name, unit: first.unit }]);
  }

  onItemSelected(row: WorkOrderItemRow, inventoryItemId: number): void {
    const selected = this.inventoryItems().find((item) => item.id === inventoryItemId);
    this.itemRows.update((rows) =>
      rows.map((r) => (r === row ? { ...r, inventoryItemId, name: selected?.name, unit: selected?.unit } : r))
    );
  }

  updateItemQuantity(row: WorkOrderItemRow, quantity: unknown): void {
    const n = Number(quantity);
    const value = Number.isFinite(n) && n >= 0 ? n : 1;
    this.itemRows.update((rows) =>
      rows.map((r) => (r === row ? { ...r, quantity: value } : r))
    );
  }

  removeItemRow(row: WorkOrderItemRow): void {
    this.itemRows.update((rows) => rows.filter((r) => r !== row));
  }

  itemOptionsForRow(row: WorkOrderItemRow): InventoryItem[] {
    const available = this.inventoryItems().filter(
      (item) => !this.itemRows().some((candidate) => candidate !== row && candidate.inventoryItemId === item.id)
    );
    const selected = this.inventoryItems().find((item) => item.id === row.inventoryItemId);
    if (selected && !available.some((item) => item.id === selected.id)) {
      return [...available, selected];
    }
    return available;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const workOrder: WorkOrder = {
      title: raw.title,
      description: raw.description,
      status: raw.status,
      priority: Number(raw.priority),
      assetId: this.toNumber(raw.assetId),
      assignedTo: this.toNumber(raw.assignedTo),
      estimatedHours: this.toNumber(raw.estimatedHours),
      actualHours: this.toNumber(raw.actualHours),
      items: this.itemRows().map((row) => ({
        inventoryItemId: row.inventoryItemId,
        quantity: row.quantity
      }))
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

  private decorateItems(items: WorkOrderItem[]): WorkOrderItemRow[] {
    return items.map((item) => {
      const inventory = this.inventoryItems().find((candidate) => candidate.id === item.inventoryItemId);
      return { ...item, name: inventory?.name, unit: inventory?.unit };
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
