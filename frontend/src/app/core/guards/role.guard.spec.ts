import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('roleGuard', () => {
  function setup(role: string | null) {
    const currentUser = role
      ? signal({ id: 1, token: 'x', type: 'Bearer', username: 'u', role })
      : signal(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser } }
      ]
    });
    const router = TestBed.inject(Router);
    const guard = roleGuard(['ADMIN']);
    return { router, guard };
  }

  it('allows navigation for an allowed role', () => {
    const { guard } = setup('ADMIN');
    const result = TestBed.runInInjectionContext(() => guard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('redirects to dashboard for a non-allowed role', () => {
    const { guard, router } = setup('TECH');
    const result = TestBed.runInInjectionContext(() => guard({} as never, {} as never));
    expect(result).toEqual(router.createUrlTree(['/dashboard']));
  });

  it('redirects to dashboard when there is no authenticated user', () => {
    const { guard, router } = setup(null);
    const result = TestBed.runInInjectionContext(() => guard({} as never, {} as never));
    expect(result).toEqual(router.createUrlTree(['/dashboard']));
  });
});