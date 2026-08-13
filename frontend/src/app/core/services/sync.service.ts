import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Subject } from 'rxjs';

import { OfflineStorageService } from './offline-storage.service';
import { ConnectivityService } from './connectivity.service';
import { OutboxOperation, SYNC_ENTITIES } from '../models/sync';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly pendingSignal = signal<number>(0);
  private readonly syncingSignal = signal<boolean>(false);

  isOnline = computed(() => this.connectivity.online());
  connectionVerified = computed(() => this.connectivity.verified());
  hasPending = computed(() => this.pendingSignal() > 0);
  isSyncing = computed(() => this.syncingSignal());
  pendingCount = computed(() => this.pendingSignal());

  readonly syncCompleted = new Subject<void>();

  constructor(
    private readonly connectivity: ConnectivityService,
    private readonly http: HttpClient,
    private readonly storage: OfflineStorageService
  ) {
    this.storage.outboxChanged.subscribe(() => {
      void this.refreshPendingCount();
    });
    void this.refreshPendingCount();
    void this.refreshCacheFromServer();
  }

  async refreshPendingCount(): Promise<void> {
    const outbox = await this.storage.getOutbox();
    this.pendingSignal.set(outbox.length);
  }

  async countPending(): Promise<number> {
    const outbox = await this.storage.getOutbox();
    return outbox.length;
  }

  async sync(): Promise<void> {
    if (!this.isOnline() || this.syncingSignal()) {
      return;
    }
    this.syncingSignal.set(true);
    try {
      const outbox = await this.storage.getOutbox();
      const idMap = new Map<string, string>();

      for (const entity of SYNC_ENTITIES) {
        const ops = outbox.filter((op) => op.entity === entity);
        await this.processOperations(entity, ops, idMap);
      }

      await this.storage.clearOutbox();
      await this.refreshAllCaches();
    } finally {
      await this.refreshPendingCount();
      this.syncingSignal.set(false);
    }
    this.syncCompleted.next();
  }

  private async processOperations(
    entity: string,
    ops: OutboxOperation[],
    idMap: Map<string, string>
  ): Promise<void> {
    for (const op of ops) {
      try {
        if (op.action === 'create') {
          const response = await firstValueFrom(this.http.post<{ id?: number; clientId?: string }>(op.url, op.body ?? {}));
          const realId = response?.id;
          const clientId = response?.clientId ?? op.clientId;
          if (realId !== undefined && clientId) {
            idMap.set(clientId, realId.toString());
          }
        } else {
          const url = this.withResolvedId(op, idMap);
          if (url === null) {
            await this.storage.removeFromOutbox(op.id);
            continue;
          }
          if (op.action === 'update') {
            await firstValueFrom(this.http.put<unknown>(url, op.body ?? {}));
          } else {
            await firstValueFrom(this.http.delete<void>(url));
          }
        }
        await this.storage.removeFromOutbox(op.id);
      } catch (error) {
        if (op.action === 'delete') {
          await this.storage.removeFromOutbox(op.id);
        }
      }
    }
    void entity;
  }

  private withResolvedId(op: OutboxOperation, idMap: Map<string, string>): string | null {
    const resolved = op.resolvedId;
    if (!resolved) {
      return null;
    }
    const id = idMap.get(resolved) ?? resolved;
    const base = op.url.split('/').slice(0, -1).join('/');
    return `${base}/${id}`;
  }

  async refreshAllCaches(): Promise<void> {
    for (const entity of SYNC_ENTITIES) {
      try {
        const items = await firstValueFrom(this.http.get<unknown[]>(`/api/${entity}`));
        await this.storage.setCache(entity, items ?? []);
      } catch {
        void entity;
      }
    }
  }

  private async refreshCacheFromServer(): Promise<void> {
    if (!this.isOnline()) {
      return;
    }
    try {
      await this.refreshAllCaches();
    } catch {
      void 0;
    }
  }

  updateOnline(online: boolean): void {
    if (online) {
      this.connectivity.markOnline();
    } else {
      this.connectivity.markOffline();
    }
  }
}
