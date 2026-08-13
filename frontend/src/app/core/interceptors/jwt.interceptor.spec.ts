import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpResponse, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { jwtInterceptor } from './jwt.interceptor';
import { AuthService } from '../services/auth.service';
import { LoginComponent } from '../../features/auth/components/login.component';

describe('jwtInterceptor', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideRouter([{ path: 'login', component: LoginComponent }])
      ]
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => localStorage.clear());

  function callInterceptor(
    req: HttpRequest<unknown>,
    next: (r: HttpRequest<unknown>) => Observable<HttpResponse<unknown>>
  ) {
    return TestBed.runInInjectionContext(() =>
      jwtInterceptor(req, next).toPromise()
    ) as Promise<HttpResponse<unknown> | undefined>;
  }

  it('should attach the bearer token to api requests', async () => {
    localStorage.setItem('gmao_token', 'abc123');
    const captured: HttpRequest<unknown>[] = [];
    const req = new HttpRequest<unknown>('GET', '/api/workorders');

    await callInterceptor(req, (r: HttpRequest<unknown>) => {
      captured.push(r);
      return of(new HttpResponse({ status: 200, body: [] }));
    });

    expect(captured[0]?.headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('should not attach the token to non-api requests', async () => {
    localStorage.setItem('gmao_token', 'abc123');
    const captured: HttpRequest<unknown>[] = [];
    const req = new HttpRequest<unknown>('GET', '/assets/i18n/es.json');

    await callInterceptor(req, (r: HttpRequest<unknown>) => {
      captured.push(r);
      return of(new HttpResponse({ status: 200, body: {} }));
    });

    expect(captured[0]?.headers.get('Authorization')).toBeNull();
  });

  it('should logout and redirect to login on a 403 from an api endpoint', async () => {
    localStorage.setItem('gmao_token', 'expired');
    const navigateSpy = vi.spyOn(router, 'navigate');
    const req = new HttpRequest<unknown>('GET', '/api/workorders');
    const error = new HttpErrorResponse({ status: 403 });

    await expect(
      callInterceptor(req, () => throwError(() => error))
    ).rejects.toBeDefined();

    expect(localStorage.getItem('gmao_token')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect on a 401 from an api endpoint', async () => {
    localStorage.setItem('gmao_token', 'expired');
    const navigateSpy = vi.spyOn(router, 'navigate');
    const req = new HttpRequest<unknown>('GET', '/api/workorders');
    const error = new HttpErrorResponse({ status: 401 });

    await expect(
      callInterceptor(req, () => throwError(() => error))
    ).rejects.toBeDefined();

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should not logout on errors from the auth endpoints', async () => {
    localStorage.setItem('gmao_token', 'abc');
    const req = new HttpRequest<unknown>('POST', '/api/auth/login', {});
    const error = new HttpErrorResponse({ status: 401 });

    await expect(
      callInterceptor(req, () => throwError(() => error))
    ).rejects.toBeDefined();

    expect(localStorage.getItem('gmao_token')).toBe('abc');
  });
});



