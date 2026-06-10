import { Component, ChangeDetectorRef, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { HttpErrorResponse } from '@angular/common/http';

// ── Animaciones ────────────────────────────────────────────────────────────

export const fadeSlideInLeft = trigger('fadeSlideInLeft', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-30px)' }),
    animate('500ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateX(0)' }))
  ])
]);

export const fadeSlideInLeftSlow = trigger('fadeSlideInLeftSlow', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-40px)' }),
    animate('600ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateX(0)' }))
  ])
]);

export const staggerItems = trigger('staggerItems', [
  transition(':enter', [
    query('.login-feature-item', [
      style({ opacity: 0, transform: 'translateX(-20px)' }),
      stagger(100, [
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ], { optional: true })
  ])
]);

export const fadeSlideInUp = trigger('fadeSlideInUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate('500ms 400ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

export const stepTransition = trigger('stepTransition', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(32px)' }),
    animate('360ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateX(0)' }))
  ]),
  transition(':leave', [
    animate('200ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 0, transform: 'translateX(-32px)' }))
  ])
]);

// ── Componente ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  animations: [fadeSlideInLeft, fadeSlideInLeftSlow, staggerItems, fadeSlideInUp, stepTransition]
})
export class LoginComponent implements OnDestroy {

  paso = 1;

  loginForm:  FormGroup;
  codigoForm: FormGroup;

  showPassword   = false;
  loading        = false;
  errorMessage   = '';

  tiempoRestante = 0;
  private intervalo: any     = null;
  private fechaExpiracion: Date | null = null; // ← para calcular tiempo real

  constructor(
    private fb:          FormBuilder,
    private router:      Router,
    private authService: AuthService,
    private cdr:         ChangeDetectorRef,  // ← fix UI lenta
    private ngZone:      NgZone              // ← fix countdown pestañas
  ) {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      remember: [false]
    });

    this.codigoForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
    });
  }

  // ── Paso 1: enviar credenciales ────────────────────────────────────────

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading      = true;
    this.errorMessage = '';

    this.authService.login({
      correo:     this.loginForm.value.email,
      contrasena: this.loginForm.value.password
    }).subscribe({
      next: () => this.ngZone.run(() => {
        this.loading = false;
        this.paso    = 2;
        this.iniciarCountdown();
        this.cdr.detectChanges();
      }),
      error: (err: HttpErrorResponse) => this.ngZone.run(() => {
        this.loading      = false;
        this.errorMessage = err.status === 401
          ? 'Correo o contraseña incorrectos.'
          : 'Ocurrió un error. Intenta de nuevo.';
        this.cdr.detectChanges();
      })
    });
  }

  // ── Paso 2: verificar código ───────────────────────────────────────────

  verificarCodigo(): void {
    if (this.codigoForm.invalid) {
      this.codigoForm.markAllAsTouched();
      return;
    }

    if (this.tiempoRestante === 0) {
      this.errorMessage = 'El código ha expirado. Solicita uno nuevo.';
      return;
    }

    this.loading      = true;
    this.errorMessage = '';

    this.authService.verificar({
      correo: this.loginForm.value.email,
      codigo: this.codigoForm.value.codigo
    }).subscribe({
      next: (res) => this.ngZone.run(() => {
        this.loading = false;
        this.limpiarIntervalo();
        this.authService.guardarToken(res.token);
        this.cdr.detectChanges();

        const rol = this.authService.getRol();
        if (rol === 2 || rol === 3) {
          this.router.navigate(['/inicia']);
        } else {
          this.router.navigate(['/inicio']);
        }
      }),
      error: (err: HttpErrorResponse) => this.ngZone.run(() => {
        this.loading      = false;
        this.errorMessage = err.error?.message ?? 'Código incorrecto o expirado.';
        this.cdr.detectChanges();
      })
    });
  }

  // ── Reenviar código ────────────────────────────────────────────────────

  reenviarCodigo(): void {
    this.codigoForm.reset();
    this.errorMessage = '';
    this.loading      = true;

    this.authService.reenviar(this.loginForm.value.email).subscribe({
      next: () => this.ngZone.run(() => {
        this.loading = false;
        this.iniciarCountdown();
        this.cdr.detectChanges();
      }),
      error: () => this.ngZone.run(() => {
        this.loading      = false;
        this.errorMessage = 'No se pudo reenviar el código. Intenta de nuevo.';
        this.cdr.detectChanges();
      })
    });
  }

  // ── Volver al paso 1 ───────────────────────────────────────────────────

  volverPaso1(): void {
    this.paso         = 1;
    this.errorMessage = '';
    this.codigoForm.reset();
    this.limpiarIntervalo();
    this.tiempoRestante  = 0;
    this.fechaExpiracion = null;
    this.cdr.detectChanges();
  }

  // ── Countdown — usa Date para que funcione entre pestañas ──────────────

  iniciarCountdown(): void {
    this.limpiarIntervalo();
    // Guarda la fecha exacta de expiración (5 minutos desde ahora)
    this.fechaExpiracion = new Date(Date.now() + 5 * 60 * 1000);
    this.tiempoRestante  = 300;

    // Corre fuera de NgZone para no bloquear CD, pero entra al actualizar
    this.ngZone.runOutsideAngular(() => {
      this.intervalo = setInterval(() => {
        const ahora    = Date.now();
        const restante = Math.max(0, Math.round((this.fechaExpiracion!.getTime() - ahora) / 1000));

        this.ngZone.run(() => {
          this.tiempoRestante = restante;
          if (restante === 0) {
            this.limpiarIntervalo();
          }
          this.cdr.detectChanges();
        });
      }, 500); // cada 500ms para mayor precisión
    });
  }

  formatTiempo(segundos: number): string {
    const m = Math.floor(segundos / 60).toString().padStart(2, '0');
    const s = (segundos % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  private limpiarIntervalo(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
    }
  }

  // ── Helpers UI ────────────────────────────────────────────────────────

  togglePassword(): void { this.showPassword = !this.showPassword; }

  onFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.style.borderColor = '#2366CE';
    input.style.boxShadow   = '0 0 0 3px rgba(35, 102, 206, 0.15)';
  }

  onBlur(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.style.borderColor = '';
    input.style.boxShadow   = '';
  }

  loginWithGoogle():   void { console.log('Login con Google');   }
  loginWithFacebook(): void { console.log('Login con Facebook'); }

  ngOnDestroy(): void { this.limpiarIntervalo(); }
}