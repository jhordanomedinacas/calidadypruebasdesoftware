import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { AuthService } from '../../services/auth';

// Panel izquierdo completo (entrada lenta con parallax)
export const fadeSlideInLeftSlow = trigger('fadeSlideInLeftSlow', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-40px)' }),
    animate('600ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateX(0)' }))
  ])
]);

// Logo y elementos individuales del panel izquierdo
export const fadeSlideInLeft = trigger('fadeSlideInLeft', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-30px)' }),
    animate('500ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateX(0)' }))
  ])
]);

// Stagger para los items de la lista de features
export const staggerItems = trigger('staggerItems', [
  transition(':enter', [
    query('.olvide-feature-item', [
      style({ opacity: 0, transform: 'translateX(-20px)' }),
      stagger(100, [
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ], { optional: true })
  ])
]);

// Stats: entrada desde abajo con delay
export const fadeSlideInUp = trigger('fadeSlideInUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate('500ms 400ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

// Panel derecho: entrada desde la derecha
export const fadeSlideIn = trigger('fadeSlideIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(30px)' }),
    animate('500ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateX(0)' }))
  ])
]);

// Transición entre pasos
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

@Component({
  selector: 'app-olvidecontra',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './olvidecontra.html',
  styleUrl: './olvidecontra.css',
  animations: [fadeSlideInLeftSlow, fadeSlideInLeft, staggerItems, fadeSlideInUp, fadeSlideIn, stepTransition]
})
export class OlvidecontraComponent implements OnDestroy {

  paso = 1;
  loading = false;
  errorMessage = '';

  emailForm: FormGroup;

  tiempoRestante = 0;
  private intervalo: any = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // ── Paso 1: enviar correo ──────────────────────────────
  enviarToken(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const correo = this.emailForm.get('email')?.value;

    this.authService.recuperar(correo).subscribe({
      next: () => {
        this.loading = false;
        this.paso = 2;
        this.iniciarCountdown();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.error?.mensaje ?? 'No pudimos enviar el correo. Intenta nuevamente.';
      }
    });
  }

  // ── Reenviar link ──────────────────────────────────────
  reenviarToken(): void {
    this.errorMessage = '';
    this.loading = true;

    const correo = this.emailForm.get('email')?.value;

    this.authService.recuperar(correo).subscribe({
      next: () => {
        this.loading = false;
        this.iniciarCountdown();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.error?.mensaje ?? 'No pudimos reenviar el correo. Intenta nuevamente.';
      }
    });
  }

  // ── Countdown 15 minutos ───────────────────────────────
  iniciarCountdown(): void {
    this.tiempoRestante = 900;
    this.limpiarIntervalo();

    this.intervalo = setInterval(() => {
      if (this.tiempoRestante > 0) {
        this.tiempoRestante--;
      } else {
        this.limpiarIntervalo();
      }
    }, 1000);
  }

  formatTiempo(segundos: number): string {
    const m = Math.floor(segundos / 60).toString().padStart(2, '0');
    const s = (segundos % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // ── Volver al paso 1 ───────────────────────────────────
  volverPaso1(): void {
    this.paso = 1;
    this.errorMessage = '';
    this.limpiarIntervalo();
    this.tiempoRestante = 0;
  }

  // ── Focus/Blur inputs ──────────────────────────────────
  onFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.style.borderColor = '#2366CE';
    input.style.boxShadow = '0 0 0 3px rgba(35, 102, 206, 0.15)';
  }

  onBlur(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.style.borderColor = '';
    input.style.boxShadow = '';
  }

  // ── Cleanup ────────────────────────────────────────────
  private limpiarIntervalo(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
    }
  }

  ngOnDestroy(): void {
    this.limpiarIntervalo();
  }
}