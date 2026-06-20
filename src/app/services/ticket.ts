import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api/api';

export interface TicketAdmin {
  idTicket:      number;
  idUsuario:     number;
  nombreUsuario: string;
  correo:        string;
  tipo:          string;
  descripcion:   string;
  tieneImagen:   boolean;       // solo en el listado
  imagenUrl:     string | null; // solo en el detalle
  estado:        'pendiente' | 'respondido';
  respuesta:     string | null;
  fechaCreacion: string;
  fechaRespuesta: string | null;
}

export interface TicketStats {
  total:       number;
  pendientes:  number;
  respondidos: number;
}

export interface CrearTicketRequest {
  tipo:         string;
  descripcion:  string;
  imagenBase64?: string | null;
  imagenNombre?: string | null;
}

export interface ResponderTicketRequest { respuesta: string; }
export interface MensajeResponse        { mensaje: string; }
export interface IdTicketResponse       { idTicket: number; mensaje: string; }

@Injectable({ providedIn: 'root' })
export class TicketService {

  private readonly API       = `${API_URL}/api/v1/tickets`;
  private readonly API_ADMIN = `${API_URL}/api/v1/admin/tickets`;

  constructor(private http: HttpClient) {}

  crearTicket(body: CrearTicketRequest): Observable<IdTicketResponse> {
    return this.http.post<IdTicketResponse>(this.API, body);
  }

  statsTickets(): Observable<TicketStats> {
    return this.http.get<TicketStats>(`${this.API_ADMIN}/stats`);
  }

  listarTickets(estado?: string, busqueda?: string): Observable<TicketAdmin[]> {
    const params: Record<string, string> = {};
    if (estado   && estado !== 'todos') params['estado']   = estado;
    if (busqueda && busqueda.trim())    params['busqueda'] = busqueda.trim();
    return this.http.get<TicketAdmin[]>(this.API_ADMIN, { params });
  }

  obtenerTicket(idTicket: number): Observable<TicketAdmin> {
    return this.http.get<TicketAdmin>(`${this.API_ADMIN}/${idTicket}`);
  }

  responderTicket(idTicket: number, body: ResponderTicketRequest): Observable<MensajeResponse> {
    return this.http.put<MensajeResponse>(`${this.API_ADMIN}/${idTicket}/responder`, body);
  }

  eliminarTicket(idTicket: number): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.API_ADMIN}/${idTicket}`);
  }
}