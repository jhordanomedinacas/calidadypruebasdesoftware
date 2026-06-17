import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api/api';

// ============================================
// INTERFACES
// ============================================

export interface TarjetaRecargaResponse {
  idTarjetaUsuario: number;
  alias:            string;
  codigoTarjeta:    string;
  tipoTarjeta:      string;
  saldo:            number;
}

export interface MetodoPagoResponse {
  idMetodoPago: number;
  nombre:       string;
  descripcion:  string;
  imagenUrl:    string;
}

export interface RegistrarRecargaRequest {
  idTarjetaUsuario: number;
  idMetodoPago:     number;
  monto:            number;
  canal:            string;
}

export interface RegistrarRecargaResponse {
  mensaje:    string;
  idRecarga:  number;
  saldoNuevo: number;
}

export interface HistorialRecargaResponse {
  idRecarga:    number;
  monto:        number;
  fechaRecarga: string;
  canal:        string;
  metodoPago:   string;
  metodoImagen: string;
}

// ============================================
// SERVICIO
// ============================================

@Injectable({ providedIn: 'root' })
export class RecargaService {

  private readonly API = `${API_URL}/api/v1/recargas`;

  constructor(private http: HttpClient) {}

  // GET /api/v1/recargas/tarjetas — usado por guard y selector
  obtenerTarjetas(): Observable<TarjetaRecargaResponse[]> {
    return this.http.get<TarjetaRecargaResponse[]>(`${this.API}/tarjetas`);
  }

  // GET /api/v1/recargas/metodos-pago — lista de métodos de pago activos
  obtenerMetodosPago(): Observable<MetodoPagoResponse[]> {
    return this.http.get<MetodoPagoResponse[]>(`${this.API}/metodos-pago`);
  }

  // POST /api/v1/recargas
  registrarRecarga(body: RegistrarRecargaRequest): Observable<RegistrarRecargaResponse> {
    return this.http.post<RegistrarRecargaResponse>(this.API, body);
  }

  // GET /api/v1/recargas/:idTarjetaUsuario/historial
  obtenerHistorial(idTarjetaUsuario: number): Observable<HistorialRecargaResponse[]> {
    return this.http.get<HistorialRecargaResponse[]>(`${this.API}/${idTarjetaUsuario}/historial`);
  }
}