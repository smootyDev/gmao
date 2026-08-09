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

import { AssetService, Asset } from '../services/asset.service';

@Component({
  selector: 'app-asset-form',
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
  templateUrl: './asset-form.component.html',
  styleUrl: './asset-form.component.scss'
})
export class AssetFormComponent implements OnInit {
  form: FormGroup;
  isEdit = signal(false);
  id = signal<number | undefined>(undefined);
  saving = signal(false);

  criticalities = [
    { label: 'Baja', value: 'LOW' },
    { label: 'Media', value: 'MEDIUM' },
    { label: 'Alta', value: 'HIGH' },
    { label: 'Crítica', value: 'CRITICAL' }
  ];

  statuses = [
    { label: 'Operativo', value: 'OPERATIVE' },
    { label: 'Mantenimiento', value: 'MAINTENANCE' },
    { label: 'Fuera de servicio', value: 'OUT_OF_SERVICE' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private assetService: AssetService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      type: [''],
      serialNumber: [''],
      criticality: ['MEDIUM'],
      status: ['OPERATIVE'],
      location: [''],
      hoursOfUse: [null],
      purchaseDate: [null]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit.set(true);
      this.id.set(+idParam);
      this.assetService.get(+idParam).subscribe({
        next: (data) => {
          this.form.patchValue({
            ...data,
            purchaseDate: data.purchaseDate ? data.purchaseDate.split('T')[0] : null
          });
        },
        error: () => this.router.navigate(['/assets'])
      });
    }
  }

  save(): void {
    this.saving.set(true);
    const asset: Asset = this.form.getRawValue();
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
}
