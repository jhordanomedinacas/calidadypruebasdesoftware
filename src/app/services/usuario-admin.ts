import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api/api';

// ============================================
// INTERFACES
// ============================================

export interface UsuarioAdminListado {
  id:             number;
  nombres:        string;
  apellidos:      string;
  nombreCompleto: string;
  correo:         string;
  telefono:       string;
  tipoDocumento:  string;
  nroDocumento:   string;
  fechaRegistro:  string;
  estado:         number;       // 1=Activo, 0=Baja, 2=Suspendido
  estadoLabel:    string;
  idRol:          number;
  nombreRol:      string;
  saldo:          number;
}

export interface UsuarioAdminListadoResponse {
  total:    number;
  pagina:   number;
  usuarios: UsuarioAdminListado[];
}

export interface UsuarioAdminDetalle {
  nombres:        string;
  apellidos:      string;
  correo:         string;
  telefono:       string;
  tipoDocumento:  string;
  nroDocumento:   string;
  fechaRegistro:  string;
  estado:         number;
  estadoLabel:    string;
  idRol:          number;
  nombreRol:      string;
  saldo:          number;
}

export interface UsuarioEditarRequest {
  nombres:       string;
  apellidos:     string;
  correo:        string;
  telefono:      string;
  tipoDocumento: string;
  nroDocumento:  string;
  idRol:         number;
  estado:        number;
}

export interface RolOption {
  id:     number;
  nombre: string;
}

export interface MensajeResponse {
  mensaje: string;
}

// ============================================
// SERVICIO
// ============================================

@Injectable({ providedIn: 'root' })
export class UsuarioAdminService {

  private readonly API = `${API_URL}/api/v1/admin/usuarios`;

  constructor(private http: HttpClient) {}

  listar(busqueda: string, pagina: number, tamPagina: number): Observable<UsuarioAdminListadoResponse> {
    return this.http.get<UsuarioAdminListadoResponse>(this.API, {
      params: { busqueda: busqueda ?? '', pagina, tamPagina }
    });
  }

  obtener(id: number): Observable<UsuarioAdminDetalle> {
    return this.http.get<UsuarioAdminDetalle>(`${this.API}/${id}`);
  }

  editar(id: number, body: UsuarioEditarRequest): Observable<MensajeResponse> {
    return this.http.put<MensajeResponse>(`${this.API}/${id}`, body);
  }

  cambiarEstado(id: number, estado: number): Observable<MensajeResponse> {
    return this.http.patch<MensajeResponse>(`${this.API}/${id}/estado`, { estado });
  }

  listarRoles(): Observable<RolOption[]> {
    return this.http.get<RolOption[]>(`${this.API}/roles`);
  }

  eliminar(id: number): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.API}/${id}`);
  }
}