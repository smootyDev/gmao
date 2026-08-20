import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { forkJoin, Subscription } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { DropdownColumnFilterComponent } from '../../../core/components/dropdown-column-filter/dropdown-column-filter.component';
import { TextColumnFilterComponent } from '../../../core/components/text-column-filter/text-column-filter.component';
import { ASSET_CRITICALITY_OPTIONS, ASSET_STATUS_OPTIONS } from '../../../core/constants/select-options';
import { FilterOption } from '../../../core/models/filter-option';
import { AssetService, Asset } from '../services/asset.service';
import { Location, LocationService } from '../../locations/services/location.service';
import { AssetType, AssetTypeService } from '../../asset-types/services/asset-type.service';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { SyncService } from '../../../core/services/sync.service';
import { assetTypeVisual, TagSeverity } from '../../../core/utils/asset-type-visual';

interface AssetView extends Asset {
  typeName: string;
  locationLabel: string;
}

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    TableModule,
    ButtonModule,
    TagModule,
    SelectModule,
    InputTextModule,
    TranslatePipe,
    DropdownColumnFilterComponent,
    TextColumnFilterComponent
  ],
  templateUrl: './asset-list.component.html',
  styleUrl: './asset-list.component.scss'
})
export class AssetListComponent implements OnInit, OnDestroy {
  assets = signal<Asset[]>([]);
  loading = signal(true);
  locations = signal<Location[]>([]);
  assetTypes = signal<AssetType[]>([]);
  selectedTypeId = signal<number | null>(null);

  rows = computed<AssetView[]>(() =>
    this.filteredAssets().map((asset) => ({
      ...asset,
      typeName: this.typeName(asset.typeId),
      locationLabel: this.locationName(asset.locationId)
    }))
  );

  criticalityOptions = ASSET_CRITICALITY_OPTIONS;
  statusOptions = ASSET_STATUS_OPTIONS;
  typeFilterOptions = computed<FilterOption<number | undefined>[]>(() =>
    this.assetTypes().map((assetType) => ({
      label: `${assetType.code} - ${assetType.name}`,
      value: assetType.id
    }))
  );
  locationFilterOptions = computed<FilterOption<number | undefined>[]>(() =>
    this.locations().map((location) => ({
      label: `${location.code} - ${location.name}`,
      value: location.id
    }))
  );

  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly assetService: AssetService,
    private readonly locationService: LocationService,
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
    forkJoin({
      locations: this.locationService.list(),
      assets: this.assetService.list(),
      assetTypes: this.assetTypeService.list()
    }).subscribe({
      next: ({ locations, assets, assetTypes }) => {
        this.locations.set(locations);
        this.assets.set(assets);
        this.assetTypes.set(assetTypes);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filteredAssets(): Asset[] {
    const typeId = this.selectedTypeId();
    return typeId == null ? this.assets() : this.assets().filter((asset) => asset.typeId === typeId);
  }

  typeName(typeId?: number | null): string {
    return this.assetTypes().find((assetType) => assetType.id === typeId)?.name || '';
  }

  typeSeverity(typeId?: number | null): TagSeverity {
    return assetTypeVisual(this.assetTypes(), typeId).severity;
  }

  locationName(locationId?: number | null): string {
    return this.locations().find((location) => location.id === locationId)?.name || '';
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
