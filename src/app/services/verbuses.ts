import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api/api';

// ── Modelos de respuesta del backend ──────────────────────────────────────────

export interface DiaOperacion {
  lunes:     boolean;
  martes:    boolean;
  miercoles: boolean;
  jueves:    boolean;
  viernes:   boolean;
  sabado:    boolean;
  domingo:   boolean;
}

export interface LineaResponse {
  idLinea:        number;
  nombreLinea:    string;
  empresa:        string;
  totalParaderos: number;
  horaInicio:     string;
  horaFin:        string;
  diasOperacion:  DiaOperacion;
}

export interface ParaderoResponse {
  idParadero: number;
  nombre:     string;
  direccion:  string;
  latitud:    number | null;
  longitud:   number | null;
  orden:      number;
}

export interface BusResponse {
  idBus:       number;
  placa:       string;
  capacidad:   number;
  estado:      boolean;
  conductor:   string;
  turno:       string;
  turnoInicio: string;
  turnoFin:    string;
}

// ── Servicio ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class VerbusesService {

  private readonly base = `${API_URL}/api/v1/verbuses`;

  constructor(private http: HttpClient) {}

  obtenerLineas(): Observable<LineaResponse[]> {
    return this.http.get<LineaResponse[]>(`${this.base}/lineas`);
  }

  obtenerParaderos(idLinea: number, direccion: 'ida' | 'vuelta'): Observable<ParaderoResponse[]> {
    return this.http.get<ParaderoResponse[]>(
      `${this.base}/${idLinea}/paraderos?direccion=${direccion}`
    );
  }

  obtenerBuses(idLinea: number): Observable<BusResponse[]> {
    return this.http.get<BusResponse[]>(`${this.base}/${idLinea}/buses`);
  }
}