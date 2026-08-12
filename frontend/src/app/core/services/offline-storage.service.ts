import { Injectable } from '@angular/core';
import localforage from 'localforage';
import { Subject } from 'rxjs';
import { SyncMeta } from '../models/sync';
import { OutboxOperation } from '../models/sync';

const CACHE_PREFIX = 'cache:';
const OUTBOX_KEY = 'outbox';
const META_KEY = 'sync:meta';

@Injectable({ providedIn: 'root' })
export class OfflineStorageService {
  readonly outboxChanged = new Subject<void>();

  constructor() {
    localforage.config({
      name: 'gmao-offline',
      storeName: 'gmao_data',
      description: 'Caché offline y cola de sincronización GMAO'
    });
  }

  private cacheKey(entity: string): string {
    return `${CACHE_PREFIX}${entity}:all`;
  }

  async getCache<T>(entity: string): Promise<T[] | null> {
    return (await localforage.getItem<T[]>(this.cacheKey(entity))) ?? null;
  }

  async setCache<T>(entity: string, items: T[]): Promise<void> {
    await localforage.setItem(this.cacheKey(entity), items);
  }

  async getSingleCache<T>(entity: string, id: string | number): Promise<T | null> {
    const key = `${CACHE_PREFIX}${entity}:${id}`;
    return (await localforage.getItem<T>(key)) ?? null;
  }

  async setSingleCache<T>(entity: string, id: string | number, item: T): Promise<void> {
    const key = `${CACHE_PREFIX}${entity}:${id}`;
    await localforage.setItem(key, item);
    await this.mergeIntoCollectionCache(entity, item);
  }

  async removeSingleCache<T>(entity: string, id: string | number): Promise<void> {
    const key = `${CACHE_PREFIX}${entity}:${id}`;
    await localforage.removeItem(key);
    const all = (await this.getCache<T>(entity)) ?? [];
    await this.setCache(
      entity,
      all.filter((item) => (item as { id?: number | string }).id !== id)
    );
  }

  private async mergeIntoCollectionCache<T>(entity: string, item: T): Promise<void> {
    const all = (await this.getCache<T>(entity)) ?? [];
    const id = (item as { id?: number | string }).id;
    const index = all.findIndex((existing) => (existing as { id?: number | string }).id === id);
    if (index >= 0) {
      all[index] = item;
    } else {
      all.push(item);
    }
    await this.setCache(entity, all);
  }

  async getOutbox(): Promise<OutboxOperation[]> {
    return (await localforage.getItem<OutboxOperation[]>(OUTBOX_KEY)) ?? [];
  }

  async enqueue(operation: OutboxOperation): Promise<void> {
    const outbox = await this.getOutbox();
    const key = `${operation.entity}:${operation.clientId}`;
    const existingIndex = outbox.findIndex(
      (op) => `${op.entity}:${op.clientId}` === key
    );
    if (existingIndex >= 0) {
      outbox[existingIndex] = operation;
    } else {
      outbox.push(operation);
    }
    await localforage.setItem(OUTBOX_KEY, outbox);
    this.outboxChanged.next();
  }

  async removeFromOutbox(id: string): Promise<void> {
    const outbox = await this.getOutbox();
    await localforage.setItem(
      OUTBOX_KEY,
      outbox.filter((op) => op.id !== id)
    );
    this.outboxChanged.next();
  }

  async clearOutbox(): Promise<void> {
    await localforage.removeItem(OUTBOX_KEY);
    this.outboxChanged.next();
  }

  async getMeta(): Promise<SyncMeta | null> {
    return (await localforage.getItem<SyncMeta>(META_KEY)) ?? null;
  }

  async setMeta(meta: SyncMeta): Promise<void> {
    await localforage.setItem(META_KEY, meta);
  }

  async clear(): Promise<void> {
    await localforage.clear();
  }
}
