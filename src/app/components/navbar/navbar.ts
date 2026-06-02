import { Component, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Notificacion {
  id: number;
  tipo: 'operativa' | 'saldo';
  titulo: string;
  descripcion: string;
  hora: string;
  leida: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  @Output() logout = new EventEmitter<void>();

  mostrarNotificaciones = false;
  modalLogoutAbierto = false;
  modalReporteAbierto = false;
  modalReporteExitoAbierto = false;
  reporteTipo = '';
  reporteDescripcion = '';
  reporteImagen: File | null = null;
  reporteImagenNombre = '';
  reporteLinea = '';
  reporteTipoOpen = false;

  private readonly tipoMap: Record<string, { label: string; color: string; path: string }> = {
    estacion_aglomeracion:   { label: 'Aglomeración peligrosa en estación',   color: '#ea580c', path: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' },
    estacion_modulo_recarga: { label: 'Módulo de recarga dañado o sin saldo', color: '#ea580c', path: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' },
    estacion_torniquete:     { label: 'Torniquete trabado o sin funcionar',   color: '#ea580c', path: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' },
    estacion_limpieza:       { label: 'Estación sucia o con mal olor',        color: '#ea580c', path: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' },
    estacion_inseguridad:    { label: 'Situación de inseguridad en estación', color: '#ea580c', path: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' },
    bus_no_llega:    { label: 'Bus no llega / tiempo de espera excesivo', color: '#2366CE', path: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
    bus_lleno:       { label: 'Bus pasa lleno sin recoger pasajeros',     color: '#2366CE', path: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
    bus_mal_estado:  { label: 'Bus en mal estado (puertas, asientos, aire)', color: '#2366CE', path: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
    bus_conductor:   { label: 'Conducta inapropiada del conductor',       color: '#2366CE', path: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
    bus_ruta_desvio: { label: 'Bus se desvió de la ruta habitual',        color: '#2366CE', path: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
    bus_velocidad:   { label: 'Exceso de velocidad o manejo brusco',      color: '#2366CE', path: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
    tarjeta_no_carga:   { label: 'No se pudo recargar la tarjeta',        color: '#7c3aed', path: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z' },
    tarjeta_descuento:  { label: 'Se descontó saldo sin motivo',          color: '#7c3aed', path: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z' },
    tarjeta_no_lee:     { label: 'Tarjeta no es leída por el lector',     color: '#7c3aed', path: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z' },
    tarjeta_perdida:    { label: 'Tarjeta perdida o robada',              color: '#7c3aed', path: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z' },
    app_saldo_incorrecto: { label: 'Saldo incorrecto en la app',          color: '#0891b2', path: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3' },
    app_error:           { label: 'Error o falla en la aplicación',       color: '#0891b2', path: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3' },
    otro: { label: 'Otro problema no listado', color: '#6b7280', path: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z' },
  };

  reporteTipoLabel(): string  { return this.tipoMap[this.reporteTipo]?.label ?? ''; }
  reporteTipoColor(): string  { return this.tipoMap[this.reporteTipo]?.color ?? '#6b7280'; }
  reporteTipoIconPath(): string { return this.tipoMap[this.reporteTipo]?.path ?? ''; }

  seleccionarTipo(valor: string): void {
    this.reporteTipo = valor;
    this.reporteTipoOpen = false;
  }

  abrirModalReporte(): void {
    this.modalReporteAbierto = true;
    this.mostrarNotificaciones = false;
  }

  cerrarModalReporte(): void {
    this.modalReporteAbierto = false;
    this.reporteTipo = '';
    this.reporteDescripcion = '';
    this.reporteImagen = null;
    this.reporteImagenNombre = '';
    this.reporteLinea = '';
    this.reporteTipoOpen = false;
  }

  cerrarModalReporteSiOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cerrarModalReporte();
    }
  }

  onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.reporteImagen = input.files[0];
      this.reporteImagenNombre = input.files[0].name;
    }
  }

  quitarImagen(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.reporteImagen = null;
    this.reporteImagenNombre = '';
  }

  enviarReporte(): void {
    if (!this.reporteTipo || !this.reporteDescripcion.trim()) return;
    // TODO: integrar con el servicio de reportes
    console.log('Reporte enviado', {
      tipo: this.reporteTipo,
      linea: 'corredor_azul',
      descripcion: this.reporteDescripcion,
      imagen: this.reporteImagen
    });
    this.cerrarModalReporte();
    this.modalReporteExitoAbierto = true;
  }

  cerrarModalReporteExito(): void {
    this.modalReporteExitoAbierto = false;
  }

  notificaciones: Notificacion[] = [
    {
      id: 1,
      tipo: 'saldo',
      titulo: 'Saldo bajo',
      descripcion: 'Tu saldo es menor a S/ 2.00. Recarga para seguir usando el servicio.',
      hora: 'Hace 5 min',
      leida: false
    },
    {
      id: 2,
      tipo: 'operativa',
      titulo: 'Retraso en Ruta 201',
      descripcion: 'Se reporta demora de 12 min por incidente en Av. Javier Prado.',
      hora: 'Hace 18 min',
      leida: false
    },
    {
      id: 3,
      tipo: 'operativa',
      titulo: 'Desvío en Ruta 301',
      descripcion: 'La ruta opera por vía alterna hasta nuevo aviso. Paradero Lince suspendido.',
      hora: 'Hace 45 min',
      leida: false
    },
    {
      id: 4,
      tipo: 'operativa',
      titulo: 'Servicio restablecido',
      descripcion: 'Ruta 101 opera con normalidad tras incidente resuelto.',
      hora: 'Hace 1 h',
      leida: true
    }
  ];

  get noLeidas(): number {
    return this.notificaciones.filter(n => !n.leida).length;
  }

  toggleNotificaciones(): void {
    this.mostrarNotificaciones = !this.mostrarNotificaciones;
  }

  marcarLeida(n: Notificacion): void {
    n.leida = true;
  }

  marcarTodasLeidas(): void {
    this.notificaciones.forEach(n => n.leida = true);
  }

  @HostListener('document:click', ['$event'])
  onClickFuera(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.mostrarNotificaciones = false;
    }
  }

  abrirModalLogout(): void {
    this.modalLogoutAbierto = true;
  }

  cerrarModalLogout(): void {
    this.modalLogoutAbierto = false;
  }

  cerrarModalLogoutSiOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cerrarModalLogout();
    }
  }

  confirmarLogout(): void {
    this.modalLogoutAbierto = false;
    this.logout.emit();
  }
}