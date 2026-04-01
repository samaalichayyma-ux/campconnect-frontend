import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  return authService.fetchCurrentUser().pipe(
    map(() => authService.canAccessAdminPanel()
      ? true
      : router.createUrlTree(['/public'])),
    catchError((error) => {
      if (error?.status === 401 || error?.status === 403) {
        authService.logout();
        return of(router.createUrlTree(['/login']));
      }

      return of(authService.canAccessAdminPanel()
        ? true
        : router.createUrlTree(['/public']));
    })
  );
};
