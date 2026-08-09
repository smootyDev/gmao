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

import { AssetService, Asset } from '../services/asset.service';

@Component({
  selector: 'app-asset-form',
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
  templateUrl: './asset-form.component.html',
  styleUrl: './asset-form.component.scss'
})
export class AssetFormComponent implements OnInit {
  asset: Asset = {
    name: '',
    type: '',
    criticality: 'MEDIUM',
    status: 'OPERATIVE',
    location: '',
    serialNumber: '',
    hoursOfUse: undefined,
    purchaseDate: undefined
  };

  isEdit = false;
  id?: number;
  saving = false;

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
    private route: ActivatedRoute,
    private router: Router,
    private assetService: AssetService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.id = +idParam;
      this.assetService.get(this.id).subscribe({
        next: (data) => {
          this.asset = {
            ...data,
            purchaseDate: data.purchaseDate ? data.purchaseDate.split('T')[0] : undefined
          };
        },
        error: () => this.router.navigate(['/assets'])
      });
    }
  }

  save(): void {
    this.saving = true;
    const operation = this.isEdit && this.id
      ? this.assetService.update(this.id, this.asset)
      : this.assetService.create(this.asset);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: this.isEdit ? 'Activo actualizado' : 'Activo creado'
        });
        this.router.navigate(['/assets']);
      },
      error: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el activo'
        });
      }
    });
  }
}
