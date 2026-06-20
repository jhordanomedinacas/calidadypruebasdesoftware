import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api/api';

// ============================================
// INTERFACES — calzan con el Map<String,Object> que arma GestionarLineasService.java
// ============================================

export interface LineaAdmin {
  idLinea:   number;
  nombre:    string;
  idEmpresa: number;
  empresa:   string;
  origen:    string;
  destino:   string;
}

export interface RutaAdmin {
  idRuta:         number;
  idLinea:        number;
  idaVuelta:      'ida' | 'vuelta';
  tieneTrafico:   boolean;
  totalParaderos: number;
}

export interface ParaderoAdmin {
  idParadero: number;
  nombre:     string;
  direccion:  string;
  latitud:    number | null;
  longitud:   number | null;
  orden:      number;
  km:         number;
}

export interface HorarioAdmin {
  idHorario:  number;
  lunes:      boolean;
  martes:     boolean;
  miercoles:  boolean;
  jueves:     boolean;
  viernes:    boolean;
  sabado:     boolean;
  domingo:    boolean;
  horaInicio: string; // 'HH:mm'
  horaFin:    string;
}

export interface LineaRequest {
  nombre:    string;
  idEmpresa: number;
}

export interface RutaRequest {
  idaVuelta: 'ida' | 'vuelta';
}

export interface ParaderoRequest {
  nombre:    string;
  direccion: string;
  latitud:   number;
  longitud:  number;
  km:        number;
}

export interface HorarioRequest {
  lunes:      boolean;
  martes:     boolean;
  miercoles:  boolean;
  jueves:     boolean;
  viernes:    boolean;
  sabado:     boolean;
  domingo:    boolean;
  horaInicio: string;
  horaFin:    string;
}

export interface MensajeResponse { mensaje: string; }
export interface IdLineaResponse    { idLinea: number;    mensaje: string; }
export interface IdRutaResponse     { idRuta: number;     mensaje: string; }
export interface IdParaderoResponse { idParadero: number; mensaje: string; }
export interface IdHorarioResponse  { idHorario: number;  mensaje: string; }

// ============================================
// SERVICIO
// ============================================

@Injectable({ providedIn: 'root' })
export class GestionarLineasService {

  private readonly API = `${API_URL}/api/v1/admin/lineas`;

  constructor(private http: HttpClient) {}

  /* ── Líneas ── */

  listarLineas(): Observable<LineaAdmin[]> {
    return this.http.get<LineaAdmin[]>(this.API);
  }

  crearLinea(body: LineaRequest): Observable<IdLineaResponse> {
    return this.http.post<IdLineaResponse>(this.API, body);
  }

  actualizarLinea(idLinea: number, body: LineaRequest): Observable<MensajeResponse> {
    return this.http.put<MensajeResponse>(`${this.API}/${idLinea}`, body);
  }

  eliminarLinea(idLinea: number): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.API}/${idLinea}`);
  }

  /* ── Rutas ── */

  listarRutas(idLinea: number): Observable<RutaAdmin[]> {
    return this.http.get<RutaAdmin[]>(`${this.API}/${idLinea}/rutas`);
  }

  crearRuta(idLinea: number, body: RutaRequest): Observable<IdRutaResponse> {
    return this.http.post<IdRutaResponse>(`${this.API}/${idLinea}/rutas`, body);
  }

  eliminarRuta(idRuta: number): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.API}/rutas/${idRuta}`);
  }

  /* ── Paraderos ── */

  listarParaderos(idRuta: number): Observable<ParaderoAdmin[]> {
    return this.http.get<ParaderoAdmin[]>(`${this.API}/rutas/${idRuta}/paraderos`);
  }

  agregarParadero(idRuta: number, body: ParaderoRequest): Observable<IdParaderoResponse> {
    return this.http.post<IdParaderoResponse>(`${this.API}/rutas/${idRuta}/paraderos`, body);
  }

  editarParadero(idRuta: number, idParadero: number, body: ParaderoRequest): Observable<MensajeResponse> {
    return this.http.put<MensajeResponse>(`${this.API}/rutas/${idRuta}/paraderos/${idParadero}`, body);
  }

  eliminarParadero(idRuta: number, idParadero: number): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.API}/rutas/${idRuta}/paraderos/${idParadero}`);
  }

  reordenarParaderos(idRuta: number, idsEnOrden: number[]): Observable<MensajeResponse> {
    return this.http.put<MensajeResponse>(`${this.API}/rutas/${idRuta}/paraderos/orden`, { idsEnOrden });
  }

  /* ── Horarios ── */

  listarHorarios(idRuta: number): Observable<HorarioAdmin[]> {
    return this.http.get<HorarioAdmin[]>(`${this.API}/rutas/${idRuta}/horarios`);
  }

  asignarHorario(idRuta: number, body: HorarioRequest): Observable<IdHorarioResponse> {
    return this.http.post<IdHorarioResponse>(`${this.API}/rutas/${idRuta}/horarios`, body);
  }

  editarHorario(idHorario: number, body: HorarioRequest): Observable<MensajeResponse> {
    return this.http.put<MensajeResponse>(`${this.API}/horarios/${idHorario}`, body);
  }

  eliminarHorario(idHorario: number): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.API}/horarios/${idHorario}`);
  }
}