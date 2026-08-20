import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AssetType, AssetTypeService } from '../services/asset-type.service';
import { SyncService } from '../../../core/services/sync.service';
import { ASSET_TYPE_ICONS, assetTypeIconColor } from '../../../core/utils/asset-type-visual';

@Component({
  selector: 'app-asset-type-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonModule, CardModule, TableModule, TagModule, InputTextModule, SelectModule, TranslatePipe],
  templateUrl: './asset-type-list.component.html',
  styleUrl: './asset-type-list.component.scss'
})
export class AssetTypeListComponent implements OnInit, OnDestroy {
  assetTypes = signal<AssetType[]>([]);
  loading = signal(true);
  iconOptions = ASSET_TYPE_ICONS.map((icon) => ({ label: icon.replace('pi-', ''), value: icon }));
  savingIconId = signal<number | undefined>(undefined);

  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly assetTypeService: AssetTypeService,
    private readonly syncService: SyncService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.subscriptions.push(
      this.syncService.syncCompleted.subscribe(() => this.loadData())
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
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

  iconColor(icon: string | undefined): string {
    return assetTypeIconColor(icon);
  }

  onIconChange(assetType: AssetType, icon: string): void {
    if (!assetType.id || !icon) {
      return;
    }
    this.savingIconId.set(assetType.id);
    this.assetTypeService.update(assetType.id, { ...assetType, icon }).subscribe({
      next: () => this.loadData(),
      error: () => this.savingIconId.set(undefined)
    });
  }
}
