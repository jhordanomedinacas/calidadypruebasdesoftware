import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { AuthService } from '../../services/auth';
import { HttpErrorResponse } from '@angular/common/http';

// ── Animaciones (sin cambios) ──────────────────────────────────────────────

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
    query('.registro-feature-item', [
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

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password  = group.get('password')?.value;
  const confirmar = group.get('confirmarPassword')?.value;
  return password === confirmar ? null : { passwordsMismatch: true };
}

// ── Componente ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
  animations: [fadeSlideInLeftSlow, fadeSlideInLeft, staggerItems, fadeSlideInUp, fadeSlideIn]
})
export class RegistroComponent {

  registroForm: FormGroup;
  showPassword  = false;
  showConfirm   = false;
  loading       = false;
  errorMessage       = '';
  modalExitoAbierto  = false;
  modalAbierto  = false;

  placeholderDocumento  = 'Ingresa tu número';
  maxLengthDocumento    = 20;
  mensajeErrorDocumento = 'Ingresa un número de documento válido.';


  constructor(
    private fb:          FormBuilder,
    private router:      Router,
    private authService: AuthService
  ) {
    this.registroForm = this.fb.group(
      {
        nombres:           ['', [Validators.required, Validators.minLength(2)]],
        apellidos:         ['', [Validators.required, Validators.minLength(2)]],
        tipoDocumento:     ['', Validators.required],
        numeroDocumento:   ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{8}$/)]],
        email:             ['', [Validators.required, Validators.email]],
        password:          ['', [Validators.required, Validators.minLength(8)]],
        confirmarPassword: ['', Validators.required],
        telefono:          ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
        terminos:          [false, Validators.requiredTrue]
      },
      { validators: passwordsMatchValidator }
    );
  }

  onTipoDocumentoChange(): void {
    const tipo    = this.registroForm.get('tipoDocumento')?.value;
    const control = this.registroForm.get('numeroDocumento')!;

    switch (tipo) {
      case 'DNI':
        control.setValidators([Validators.required, Validators.pattern(/^[0-9]{8}$/)]);
        this.placeholderDocumento  = 'Ej: 12345678 (8 dígitos)';
        this.maxLengthDocumento    = 8;
        this.mensajeErrorDocumento = 'El DNI debe tener exactamente 8 dígitos.';
        break;
      case 'CE':
        control.setValidators([Validators.required, Validators.pattern(/^[A-Za-z0-9]{9,12}$/)]);
        this.placeholderDocumento  = 'Ej: 000123456 (9–12 caracteres)';
        this.maxLengthDocumento    = 12;
        this.mensajeErrorDocumento = 'El carné de extranjería debe tener entre 9 y 12 caracteres.';
        break;
      case 'Pasaporte':
        control.setValidators([Validators.required, Validators.pattern(/^[A-Za-z0-9]{6,20}$/)]);
        this.placeholderDocumento  = 'Ej: AB123456 (6–20 caracteres)';
        this.maxLengthDocumento    = 20;
        this.mensajeErrorDocumento = 'El pasaporte debe tener entre 6 y 20 caracteres alfanuméricos.';
        break;
      default:
        control.setValidators([Validators.required]);
        this.placeholderDocumento  = 'Selecciona primero el tipo';
        this.maxLengthDocumento    = 20;
        this.mensajeErrorDocumento = 'Ingresa un número de documento válido.';
    }

    control.reset('');
    control.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    this.loading      = true;
    this.errorMessage = '';

    const v = this.registroForm.value;

    // Separar apellidos: el form tiene un campo "apellidos" combinado
    // Si el backend espera apellido1 y apellido2, los separamos por el primer espacio
    const partes    = (v.apellidos as string).trim().split(/\s+/);
    const apellido1 = partes[0] ?? '';
    const apellido2 = partes.slice(1).join(' ') || undefined;

    this.authService.registro({
      nombre:        v.nombres,
      apellido1,
      apellido2,
      tipoDocumento: v.tipoDocumento,
      numDocumento:  v.numeroDocumento,
      telefono:      v.telefono,
      correo:        v.email,
      contrasena:    v.password,
    }).subscribe({
      next: () => {
        this.loading           = false;
        this.modalExitoAbierto = true;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 409) {
          this.errorMessage = err.error?.detail ?? 'Ya existe una cuenta con ese correo o documento.';
        } else if (err.status === 400) {
          this.errorMessage = 'Revisa los datos ingresados e intenta de nuevo.';
        } else {
          this.errorMessage = 'Ocurrió un error inesperado. Intenta más tarde.';
        }
      }
    });
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }
  toggleConfirm():  void { this.showConfirm  = !this.showConfirm;  }

  irAlLogin(): void {
    this.modalExitoAbierto = false;
    this.router.navigate(['/login']);
  }

  abrirModal():  void { this.modalAbierto = true;  }
  cerrarModal(): void { this.modalAbierto = false; }

  aceptarYCerrarModal(): void {
    this.registroForm.get('terminos')?.setValue(true);
    this.modalAbierto = false;
  }

  onFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement | HTMLSelectElement;
    input.style.borderColor = '#2366CE';
    input.style.boxShadow   = '0 0 0 3px rgba(35, 102, 206, 0.15)';
  }

  onBlur(event: FocusEvent): void {
    const input = event.target as HTMLInputElement | HTMLSelectElement;
    input.style.borderColor = '';
    input.style.boxShadow   = '';
  }
}