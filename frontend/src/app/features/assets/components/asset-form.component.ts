import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ASSET_CRITICALITY_OPTIONS, ASSET_STATUS_OPTIONS } from '../../../core/constants/select-options';

import { AssetService, Asset } from '../services/asset.service';
import { Location, LocationService } from '../../locations/services/location.service';
import { AssetType, AssetTypeService } from '../../asset-types/services/asset-type.service';

@Component({
  selector: 'app-asset-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    InputTextModule,
    DatePickerModule,
    InputNumberModule,
    SelectModule,
    ButtonModule,
    TextareaModule,
    ToastModule,
    TranslatePipe
  ],
  providers: [MessageService],
  templateUrl: './asset-form.component.html',
  styleUrl: './asset-form.component.scss'
})
export class AssetFormComponent implements OnInit {
  form: FormGroup;
  isEdit = signal(false);
  id = signal<number | undefined>(undefined);
  saving = signal(false);
  locations = signal<Location[]>([]);
  assetTypes = signal<AssetType[]>([]);

  criticalities = ASSET_CRITICALITY_OPTIONS;
  statuses = ASSET_STATUS_OPTIONS;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private assetService: AssetService,
    private locationService: LocationService,
    private assetTypeService: AssetTypeService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      typeId: [null],
      serialNumber: [''],
      criticality: ['MEDIUM'],
      status: ['OPERATIVE'],
      locationId: [null],
      hoursOfUse: [null],
      purchaseDate: [null]
    });
  }

  ngOnInit(): void {
    this.locationService.list().subscribe((locations) => this.locations.set(locations));
    this.assetTypeService.list().subscribe((assetTypes) => this.assetTypes.set(assetTypes));
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit.set(true);
      this.id.set(+idParam);
      this.assetService.get(+idParam).subscribe({
        next: (data) => {
          this.form.patchValue({
            ...data,
             purchaseDate: data.purchaseDate ? new Date(`${data.purchaseDate}T00:00:00`) : null
          });
        },
        error: () => this.router.navigate(['/assets'])
      });
    }
  }

  save(): void {
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const asset: Asset = {
      ...raw,
      purchaseDate: this.toDateString(raw.purchaseDate)
    };
    const operation = this.isEdit() && this.id() !== undefined
      ? this.assetService.update(this.id()!, asset)
      : this.assetService.create(asset);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: this.isEdit() ? 'Activo actualizado' : 'Activo creado'
        });
        this.router.navigate(['/assets']);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el activo'
        });
      }
    });
  }

  private toDateString(value: unknown): string | undefined {
    if (!value) {
      return undefined;
    }
    if (typeof value === 'string') {
      return value.split('T')[0];
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return undefined;
  }
}
