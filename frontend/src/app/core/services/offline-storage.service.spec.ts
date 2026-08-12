import { TestBed } from '@angular/core/testing';
import { OfflineStorageService } from './offline-storage.service';
import { OutboxOperation } from '../models/sync';

describe('OfflineStorageService', () => {
  let service: OfflineStorageService;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [OfflineStorageService] });
    service = TestBed.inject(OfflineStorageService);
    await service.clear();
  });

  afterEach(async () => {
    await service.clear();
  });

  it('should store and retrieve a collection cache', async () => {
    await service.setCache('workorders', [{ id: 1, title: 'WO-1' }]);
    const cache = await service.getCache('workorders');
    expect(cache).toEqual([{ id: 1, title: 'WO-1' }]);
  });

  it('should return null for a missing collection cache', async () => {
    expect(await service.getCache('unknown')).toBeNull();
  });

  it('should merge a single item into the collection cache', async () => {
    await service.setCache('workorders', [{ id: 1, title: 'WO-1' }]);
    await service.setSingleCache('workorders', 2, { id: 2, title: 'WO-2' });
    const cache = await service.getCache('workorders');
    expect(cache).toHaveLength(2);
  });

  it('should replace an existing single cache item', async () => {
    await service.setSingleCache('workorders', 1, { id: 1, title: 'old' });
    await service.setSingleCache('workorders', 1, { id: 1, title: 'new' });
    expect(await service.getSingleCache('workorders', 1)).toEqual({ id: 1, title: 'new' });
  });

  it('should remove a single cache item and update the collection', async () => {
    await service.setCache('workorders', [{ id: 1, title: 'WO-1' }, { id: 2, title: 'WO-2' }]);
    await service.removeSingleCache('workorders', 1);
    expect(await service.getSingleCache('workorders', 1)).toBeNull();
    expect(await service.getCache('workorders')).toEqual([{ id: 2, title: 'WO-2' }]);
  });

  it('should coalesce outbox operations by entity and clientId', async () => {
    const op: OutboxOperation = {
      id: 'op-1',
      clientId: 'client-1',
      entity: 'workorders',
      action: 'create',
      url: '/api/workorders',
      method: 'POST',
      body: { title: 'WO-1' },
      createdAt: Date.now()
    };
    const updated: OutboxOperation = { ...op, id: 'op-2', body: { title: 'WO-1-v2' } };
    await service.enqueue(op);
    await service.enqueue(updated);
    const outbox = await service.getOutbox();
    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toEqual(updated);
  });

  it('should remove an operation from the outbox by id', async () => {
    await service.enqueue({
      id: 'op-1',
      clientId: 'client-1',
      entity: 'workorders',
      action: 'create',
      url: '/api/workorders',
      method: 'POST',
      body: {},
      createdAt: Date.now()
    });
    await service.removeFromOutbox('op-1');
    expect(await service.getOutbox()).toEqual([]);
  });

  it('should store and retrieve sync metadata', async () => {
    await service.setMeta({ lastSyncAt: 123456, entities: ['workorders'] });
    expect(await service.getMeta()).toEqual({ lastSyncAt: 123456, entities: ['workorders'] });
  });
});
