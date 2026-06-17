import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api/api';

// ============================================================
// INTERFACES — calzan 1:1 con NoticiaUsuarioController
// ============================================================

export type CategoriaNoticia =
  | 'Todas'
  | 'Institucional'
  | 'Rutas'
  | 'Alertas'
  | 'Tráfico'
  | 'Eventos';

export interface NoticiaItem {
  id:        number;
  titulo:    string;
  resumen:   string;   // LEAD
  categoria: string;
  imagen:    string;
  vistas:    number;
  destacada: boolean;
  fecha:     string;   // ISO string de LocalDateTime
  autor:     string;
}

export interface ListarNoticiasResponse {
  total:    number;
  pagina:   number;
  noticias: NoticiaItem[];
}

export interface NoticiaDetalle {
  titulo:        string;
  contenidoHtml: string;
  lead:          string;
  categoria:     string;
  imagenUrl:     string;
  vistas:        number;
  fecha:         string;
  autor:         string;
}

export interface NoticiaRelacionada {
  id:        number;
  titulo:    string;
  categoria: string;
  imagen:    string;
  vistas:    number;
}

export interface Comentario {
  id:              number;
  idUsuario:       number;
  autor:           string;
  contenido:       string;
  fecha:           string;
  totalLikes:      number;
  leDioLike:       boolean;
  totalRespuestas: number;
}

export interface ListarComentariosResponse {
  total:       number;
  comentarios: Comentario[];
}

export interface VistaResponse {
  mensaje: string;
  vistas:  number;
}

export interface ComentarioResponse {
  mensaje:      string;
  idComentario: number;
}

export interface LikeResponse {
  leDioLike:  boolean;
  totalLikes: number;
}

// ============================================================
// SERVICIO
// ============================================================

@Injectable({ providedIn: 'root' })
export class NoticiaUsuarioService {

  private readonly API = `${API_URL}/api/v1/noticias`;

  constructor(private http: HttpClient) {}

  // GET /api/v1/noticias?categoria=&pagina=&tamPagina=
  listar(
    categoria: CategoriaNoticia,
    pagina: number,
    tamPagina: number
  ): Observable<ListarNoticiasResponse> {
    const params = new HttpParams()
      .set('categoria', categoria)
      .set('pagina',    pagina)
      .set('tamPagina', tamPagina);
    return this.http.get<ListarNoticiasResponse>(this.API, { params });
  }

  // GET /api/v1/noticias/:id
  obtenerDetalle(id: number): Observable<NoticiaDetalle> {
    return this.http.get<NoticiaDetalle>(`${this.API}/${id}`);
  }

  // POST /api/v1/noticias/:id/vista
  registrarVista(id: number): Observable<VistaResponse> {
    return this.http.post<VistaResponse>(`${this.API}/${id}/vista`, {});
  }

  // GET /api/v1/noticias/:id/relacionadas?categoria=&max=
  obtenerRelacionadas(id: number, categoria: string, max = 4): Observable<NoticiaRelacionada[]> {
    const params = new HttpParams()
      .set('categoria', categoria)
      .set('max', max);
    return this.http.get<NoticiaRelacionada[]>(`${this.API}/${id}/relacionadas`, { params });
  }

  // GET /api/v1/noticias/:id/comentarios
  listarComentarios(idNoticia: number): Observable<ListarComentariosResponse> {
    return this.http.get<ListarComentariosResponse>(`${this.API}/${idNoticia}/comentarios`);
  }

  // GET /api/v1/noticias/comentarios/:idComentario/respuestas
  listarRespuestas(idComentario: number): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(`${this.API}/comentarios/${idComentario}/respuestas`);
  }

  // POST /api/v1/noticias/:id/comentarios
  crearComentario(
    idNoticia: number,
    contenido: string,
    idComentarioPadre: number | null = null
  ): Observable<ComentarioResponse> {
    return this.http.post<ComentarioResponse>(
      `${this.API}/${idNoticia}/comentarios`,
      { idComentarioPadre, contenido }
    );
  }

  // DELETE /api/v1/noticias/comentarios/:idComentario
  eliminarComentario(idComentario: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.API}/comentarios/${idComentario}`);
  }

  // POST /api/v1/noticias/comentarios/:idComentario/like
  toggleLike(idComentario: number): Observable<LikeResponse> {
    return this.http.post<LikeResponse>(`${this.API}/comentarios/${idComentario}/like`, {});
  }
}