export interface OutboxOperation<T = Record<string, unknown>> {
  id: string;
  clientId: string;
  entity: string;
  action: 'create' | 'update' | 'delete';
  url: string;
  method: string;
  body?: T;
  resolvedId?: string;
  createdAt: number;
}

export interface OutboxGroup {
  entity: string;
  clientId: string;
  operation: OutboxOperation;
}

export interface SyncMeta {
  lastSyncAt: number | null;
  entities: string[];
}

export const SYNC_ENTITIES = ['workorders', 'assets', 'asset-types', 'locations', 'users', 'inventory-items'] as const;

export type SyncEntity = (typeof SYNC_ENTITIES)[number];
