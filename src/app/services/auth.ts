import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api/api';

// ============================================
// INTERFACES
// ============================================

export interface LoginRequest {
  correo:    string;
  contrasena: string;
}

export interface VerificarRequest {
  correo: string;
  codigo: string;
}

export interface RegistroRequest {
  nombre:        string;
  apellido1:     string;
  apellido2?:    string;
  tipoDocumento: string;
  numDocumento:  string;
  telefono:      string;
  correo:        string;
  contrasena:    string;
}

export interface ResetPasswordRequest {
  token:           string;
  nuevaContrasena: string;
}

export interface MensajeResponse {
  mensaje: string;
}

export interface TokenResponse {
  token:   string;
  mensaje: string;
}

// ============================================
// SERVICIO
// ============================================

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API = `${API_URL}/api/v1`;

  constructor(private http: HttpClient) {}

  // ── Auth ──────────────────────────────────

  login(body: LoginRequest): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.API}/auth/login`, body);
  }

  verificar(body: VerificarRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.API}/auth/verificar`, body);
  }

  reenviar(correo: string): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.API}/auth/reenviar`, { correo });
  }

  // ── Recuperación de contraseña ────────────

  recuperar(correo: string): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.API}/auth/recuperar`, { correo });
  }

  validarToken(token: string): Observable<MensajeResponse> {
    return this.http.get<MensajeResponse>(`${this.API}/auth/validar-token`, {
      params: { token }
    });
  }

  resetPassword(body: ResetPasswordRequest): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.API}/auth/reset-password`, body);
  }
  
  // ── Registro ──────────────────────────────

  registro(body: RegistroRequest): Observable<any> {
    const payload = {
      nombres:       body.nombre,
      apellidos:     body.apellido2
                       ? `${body.apellido1} ${body.apellido2}`
                       : body.apellido1,
      tipoDocumento: body.tipoDocumento,
      nroDocumento:  body.numDocumento,
      correo:        body.correo,
      contrasena:    body.contrasena,
      telefono:      body.telefono
    };
    return this.http.post(`${this.API}/auth/registro`, payload);
  }

  // ── Sesión ────────────────────────────────

  guardarToken(token: string): void {
    sessionStorage.setItem('auth_token', token);
  }

  obtenerToken(): string | null {
    return sessionStorage.getItem('auth_token');
  }

  cerrarSesion(): void {
    sessionStorage.removeItem('auth_token');
  }

  private decodificarToken(token: string): any | null {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  estaAutenticado(): boolean {
    const token = this.obtenerToken();
    if (!token) return false;

    const payload = this.decodificarToken(token);
    if (!payload?.exp) return false;

    const expirado = Date.now() >= payload.exp * 1000;
    if (expirado) this.cerrarSesion();
    return !expirado;
  }

  obtenerDatosUsuario(): { sub: string; idRol: number; nombres: string } | null {
    const token = this.obtenerToken();
    if (!token) return null;
    return this.decodificarToken(token);
  }
  getRol(): number | null {
    return this.obtenerDatosUsuario()?.idRol ?? null;
  }
}