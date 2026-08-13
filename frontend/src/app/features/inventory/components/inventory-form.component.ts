import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { INVENTORY_UNIT_OPTIONS, INVENTORY_CATEGORY_OPTIONS } from '../../../core/constants/select-options';
import { InventoryItem, InventoryItemService } from '../services/inventory-item.service';
import { Location, LocationService } from '../../locations/services/location.service';

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ButtonModule,
    TextareaModule,
    CheckboxModule,
    ToastModule,
    TranslatePipe
  ],
  providers: [MessageService],
  templateUrl: './inventory-form.component.html',
  styleUrl: './inventory-form.component.scss'
})
export class InventoryFormComponent implements OnInit {
  form: FormGroup;
  isEdit = signal(false);
  id = signal<number | undefined>(undefined);
  saving = signal(false);
  locations = signal<Location[]>([]);

  unitOptions = INVENTORY_UNIT_OPTIONS;
  categoryOptions = INVENTORY_CATEGORY_OPTIONS;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private inventoryItemService: InventoryItemService,
    private locationService: LocationService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', Validators.required],
      description: [''],
      category: [null],
      unit: ['ud'],
      minimumStock: [0, [Validators.min(0)]],
      currentStock: [0, [Validators.min(0)]],
      locationId: [null],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.locationService.list().subscribe((locations) => this.locations.set(locations));
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit.set(true);
      this.id.set(+idParam);
      this.inventoryItemService.get(+idParam).subscribe({
        next: (data) => this.form.patchValue(data),
        error: () => this.router.navigate(['/inventory'])
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const item = this.form.getRawValue() as InventoryItem;
    const operation = this.isEdit() && this.id() !== undefined
      ? this.inventoryItemService.update(this.id()!, item)
      : this.inventoryItemService.create(item);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: this.isEdit() ? 'Artículo actualizado' : 'Artículo creado'
        });
        this.router.navigate(['/inventory']);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el artículo'
        });
      }
    });
  }
}
