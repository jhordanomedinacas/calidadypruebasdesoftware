import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.estaAutenticado()) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const rol    = auth.getRol();

  if (rol === 2 || rol === 3) return true;

  router.navigate(['/inicio']);
  return false;
};

export const userGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const rol    = auth.getRol();

  if (rol === 1) return true;

  router.navigate(['/inicia']);
  return false;
};