import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api/api';

// ============================================
// INTERFACES
// ============================================

export interface PerfilResponse {
  nombres:       string;
  apellidos:     string;
  tipoDocumento: string;
  nroDocumento:  string;
  correo:        string;
  telefono:      string;
  tipoTarjeta:   string;
}

export interface EditarPerfilRequest {
  nombres:       string;
  apellidos:     string;
  tipoDocumento: string;
  nroDocumento:  string;
  telefono:      string;
}

export interface CambiarContrasenaRequest {
  contrasenaActual: string;
  contrasenaNueva:  string;
}

export interface MensajeResponse {
  mensaje: string;
}

// ============================================
// SERVICIO
// ============================================

@Injectable({ providedIn: 'root' })
export class PerfilService {

  private readonly API = `${API_URL}/api/v1/perfil`;

  constructor(private http: HttpClient) {}

  obtener(): Observable<PerfilResponse> {
    return this.http.get<PerfilResponse>(this.API);
  }

  editar(body: EditarPerfilRequest): Observable<MensajeResponse> {
    return this.http.put<MensajeResponse>(this.API, body);
  }

  cambiarContrasena(body: CambiarContrasenaRequest): Observable<MensajeResponse> {
    return this.http.patch<MensajeResponse>(`${this.API}/contrasena`, body);
  }
}