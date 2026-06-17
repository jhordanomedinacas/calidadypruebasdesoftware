import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api/api';

// ============================================
// INTERFACES
// ============================================

export interface TarjetaResponse {
  idTarjetaUsuario: number;
  codigoTarjeta:    string;
  alias:            string;
  tipoTarjeta:      string;
  saldo:            number;
  estado:           number;
}

export interface AgregarTarjetaRequest {
  codigoTarjeta: string;
  alias:         string;
}

export interface AgregarTarjetaResponse {
  mensaje:          string;
  idTarjetaUsuario: number;
}

export interface EditarTarjetaRequest {
  alias: string;
}

export interface SaldoResponse {
  codigoTarjeta: string;
  saldo:         number;
}

export interface MensajeResponse {
  mensaje: string;
}

// ============================================
// SERVICIO
// ============================================

@Injectable({ providedIn: 'root' })
export class TarjetaService {

  private readonly API = `${API_URL}/api/v1/tarjetas`;

  constructor(private http: HttpClient) {}

  obtenerTarjetas(): Observable<TarjetaResponse[]> {
    return this.http.get<TarjetaResponse[]>(this.API);
  }

  agregar(body: AgregarTarjetaRequest): Observable<AgregarTarjetaResponse> {
    return this.http.post<AgregarTarjetaResponse>(this.API, body);
  }

  editar(idTarjetaUsuario: number, body: EditarTarjetaRequest): Observable<MensajeResponse> {
    return this.http.put<MensajeResponse>(`${this.API}/${idTarjetaUsuario}`, body);
  }

  eliminar(idTarjetaUsuario: number): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.API}/${idTarjetaUsuario}`);
  }

  obtenerSaldo(idTarjetaUsuario: number): Observable<SaldoResponse> {
    return this.http.get<SaldoResponse>(`${this.API}/${idTarjetaUsuario}/saldo`);
  }
}