import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly auth = inject(AuthService);

  readonly currentUser = this.auth.currentUser;
  readonly role = computed(() => this.auth.currentUser()?.role ?? '');
  readonly userId = computed<number | null>(() => this.auth.currentUser()?.id ?? null);

  readonly isAdmin = computed(() => this.role() === 'ADMIN');
  readonly isManager = computed(() => this.role() === 'MANAGER');
  readonly isTech = computed(() => this.role() === 'TECH');

  readonly canManageUsers = computed(() => this.isAdmin());

  readonly canCreateWorkOrder = computed(() => this.isAdmin() || this.isManager());
  readonly canDeleteWorkOrder = computed(() => this.isAdmin() || this.isManager());

  readonly canManageAssets = computed(() => this.isAdmin() || this.isManager());
  readonly canDeleteAsset = computed(() => this.isAdmin());

  readonly canManageAssetTypes = computed(() => this.isAdmin() || this.isManager());
  readonly canDeleteAssetType = computed(() => this.isAdmin());

  readonly canManageLocations = computed(() => this.isAdmin() || this.isManager());
  readonly canDeleteLocation = computed(() => this.isAdmin());

  readonly canManageInventory = computed(() => this.isAdmin() || this.isManager());
  readonly canManagePreventive = computed(() => this.isAdmin() || this.isManager());

  hasAnyRole(...roles: string[]): boolean {
    return roles.includes(this.role());
  }

  isWorkOrderAssigned(assignedTo: number | null | undefined): boolean {
    const currentId = this.userId();
    return currentId !== null && currentId !== undefined && assignedTo !== null && assignedTo !== undefined
      && currentId === assignedTo;
  }
}