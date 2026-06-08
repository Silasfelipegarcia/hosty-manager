import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const platformAdminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const sessionOk = await auth.ensureValidSession();
  if (!sessionOk) {
    return router.createUrlTree(['/login']);
  }
  if (!auth.isPlatformAdmin()) {
    return router.createUrlTree(['/dashboard']);
  }
  return true;
};
