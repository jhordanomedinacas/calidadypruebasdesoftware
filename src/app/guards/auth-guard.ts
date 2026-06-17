import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { RecargaService } from '../services/recarga';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

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

// ── Guard de recargas: bloquea si el usuario no tiene tarjetas ──
// Si no tiene tarjetas → redirige a /inicio con ?sinTarjetas=1
export const recargasGuard: CanActivateFn = () => {
  const recargaSvc = inject(RecargaService);
  const router     = inject(Router);

  return recargaSvc.obtenerTarjetas().pipe(
    map(tarjetas => {
      if (tarjetas.length > 0) return true;
      router.navigate(['/inicio'], { queryParams: { sinTarjetas: '1' } });
      return false;
    }),
    catchError(() => {
      // El SP devuelve error cuando no hay tarjetas → mismo comportamiento
      router.navigate(['/inicio'], { queryParams: { sinTarjetas: '1' } });
      return of(false);
    })
  );
};