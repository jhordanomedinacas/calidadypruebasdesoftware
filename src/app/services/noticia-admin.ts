import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api/api';

// ============================================
// TIPOS COMPARTIDOS
// ============================================

export type CategoriaNoticia =
  | 'Todas'
  | 'Institucional'
  | 'Rutas'
  | 'Alertas'
  | 'Tráfico'
  | 'Eventos';

// ============================================
// INTERFACES — deben calzar 1:1 con NoticiaAdminController
// ============================================

export interface NoticiaAdminItem {
  id:        number;
  titulo:    string;
  resumen:   string;   // ← LEAD en backend
  categoria: string;
  imagen:    string;
  vistas:    number;
  publicada: boolean;
  destacada: boolean;
  fecha:     string;    // ISO (LocalDateTime serializado por Spring)
}

export interface ListarNoticiasAdminResponse {
  total:     number;
  pagina:    number;
  noticias:  NoticiaAdminItem[];
}

export interface NoticiaAdminDetalle {
  titulo:        string;
  contenidoHtml: string;
  lead:          string;
  categoria:     string;
  imagenUrl:     string;
  publicada:     boolean;
  destacada:     boolean;
}

export interface NoticiaRequest {
  titulo:        string;
  contenidoHtml: string;
  lead:          string;
  categoria:     string;
  imagenUrl:     string;
  publicada:     boolean;
  destacada:     boolean;
}

export interface MensajeResponse {
  mensaje: string;
}

export interface CrearNoticiaResponse extends MensajeResponse {
  idNoticia: number;
}

export interface PublicacionResponse extends MensajeResponse {
  publicada: boolean;
}

export interface DestacadaResponse extends MensajeResponse {
  destacada: boolean;
}

// ============================================
// SERVICIO
// ============================================

@Injectable({ providedIn: 'root' })
export class NoticiaAdminService {

  private readonly API = `${API_URL}/api/v1/admin/noticias`;

  constructor(private http: HttpClient) {}

  // GET /api/v1/admin/noticias?categoria=&busqueda=&pagina=&tamPagina=
  listar(
    categoria: CategoriaNoticia,
    busqueda: string,
    pagina: number,
    tamPagina: number
  ): Observable<ListarNoticiasAdminResponse> {
    let params = new HttpParams()
      .set('categoria', categoria)
      .set('pagina', pagina)
      .set('tamPagina', tamPagina);

    if (busqueda?.trim()) {
      params = params.set('busqueda', busqueda.trim());
    }

    return this.http.get<ListarNoticiasAdminResponse>(this.API, { params });
  }

  // GET /api/v1/admin/noticias/:id
  obtener(id: number): Observable<NoticiaAdminDetalle> {
    return this.http.get<NoticiaAdminDetalle>(`${this.API}/${id}`);
  }

  // POST /api/v1/admin/noticias
  crear(body: NoticiaRequest): Observable<CrearNoticiaResponse> {
    return this.http.post<CrearNoticiaResponse>(this.API, body);
  }

  // PUT /api/v1/admin/noticias/:id
  editar(id: number, body: NoticiaRequest): Observable<MensajeResponse> {
    return this.http.put<MensajeResponse>(`${this.API}/${id}`, body);
  }

  // DELETE /api/v1/admin/noticias/:id
  eliminar(id: number): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.API}/${id}`);
  }

  // PATCH /api/v1/admin/noticias/:id/publicacion
  cambiarPublicacion(id: number): Observable<PublicacionResponse> {
    return this.http.patch<PublicacionResponse>(`${this.API}/${id}/publicacion`, {});
  }

  // PATCH /api/v1/admin/noticias/:id/destacada
  toggleDestacada(id: number): Observable<DestacadaResponse> {
    return this.http.patch<DestacadaResponse>(`${this.API}/${id}/destacada`, {});
  }
}