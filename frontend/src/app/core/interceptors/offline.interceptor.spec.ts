import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { offlineInterceptor } from './offline.interceptor';
import { OfflineStorageService } from '../services/offline-storage.service';
import { ConnectivityService } from '../services/connectivity.service';

describe('offlineInterceptor', () => {
  let storage: OfflineStorageService;
  let connectivity: ConnectivityService;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [OfflineStorageService, ConnectivityService] });
    storage = TestBed.inject(OfflineStorageService);
    connectivity = TestBed.inject(ConnectivityService);
    await storage.clear();
  });

  afterEach(async () => {
    await storage.clear();
  });

  function callInterceptor(
    req: HttpRequest<unknown>,
    next: (r: HttpRequest<unknown>) => Observable<HttpResponse<unknown>>
  ) {
    return TestBed.runInInjectionContext(() =>
      offlineInterceptor(req, next).toPromise()
    ) as Promise<HttpResponse<unknown> | undefined>;
  }

  it('should pass through successful requests untouched', async () => {
    const req = new HttpRequest('GET', '/api/workorders');
    const result = await callInterceptor(req, () => of(new HttpResponse({ status: 200, body: [] })));
    expect(result!.status).toBe(200);
  });

  it('should serve GET from cache on network error', async () => {
    await storage.setCache('workorders', [{ id: 1, title: 'WO' }]);
    const req = new HttpRequest('GET', '/api/workorders');
    const networkError = new TypeError('Failed to fetch');

    const result = await callInterceptor(req, () => throwError(() => networkError));

    expect(result!.status).toBe(200);
    expect(result!.body).toEqual([{ id: 1, title: 'WO' }]);
  });

  it('should enqueue POST operations and return an optimistic response on network error', async () => {
    const req = new HttpRequest('POST', '/api/workorders', { title: 'WO' });
    const networkError = new TypeError('Failed to fetch');

    const result = await callInterceptor(req, () => throwError(() => networkError));

    expect(result!.status).toBe(200);
    expect((result!.body as { clientId?: string }).clientId).toBeDefined();
    const outbox = await storage.getOutbox();
    expect(outbox).toHaveLength(1);
    expect(outbox[0].action).toBe('create');
    expect(outbox[0].entity).toBe('workorders');
  });

  it('should enqueue DELETE operations and return 204 on network error', async () => {
    const req = new HttpRequest('DELETE', '/api/workorders/1');
    const networkError = new TypeError('Failed to fetch');

    const result = await callInterceptor(req, () => throwError(() => networkError));

    expect(result!.status).toBe(204);
    const outbox = await storage.getOutbox();
    expect(outbox).toHaveLength(1);
    expect(outbox[0].action).toBe('delete');
    expect(outbox[0].resolvedId).toBe('1');
  });

  it('should rethrow errors for non-matching urls', async () => {
    const req = new HttpRequest('GET', '/api/auth/login');
    const networkError = new TypeError('Failed to fetch');

    await expect(callInterceptor(req, () => throwError(() => networkError))).rejects.toBeDefined();
  });

  it('should rethrow non-network errors without caching', async () => {
    await storage.setCache('workorders', [{ id: 1, title: 'WO' }]);
    const req = new HttpRequest('GET', '/api/workorders');
    const serverError = new HttpErrorResponse({ status: 500 });

    await expect(callInterceptor(req, () => throwError(() => serverError))).rejects.toBeDefined();
  });

  it('should treat gateway timeouts as a network error and serve from cache', async () => {
    await storage.setCache('workorders', [{ id: 1, title: 'WO' }]);
    connectivity.markOnline();
    const req = new HttpRequest('GET', '/api/workorders');
    const gatewayError = new HttpErrorResponse({ status: 504 });

    const result = await callInterceptor(req, () => throwError(() => gatewayError));

    expect(result!.status).toBe(200);
    expect(result!.body).toEqual([{ id: 1, title: 'WO' }]);
    expect(connectivity.online()).toBe(false);
  });

  it('should mark the app offline when a network error occurs', async () => {
    connectivity.markOnline();
    const req = new HttpRequest('GET', '/api/workorders');
    const networkError = new TypeError('Failed to fetch');

    await expect(callInterceptor(req, () => throwError(() => networkError))).rejects.toBeDefined();

    expect(connectivity.online()).toBe(false);
  });

  it('should mark the app online when a real response succeeds', async () => {
    connectivity.markOffline();
    const req = new HttpRequest('GET', '/api/workorders');

    await callInterceptor(req, () => of(new HttpResponse({ status: 200, body: [] })));

    expect(connectivity.online()).toBe(true);
  });
});
