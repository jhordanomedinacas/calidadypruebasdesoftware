import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { AuthService } from '../../services/auth';

// ── Animaciones (mismo patrón que olvidecontra) ────────

export const fadeSlideInLeftSlow = trigger('fadeSlideInLeftSlow', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-40px)' }),
    animate('600ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateX(0)' }))
  ])
]);

export const fadeSlideInLeft = trigger('fadeSlideInLeft', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-30px)' }),
    animate('500ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateX(0)' }))
  ])
]);

export const staggerItems = trigger('staggerItems', [
  transition(':enter', [
    query('.reset-feature-item', [
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

export const fadeSlideIn = trigger('fadeSlideIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(30px)' }),
    animate('500ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateX(0)' }))
  ])
]);

// ── Validador: contraseñas iguales ─────────────────────
function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const nueva    = control.get('nuevaContrasena')?.value;
  const confirmar = control.get('confirmarContrasena')?.value;
  return nueva && confirmar && nueva !== confirmar
    ? { noCoinciden: true }
    : null;
}

@Component({
  selector: 'app-resetpassword',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './resetpassword.html',
  styleUrl: './resetpassword.css',
  animations: [fadeSlideInLeftSlow, fadeSlideInLeft, staggerItems, fadeSlideInUp, fadeSlideIn]
})
export class ResetPasswordComponent implements OnInit {

  estado: 'validando' | 'formulario' | 'expirado' | 'exito' = 'validando';
  loading  = false;
  errorMessage = '';
  mostrarNueva     = false;
  mostrarConfirmar = false;

  resetForm: FormGroup;
  private token = '';

  constructor(
    private fb:          FormBuilder,
    private route:       ActivatedRoute,
    private router:      Router,
    private authService: AuthService,
    private cdr:         ChangeDetectorRef
  ) {
    this.resetForm = this.fb.group({
      nuevaContrasena:    ['', [Validators.required, Validators.minLength(8)]],
      confirmarContrasena: ['', [Validators.required]]
    }, { validators: passwordsMatch });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] ?? '';

      if (!this.token) {
        this.estado = 'expirado';
        this.cdr.detectChanges();
        return;
      }

      this.authService.validarToken(this.token).subscribe({
        next: () => {
          this.estado = 'formulario';
          this.cdr.detectChanges();
        },
        error: () => {
          this.estado = 'expirado';
          this.cdr.detectChanges();
        }
      });
    });
  }

  // ── Guardar nueva contraseña ───────────────────────────
  guardar(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.resetPassword({
      token:           this.token,
      nuevaContrasena: this.resetForm.get('nuevaContrasena')?.value
    }).subscribe({
      next: () => {
        this.loading = false;
        this.estado  = 'exito';
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.error?.mensaje ?? 'Ocurrió un error. Intenta solicitar un nuevo enlace.';
      }
    });
  }

  irAlLogin(): void {
    this.router.navigate(['/login']);
  }

  // ── Focus/Blur ─────────────────────────────────────────
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
}