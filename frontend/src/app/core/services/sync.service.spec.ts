import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { SyncService } from './sync.service';
import { OfflineStorageService } from './offline-storage.service';
import { OutboxOperation } from '../models/sync';

describe('SyncService', () => {
  let service: SyncService;
  let storage: OfflineStorageService;
  let http: {
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    http = {
      post: vi.fn().mockReturnValue(of({})),
      put: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of({})),
      get: vi.fn().mockReturnValue(of([]))
    };

    TestBed.configureTestingModule({
      providers: [SyncService, OfflineStorageService, { provide: HttpClient, useValue: http }]
    });

    storage = TestBed.inject(OfflineStorageService);
    await storage.clear();
    service = TestBed.inject(SyncService);
    await service.refreshPendingCount();
  });

  afterEach(async () => {
    await storage.clear();
  });

  it('should report no pending operations when the outbox is empty', async () => {
    expect(service.hasPending()).toBe(false);
    expect(await service.countPending()).toBe(0);
  });

  it('should flush create operations and record the id mapping', async () => {
    await storage.enqueue({
      id: 'op-1',
      clientId: 'client-1',
      entity: 'workorders',
      action: 'create',
      url: '/api/workorders',
      method: 'POST',
      body: { title: 'WO' },
      createdAt: Date.now()
    });
    http.post.mockReturnValue(of({ id: 42, clientId: 'client-1' }));

    await service.sync();

    expect(http.post).toHaveBeenCalledWith('/api/workorders', { title: 'WO' });
    expect(await storage.getOutbox()).toEqual([]);
    expect(await service.countPending()).toBe(0);
  });

  it('should resolve update urls through the id map for chained operations', async () => {
    await storage.enqueue({
      id: 'op-1',
      clientId: 'client-1',
      entity: 'workorders',
      action: 'create',
      url: '/api/workorders',
      method: 'POST',
      body: { title: 'WO' },
      createdAt: Date.now()
    });
    await storage.enqueue({
      id: 'op-2',
      clientId: 'client-2',
      entity: 'workorders',
      action: 'update',
      url: '/api/workorders/0',
      method: 'PUT',
      body: { title: 'WO v2' },
      resolvedId: 'client-1',
      createdAt: Date.now() + 1
    });
    http.post.mockReturnValue(of({ id: 42, clientId: 'client-1' }));

    await service.sync();

    expect(http.put).toHaveBeenCalledWith('/api/workorders/42', { title: 'WO v2' });
    expect(await storage.getOutbox()).toEqual([]);
  });

  it('should drop update operations without a resolvable id', async () => {
    await storage.enqueue({
      id: 'op-1',
      clientId: 'client-1',
      entity: 'workorders',
      action: 'update',
      url: '/api/workorders/0',
      method: 'PUT',
      body: { title: 'WO' },
      createdAt: Date.now()
    });

    await service.sync();

    expect(http.put).not.toHaveBeenCalled();
    expect(await storage.getOutbox()).toEqual([]);
  });

  it('should drop failed deletes instead of retrying them forever', async () => {
    await storage.enqueue({
      id: 'op-1',
      clientId: 'client-1',
      entity: 'workorders',
      action: 'delete',
      url: '/api/workorders/99',
      method: 'DELETE',
      resolvedId: '99',
      createdAt: Date.now()
    });
    http.delete.mockImplementation(() => {
      throw new Error('boom');
    });

    await service.sync();

    expect(await storage.getOutbox()).toEqual([]);
  });

  it('should refresh all entity caches from the server', async () => {
    http.get.mockClear();
    http.get.mockImplementation((url: string) => {
      if (url === '/api/workorders') {
        return of([{ id: 1, title: 'WO' }]);
      }
      return of([]);
    });

    await service.refreshAllCaches();

    expect(await storage.getCache('workorders')).toEqual([{ id: 1, title: 'WO' }]);
    expect(http.get).toHaveBeenCalledWith('/api/workorders');
  });

  it('should expose online state', () => {
    expect(typeof service.isOnline()).toBe('boolean');
    service.updateOnline(false);
    expect(service.isOnline()).toBe(false);
    service.updateOnline(true);
    expect(service.isOnline()).toBe(true);
  });
});
