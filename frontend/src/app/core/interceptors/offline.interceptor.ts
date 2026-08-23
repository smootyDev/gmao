import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, of, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

import { OfflineStorageService } from '../services/offline-storage.service';
import { ConnectivityService } from '../services/connectivity.service';
import { OutboxOperation } from '../models/sync';

const ENTITY_BY_URL: { prefix: string; entity: string }[] = [
  { prefix: '/api/workorders', entity: 'workorders' },
  { prefix: '/api/assets', entity: 'assets' },
  { prefix: '/api/asset-types', entity: 'asset-types' },
  { prefix: '/api/locations', entity: 'locations' },
  { prefix: '/api/users', entity: 'users' },
  { prefix: '/api/inventory-items', entity: 'inventory-items' },
  { prefix: '/api/preventive-plans', entity: 'preventive-plans' }
];

function entityFor(url: string): string | null {
  const match = ENTITY_BY_URL.find((entry) => url.startsWith(entry.prefix));
  return match ? match.entity : null;
}

function generateClientId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }
  if (error instanceof Error && error.message && /failed to fetch|network error|load failed/i.test(error.message)) {
    return true;
  }
  const status = (error as { status?: number })?.status;
  return status === 0 || status === undefined || status === 502 || status === 504;
}

export const offlineInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(OfflineStorageService);
  const connectivity = inject(ConnectivityService);
  const entity = entityFor(req.url);

  return next(req).pipe(
    tap({
      next: (event) => {
        if (entity !== null && event instanceof HttpResponse && event.headers.get('X-GMAO-Backend') === 'true') {
          connectivity.markOnline();
        }
      }
    }),
    catchError((error) => {
      if (!isNetworkError(error)) {
        return throwError(() => error);
      }
      connectivity.markOffline();
      if (entity === null) {
        return throwError(() => error);
      }
      return handleOffline(req.method, req.url, req.body, entity, storage, error);
    })
  );
};

function handleOffline(
  method: string,
  url: string,
  body: unknown,
  entity: string,
  storage: OfflineStorageService,
  error: unknown
) {
  if (method === 'GET') {
    return from(storage.getCache<unknown>(entity)).pipe(
      switchMap((items) =>
        items !== null
          ? of(new HttpResponse({ status: 200, statusText: 'OK', body: items }))
          : throwError(() => error)
      )
    );
  }
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
    if (url.endsWith('/run')) {
      return throwError(() => error);
    }
    return enqueueAndEmit(method, url, body, entity, storage, error);
  }
  return throwError(() => error);
}

function enqueueAndEmit(
  method: string,
  url: string,
  body: unknown,
  entity: string,
  storage: OfflineStorageService,
  error: unknown
) {
  const clientId = generateClientId();
  const segments = url.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const idFromUrl = lastSegment !== undefined && !isNaN(Number(lastSegment)) ? lastSegment : undefined;

  const operation: OutboxOperation = {
    id: generateClientId(),
    clientId,
    entity,
    action: method === 'POST' ? 'create' : method === 'PUT' ? 'update' : 'delete',
    url,
    method,
    body: method === 'DELETE' ? undefined : (body as Record<string, unknown>),
    resolvedId: method === 'POST' ? undefined : idFromUrl,
    createdAt: Date.now()
  };

  const optimisticBody = method === 'POST' && body && typeof body === 'object'
    ? { ...(body as Record<string, unknown>), clientId }
    : body;

  return from(storage.enqueue(operation)).pipe(
    switchMap(() => {
      if (method === 'DELETE') {
        return of(new HttpResponse({ status: 204, statusText: 'No Content' }));
      }
      return of(new HttpResponse({ status: 200, statusText: 'OK', body: optimisticBody }));
    }),
    catchError(() => throwError(() => error))
  );
}
