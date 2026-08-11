import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AssetType, AssetTypeService } from '../services/asset-type.service';

@Component({
  selector: 'app-asset-type-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule, TableModule, TagModule, InputTextModule, TranslatePipe],
  templateUrl: './asset-type-list.component.html',
  styleUrl: './asset-type-list.component.scss'
})
export class AssetTypeListComponent implements OnInit {
  assetTypes = signal<AssetType[]>([]);
  loading = signal(true);

  constructor(private readonly assetTypeService: AssetTypeService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.assetTypeService.list().subscribe({
      next: (assetTypes) => {
        this.assetTypes.set(assetTypes);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  delete(id: number): void {
    if (confirm('¿Eliminar este tipo de activo?')) {
      this.assetTypeService.delete(id).subscribe({
        next: () => this.loadData(),
        error: () => alert('No se puede eliminar un tipo de activo en uso')
      });
    }
  }
}
