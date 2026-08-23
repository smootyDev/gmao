import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService, LoginResponse } from './auth.service';
import { LoginComponent } from '../../features/auth/components/login.component';

describe('AuthService', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: 'login', component: LoginComponent }])]
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should persist username and role on login so they are available after a reload', () => {
    const service = TestBed.inject(AuthService);
    const response: LoginResponse = { id: 1, token: 'abc123', type: 'Bearer', username: 'jdoe', role: 'ADMIN' };

    service.login({ username: 'jdoe', password: 'secret' }).subscribe();
    httpMock.expectOne('/api/auth/login').flush(response);

    expect(service.currentUser()).toEqual(response);
    expect(localStorage.getItem('gmao_token')).toBe('abc123');
    expect(JSON.parse(localStorage.getItem('gmao_user')!)).toEqual(response);
  });

  it('should restore username and role from storage after a page reload', () => {
    const stored: LoginResponse = { id: 1, token: 'abc123', type: 'Bearer', username: 'jdoe', role: 'ADMIN' };
    localStorage.setItem('gmao_token', stored.token);
    localStorage.setItem('gmao_user', JSON.stringify(stored));

    const service = TestBed.inject(AuthService);

    expect(service.currentUser()).toEqual(stored);
  });

  it('should fall back to an anonymous user when only the token is present', () => {
    localStorage.setItem('gmao_token', 'abc123');

    const service = TestBed.inject(AuthService);

    expect(service.currentUser()).toEqual({ id: 0, token: 'abc123', type: 'Bearer', username: '', role: '' });
  });

  it('should clear both the token and the stored user on logout', () => {
    localStorage.setItem('gmao_token', 'abc123');
    localStorage.setItem('gmao_user', JSON.stringify({ id: 1, token: 'abc123', type: 'Bearer', username: 'jdoe', role: 'ADMIN' }));
    const service = TestBed.inject(AuthService);

    service.logout();

    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('gmao_token')).toBeNull();
    expect(localStorage.getItem('gmao_user')).toBeNull();
  });
});
