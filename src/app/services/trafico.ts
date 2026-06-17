import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ML_API_URL } from './api/api';

// ============================================================
// INTERFACES — calzan 1:1 con el router /trafico de DespliegueML (FastAPI)
// ============================================================

export type NivelTraficoApi = 'PESADO' | 'MODERADO' | 'FLUIDO' | 'SIN_DATOS';

export interface ZonaTraficoApi {
  avenida:          string;
  tramo:            string;
  nivel:            NivelTraficoApi;
  velocidadActual:  number | null;
  velocidadLibre:   number | null;
}

export interface EstadoTraficoResponse {
  zonas:       ZonaTraficoApi[];
  actualizado: number;   // timestamp unix (segundos) — cuándo se calculó en el backend
}

// ============================================================
// SERVICIO
// ============================================================

@Injectable({ providedIn: 'root' })
export class TraficoService {

  private readonly API = `${ML_API_URL}/trafico`;

  constructor(private http: HttpClient) {}

  // GET /trafico/estado
  obtenerEstado(): Observable<EstadoTraficoResponse> {
    return this.http.get<EstadoTraficoResponse>(`${this.API}/estado`);
  }
}