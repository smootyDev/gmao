import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { TreeNode, TreeDragDropService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TreeModule } from 'primeng/tree';
import { TreeNodeDropEvent } from 'primeng/types/tree';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { Asset, AssetService } from '../../assets/services/asset.service';
import { AssetType, AssetTypeService } from '../../asset-types/services/asset-type.service';
import { Location, LocationService } from '../services/location.service';
import { SyncService } from '../../../core/services/sync.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { assetTypeVisual, AssetTypeVisual } from '../../../core/utils/asset-type-visual';

type LocationTreeData =
  | { kind: 'location'; value: Location }
  | { kind: 'asset'; value: Asset };

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule, TagModule, TreeModule, TranslatePipe],
  providers: [TreeDragDropService],
  templateUrl: './location-list.component.html',
  styleUrl: './location-list.component.scss'
})
export class LocationListComponent implements OnInit, OnDestroy {
  readonly permissions = inject(PermissionsService);
  locations = signal<Location[]>([]);
  treeNodes = signal<TreeNode<LocationTreeData>[]>([]);
  selectedNode = signal<TreeNode<LocationTreeData> | null>(null);
  loading = signal(true);
  moving = signal(false);
  assetTypes = signal<AssetType[]>([]);

  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly locationService: LocationService,
    private readonly assetService: AssetService,
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
        this.assetTypes.set(assetTypes);
        this.treeNodes.set(this.toTree(locations, assets));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  selectNode(node: TreeNode<LocationTreeData> | TreeNode<LocationTreeData>[] | null | undefined): void {
    this.selectedNode.set(Array.isArray(node) ? node[0] || null : node || null);
  }

  isLocationNode(node: TreeNode<LocationTreeData> | null): boolean {
    return node?.data?.kind === 'location';
  }

  isAssetNode(node: TreeNode<LocationTreeData> | null): boolean {
    return node?.data?.kind === 'asset';
  }

  locationFrom(node: TreeNode<LocationTreeData>): Location | null {
    return node.data?.kind === 'location' ? node.data.value : null;
  }

  assetFrom(node: TreeNode<LocationTreeData>): Asset | null {
    return node.data?.kind === 'asset' ? node.data.value : null;
  }

  assetTypeName(typeId?: number | null): string {
    return this.assetTypes().find((assetType) => assetType.id === typeId)?.name || '';
  }

  assetVisual(typeId?: number | null): AssetTypeVisual {
    return assetTypeVisual(this.assetTypes(), typeId);
  }

  setAllExpanded(expanded: boolean): void {
    const clone = (nodes: TreeNode<LocationTreeData>[]): TreeNode<LocationTreeData>[] =>
      nodes.map((node) => ({
        ...node,
        expanded,
        children: node.children?.length ? clone(node.children) : node.children
      }));
    this.treeNodes.set(clone(this.treeNodes()));
  }

  delete(id: number): void {
    if (confirm('¿Eliminar esta localización?')) {
      this.locationService.delete(id).subscribe({
        next: () => this.loadData(),
        error: () => alert('No se puede eliminar una localización en uso')
      });
    }
  }

  onNodeDrop(event: TreeNodeDropEvent): void {
    if (!this.permissions.canManageLocations()) {
      this.loadData();
      return;
    }
    const draggedLocation = this.locationFrom(event.dragNode!);
    const draggedAsset = this.assetFrom(event.dragNode!);
    const parentId = this.findParentId(this.treeNodes(), event.dragNode!);

    if (parentId === undefined) {
      this.loadData();
      return;
    }

    if (draggedLocation) {
      if (draggedLocation.parentId === parentId) {
        return;
      }
      this.moving.set(true);
      this.locationService.update(draggedLocation.id!, { ...draggedLocation, parentId }).subscribe({
        next: () => {
          this.moving.set(false);
          this.loadData();
        },
        error: () => this.moveFailed()
      });
      return;
    }

    if (draggedAsset && draggedAsset.locationId !== parentId) {
      this.moving.set(true);
      this.assetService.update(draggedAsset.id!, { ...draggedAsset, locationId: parentId }).subscribe({
        next: () => {
          this.moving.set(false);
          this.loadData();
        },
        error: () => this.moveFailed()
      });
    }
  }

  private moveFailed(): void {
    this.moving.set(false);
    this.loadData();
    alert('No se pudo mover el elemento');
  }

  private toTree(locations: Location[], assets: Asset[]): TreeNode<LocationTreeData>[] {
    const nodes = new Map<number, TreeNode<LocationTreeData>>();
    const roots: TreeNode<LocationTreeData>[] = [];

    for (const location of locations) {
      if (location.id === undefined) {
        continue;
      }
      nodes.set(location.id, {
        key: `location-${location.id}`,
        // label: `${location.id} ${location.code} ${location.name}`,
        label: `${location.id} ${location.code} ${location.name}`,
        data: { kind: 'location', value: location },
        children: [],
        //expanded: location.parentId == null,
        expanded: true,
        draggable: !location.systemRoot,
        droppable: true
      });
    }

    for (const node of nodes.values()) {
      const location = this.locationFrom(node)!;
      const parent = location.parentId == null ? undefined : nodes.get(location.parentId);
      if (parent && parent !== node) {
        parent.children!.push(node);
      } else {
        roots.push(node);
      }
    }

    for (const asset of assets) {
      const assetNode: TreeNode<LocationTreeData> = {
        key: `asset-${asset.id}`,
        label: `${asset.id} ${asset.name} ${asset.serialNumber || ''}`,
        data: { kind: 'asset', value: asset },
        leaf: true,
        draggable: true,
        droppable: false
      };
      const parent = asset.locationId == null ? undefined : nodes.get(asset.locationId);
      if (parent) {
        parent.children!.push(assetNode);
      } else {
        roots.push(assetNode);
      }
    }

    const sort = (items: TreeNode<LocationTreeData>[]) => {
      items.sort((a, b) => {
        const rank = (node: TreeNode<LocationTreeData>): number => {
          if (node.data?.kind === 'asset') {
            return 2;
          }
          return node.data?.value.systemRoot ? 0 : 1;
        };
        const rankDifference = rank(a) - rank(b);
        return rankDifference || (a.data?.value.name || '').localeCompare(b.data?.value.name || '');
      });
      items.forEach((item) => sort(item.children || []));
    };
    sort(roots);
    return roots;
  }

  private findParentId(
    nodes: TreeNode<LocationTreeData>[],
    target: TreeNode<LocationTreeData>,
    parentId: number | null = null
  ): number | null | undefined {
    for (const node of nodes) {
      if (node === target) {
        return parentId;
      }
      const found = this.findParentId(node.children || [], target, this.locationFrom(node)?.id ?? parentId);
      if (found !== undefined) {
        return found;
      }
    }
    return undefined;
  }
}
