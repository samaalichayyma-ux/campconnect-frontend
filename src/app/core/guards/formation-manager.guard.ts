import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const formationManagerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  if (authService.canManageFormations()) {
    return true;
  }

  return authService.fetchCurrentUser().pipe(
    map(() => authService.canManageFormations()
      ? true
      : router.createUrlTree(['/public/formations'])),
    catchError(() => of(authService.canManageFormations()
      ? true
      : router.createUrlTree(['/public/formations'])))
  );
};
