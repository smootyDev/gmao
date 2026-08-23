import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (token && req.url.startsWith('/api')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && req.url.startsWith('/api')) {
        const status = error.status;
        const isAuthEndpoint = req.url.startsWith('/api/auth');
        if (status === 401 && !isAuthEndpoint) {
          authService.logout();
        }
      }
      return throwError(() => error);
    })
  );
};
