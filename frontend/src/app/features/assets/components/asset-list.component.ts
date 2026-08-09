import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

import { AssetService, Asset } from '../services/asset.service';

@Component({
  selector: 'app-asset-list',
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
  templateUrl: './asset-list.component.html',
  styleUrl: './asset-list.component.scss'
})
export class AssetListComponent implements OnInit {
  assets = signal<Asset[]>([]);
  loading = signal(true);

  constructor(private assetService: AssetService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.assetService.list().subscribe({
      next: (data) => {
        this.assets.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  delete(id: number): void {
    if (confirm('¿Eliminar este activo?')) {
      this.assetService.delete(id).subscribe(() => this.loadData());
    }
  }

  getSeverity(criticality?: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (criticality) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warn';
      case 'HIGH': return 'danger';
      case 'CRITICAL': return 'danger';
      default: return 'info';
    }
  }
}
