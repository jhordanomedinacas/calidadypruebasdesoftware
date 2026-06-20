import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_URL } from './api/api';

// ============================================
// TIPOS
// ============================================

export type TablaAuditoria =
  | 'Todas'
  | 'Usuario'
  | 'Tarjeta'
  | 'Tarjeta_Usuario'
  | 'Recarga'
  | 'Noticia'
  | 'Comentario'
  | 'Rol'
  | 'Token_Verificacion'
  | 'Token_Recuperacion';

// ============================================
// INTERFACES — calzan 1:1 con AuditoriaController
// ============================================

export interface AuditoriaItem {
  id:               number;
  usuario:          string;       // nombre completo o 'Sistema'
  correo:           string;
  rol:              string;
  tablaAfectada:    string;
  operacion:        'INSERT' | 'UPDATE' | 'DELETE';
  idRegistro:       number;
  accion:           string;
  valorAnterior:    string | null;
  valorNuevo:       string | null;
  // El backend devuelve el campo como "fechaDeModificacion" (string ISO)
  // Lo exponemos como "fecha" para que el template lo use con | date
  fecha:            string;
}

// Respuesta cruda del backend
interface BackendAuditoriasResponse {
  data:             BackendAuditoriaRow[];
  totalRegistros:   number;
  pagina:           number;
  tamPagina:        number;
  totalPaginas:     number;
}

interface BackendAuditoriaRow {
  id:                   number;
  usuario:              string;
  correo:               string;
  rol:                  string;
  tablaAfectada:        string;
  operacion:            'INSERT' | 'UPDATE' | 'DELETE';
  idRegistro:           number;
  accion:               string;
  valorAnterior:        string | null;
  valorNuevo:           string | null;
  fechaDeModificacion:  string;   // campo real del backend
}

// Respuesta normalizada que consume el componente
export interface ListarAuditoriasResponse {
  auditorias:   AuditoriaItem[];
  total:        number;
  pagina:       number;
  totalPaginas: number;
}

// ============================================
// SERVICIO
// ============================================

@Injectable({ providedIn: 'root' })
export class AuditoriaService {

  private readonly API = `${API_URL}/api/v1/admin/auditorias`;

  constructor(private http: HttpClient) {}

  // GET /api/v1/admin/auditorias
  // Parámetros: tabla, fechaIni, fechaFin, usuario, pagina, tamPagina
  listar(
    tabla:      TablaAuditoria,
    fechaIni:   string | null,
    fechaFin:   string | null,
    usuario:    string,
    pagina:     number,
    tamPagina:  number
  ): Observable<ListarAuditoriasResponse> {
    let params = new HttpParams()
      .set('tabla',     tabla)
      .set('pagina',    pagina)
      .set('tamPagina', tamPagina);

    if (fechaIni)        params = params.set('fechaIni', fechaIni);
    if (fechaFin)        params = params.set('fechaFin', fechaFin);
    if (usuario?.trim()) params = params.set('usuario', usuario.trim());

    return this.http
      .get<BackendAuditoriasResponse>(this.API, { params })
      .pipe(
        map(res => ({
          auditorias:   res.data.map(row => ({
            id:             row.id,
            usuario:        row.usuario,
            correo:         row.correo,
            rol:            row.rol,
            tablaAfectada:  row.tablaAfectada,
            operacion:      row.operacion,
            idRegistro:     row.idRegistro,
            accion:         row.accion,
            valorAnterior:  row.valorAnterior,
            valorNuevo:     row.valorNuevo,
            fecha:          row.fechaDeModificacion,   // ← renombramos aquí
          })),
          total:        res.totalRegistros,
          pagina:       res.pagina,
          totalPaginas: res.totalPaginas,
        }))
      );
  }
}