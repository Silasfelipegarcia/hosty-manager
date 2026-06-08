import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { isTokenExpired } from './jwt.utils';
import { TokenStore } from './token.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenStore);
  const auth = inject(AuthService);

  const isAuthRoute =
    req.url.includes('/api/v1/auth/login') ||
    req.url.includes('/api/v1/auth/refresh') ||
    req.url.includes('/api/v1/auth/forgot-password');

  const send = () => {
    let headers = req.headers;
    if (!isAuthRoute && tokens.accessToken) {
      headers = headers.set('Authorization', `Bearer ${tokens.accessToken}`);
    }
    return next(req.clone({ headers })).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status !== 401 || isAuthRoute) {
          return throwError(() => err);
        }
        return from(auth.refresh()).pipe(
          switchMap((ok) => {
            if (!ok || !tokens.accessToken) {
              return throwError(() => err);
            }
            const retry = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${tokens.accessToken}`),
            });
            return next(retry);
          }),
        );
      }),
    );
  };

  if (isAuthRoute) {
    return send();
  }

  const token = tokens.accessToken;
  if (token && isTokenExpired(token)) {
    return from(auth.ensureValidSession()).pipe(
      switchMap((ok) => (ok ? send() : throwError(() => new HttpErrorResponse({ status: 401 })))),
    );
  }

  return send();
};
