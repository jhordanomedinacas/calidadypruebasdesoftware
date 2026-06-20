import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth';
import { TicketService, TicketAdmin } from '../../../services/ticket';

const TIPO_MAP: Record<string, string> = {
  estacion_aglomeracion:   'Aglomeración peligrosa en estación',
  estacion_modulo_recarga: 'Módulo de recarga dañado o sin saldo',
  estacion_torniquete:     'Torniquete trabado o sin funcionar',
  bus_conductor:           'Conducción irresponsable o mala actitud',
  bus_estado:              'Bus en mal estado o sucio',
  bus_sobrecarga:          'Bus con sobrecarga de pasajeros',
  app_saldo_incorrecto:    'Saldo incorrecto en la app',
  app_error:               'Error o falla en la aplicación',
  otro:                    'Otro problema no listado',
};

@Component({
  selector: 'app-gestionar-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './gestionar-tickets.html',
  styleUrl: './gestionar-tickets.css'
})
export class GestionarTicketsComponent implements OnInit {

  constructor(
    private router:    Router,
    private auth:      AuthService,
    private ticketSvc: TicketService
  ) {}

  cargando            = false;
  filtroEstado        = 'todos';
  busqueda            = '';
  ticketSeleccionado: TicketAdmin | null = null;
  cargandoDetalle     = false;

  respuestaTexto     = '';
  guardandoRespuesta = false;

  tickets: TicketAdmin[] = [];

  kpiTotal       = 0;
  kpiPendientes  = 0;
  kpiRespondidos = 0;

  ngOnInit(): void {
    this.cargarStats();
    this.cargarTickets();
  }

  cargarStats(): void {
    this.ticketSvc.statsTickets().subscribe({
      next: (s) => {
        this.kpiTotal       = s.total;
        this.kpiPendientes  = s.pendientes;
        this.kpiRespondidos = s.respondidos;
      },
      error: () => {}
    });
  }

  cargarTickets(): void {
    this.cargando = true;
    const estado = this.filtroEstado === 'todos' ? undefined : this.filtroEstado;
    this.ticketSvc.listarTickets(estado, this.busqueda).subscribe({
      next:  (data) => { this.tickets = data; this.cargando = false; },
      error: ()     => { this.cargando = false; alert('No se pudieron cargar los tickets.'); }
    });
  }

  // Al hacer click se carga el detalle completo (con imagen) por separado
  seleccionarTicket(t: TicketAdmin): void {
    this.ticketSeleccionado = t;
    this.respuestaTexto     = '';
    this.cargandoDetalle    = true;
    this.ticketSvc.obtenerTicket(t.idTicket).subscribe({
      next: (detalle) => {
        this.ticketSeleccionado = detalle;
        this.cargandoDetalle    = false;
      },
      error: () => { this.cargandoDetalle = false; }
    });
  }

  labelTipo(tipo: string): string { return TIPO_MAP[tipo] ?? tipo; }

  fechaCorta(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const esHoy = d.toDateString() === new Date().toDateString();
    if (esHoy) return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
           + ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  guardarRespuesta(): void {
    if (!this.ticketSeleccionado || !this.respuestaTexto.trim()) return;
    this.guardandoRespuesta = true;
    this.ticketSvc.responderTicket(this.ticketSeleccionado.idTicket, {
      respuesta: this.respuestaTexto.trim()
    }).subscribe({
      next: () => {
        this.ticketSeleccionado!.estado        = 'respondido';
        this.ticketSeleccionado!.respuesta     = this.respuestaTexto.trim();
        this.ticketSeleccionado!.fechaRespuesta = new Date().toISOString();
        this.respuestaTexto     = '';
        this.guardandoRespuesta = false;
        this.cargarStats();
        this.cargarTickets();
      },
      error: (err) => {
        this.guardandoRespuesta = false;
        alert(err?.error?.message ?? 'No se pudo guardar la respuesta.');
      }
    });
  }

  eliminarTicket(t: TicketAdmin, event: MouseEvent): void {
    event.stopPropagation();
    if (!confirm(`¿Eliminar el ticket #${t.idTicket} de ${t.nombreUsuario}?`)) return;
    this.ticketSvc.eliminarTicket(t.idTicket).subscribe({
      next: () => {
        if (this.ticketSeleccionado?.idTicket === t.idTicket) this.ticketSeleccionado = null;
        this.cargarStats();
        this.cargarTickets();
      },
      error: (err) => alert(err?.error?.message ?? 'No se pudo eliminar el ticket.')
    });
  }

  irInicio(): void { this.router.navigate(['/inicia']); }
  onLogout(): void { this.auth.cerrarSesion(); this.router.navigate(['/login']); }
}