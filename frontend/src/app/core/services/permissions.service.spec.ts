import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PermissionsService } from './permissions.service';
import { AuthService } from './auth.service';

describe('PermissionsService', () => {
  function setup(role: string, id = 1): PermissionsService {
    const currentUser = signal({ id, token: 'x', type: 'Bearer', username: 'u', role });
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { currentUser } }]
    });
    return TestBed.inject(PermissionsService);
  }

  it('admin has full access', () => {
    const permissions = setup('ADMIN');
    expect(permissions.isAdmin()).toBe(true);
    expect(permissions.canManageUsers()).toBe(true);
    expect(permissions.canDeleteAsset()).toBe(true);
    expect(permissions.canDeleteAssetType()).toBe(true);
    expect(permissions.canManageInventory()).toBe(true);
    expect(permissions.canManagePreventive()).toBe(true);
  });

  it('manager cannot manage users nor delete assets or asset types', () => {
    const permissions = setup('MANAGER');
    expect(permissions.isManager()).toBe(true);
    expect(permissions.canManageUsers()).toBe(false);
    expect(permissions.canCreateWorkOrder()).toBe(true);
    expect(permissions.canManageAssets()).toBe(true);
    expect(permissions.canDeleteAsset()).toBe(false);
    expect(permissions.canDeleteAssetType()).toBe(false);
    expect(permissions.canManageLocations()).toBe(true);
    expect(permissions.canDeleteLocation()).toBe(false);
  });

  it('tech is read-only and can only act on assigned work orders', () => {
    const permissions = setup('TECH', 7);
    expect(permissions.isTech()).toBe(true);
    expect(permissions.canManageUsers()).toBe(false);
    expect(permissions.canCreateWorkOrder()).toBe(false);
    expect(permissions.canManageAssets()).toBe(false);
    expect(permissions.canManageInventory()).toBe(false);
    expect(permissions.canManagePreventive()).toBe(false);
    expect(permissions.isWorkOrderAssigned(7)).toBe(true);
    expect(permissions.isWorkOrderAssigned(8)).toBe(false);
    expect(permissions.isWorkOrderAssigned(null)).toBe(false);
  });
});