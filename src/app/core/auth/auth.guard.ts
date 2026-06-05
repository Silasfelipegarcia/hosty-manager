import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn) {
    return router.createUrlTree(['/login']);
  }
  if (!auth.isOwner()) {
    return router.createUrlTree(['/login'], { queryParams: { error: 'owner_only' } });
  }
  return true;
};

export const landingGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn && auth.isOwner()) {
    return router.createUrlTree(['/dashboard']);
  }
  return true;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn && auth.isOwner()) {
    return router.createUrlTree(['/dashboard']);
  }
  return true;
};
