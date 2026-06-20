import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { NavbarComponent } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth';
import {
  GestionarLineasService,
  LineaAdmin,
  RutaAdmin,
  ParaderoAdmin,
  HorarioAdmin
} from '../../../services/gestionar-lineas';

/* ─────────────── ID_EMPRESA fijo — solo existe Corredor Azul (id 1) ─────────────── */
const ID_EMPRESA_CORREDOR_AZUL = 1;

/* ─────────────── Modal horario (estado local del form) ─────────────── */
export interface ModalHorario {
  lunes: boolean; martes: boolean; miercoles: boolean;
  jueves: boolean; viernes: boolean; sabado: boolean; domingo: boolean;
  horaInicio: string;
  horaFin: string;
  editandoId: number | null; // null = nuevo, number = idHorario a editar
}

/* ─────────────── Componente ─────────────── */

@Component({
  selector: 'app-gestionar-lineas',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './gestionar-lineas.html',
  styleUrl: './gestionar-lineas.css'
})
export class GestionarLineasComponent implements OnInit {

  constructor(
    private router: Router,
    private auth: AuthService,
    private gestionarLineasService: GestionarLineasService
  ) {}

  /* ── Estado UI ── */
  busqueda = '';
  cargando = false;
  paraderoSeleccionadoIdx: number | null = null;
  dragIdx: number | null = null;
  dragOverIdx: number | null = null;
  tipoRuta: 'ida' | 'vuelta' = 'ida';

  /* ── Datos desde el backend ── */
  lineas: LineaAdmin[] = [];
  lineasFiltradas: LineaAdmin[] = [];
  lineaSeleccionada: LineaAdmin | null = null;

  rutasLinea: RutaAdmin[] = [];           // las 2 rutas (ida/vuelta) de la línea seleccionada
  rutaActual: RutaAdmin | null = null;    // la que corresponde al tipoRuta actual

  paraderos: ParaderoAdmin[] = [];
  horarios: HorarioAdmin[] = [];

  /* ── Modal horario ── */
  mostrarModalHorario = false;
  modalHorario: ModalHorario = this.horarioVacio();

  diasSemana: { key: 'lunes'|'martes'|'miercoles'|'jueves'|'viernes'|'sabado'|'domingo'; letra: string }[] = [
    { key: 'lunes',     letra: 'L' },
    { key: 'martes',    letra: 'M' },
    { key: 'miercoles', letra: 'X' },
    { key: 'jueves',    letra: 'J' },
    { key: 'viernes',   letra: 'V' },
    { key: 'sabado',    letra: 'S' },
    { key: 'domingo',   letra: 'D' },
  ];

  private horarioVacio(): ModalHorario {
    return {
      lunes: false, martes: false, miercoles: false,
      jueves: false, viernes: false, sabado: false, domingo: false,
      horaInicio: '', horaFin: '',
      editandoId: null
    };
  }

  /* ─────────────── Lifecycle ─────────────── */

  ngOnInit(): void {
    this.cargarLineas();
  }

  /* ─────────────── Líneas ─────────────── */

  cargarLineas(idLineaASeleccionar?: number): void {
    this.cargando = true;
    this.gestionarLineasService.listarLineas().subscribe({
      next: (lineas) => {
        this.lineas = lineas;
        this.filtrarLineas();
        const objetivo = idLineaASeleccionar
          ? lineas.find(l => l.idLinea === idLineaASeleccionar)
          : lineas[0];
        if (objetivo) this.seleccionarLinea(objetivo);
        else { this.lineaSeleccionada = null; this.rutasLinea = []; this.rutaActual = null; }
        this.cargando = false;
      },
      error: () => { this.cargando = false; alert('No se pudieron cargar las líneas.'); }
    });
  }

  filtrarLineas(): void {
    const t = this.busqueda.toLowerCase().trim();
    this.lineasFiltradas = t
      ? this.lineas.filter(l =>
          l.nombre.toLowerCase().includes(t) ||
          l.origen?.toLowerCase().includes(t) ||
          l.destino?.toLowerCase().includes(t))
      : [...this.lineas];
  }

  seleccionarLinea(linea: LineaAdmin): void {
    this.lineaSeleccionada = linea;
    this.paraderoSeleccionadoIdx = null;
    this.tipoRuta = 'ida';
    this.cargarRutasLinea(linea.idLinea);
  }

  agregarLinea(): void {
    this.gestionarLineasService.crearLinea({
      nombre: 'Nueva línea',
      idEmpresa: ID_EMPRESA_CORREDOR_AZUL
    }).subscribe({
      next: (res) => this.cargarLineas(res.idLinea),
      error: (err) => alert(err?.error?.message ?? 'No se pudo crear la línea.')
    });
  }

  guardarLinea(): void {
    if (!this.lineaSeleccionada) return;
    this.gestionarLineasService.actualizarLinea(this.lineaSeleccionada.idLinea, {
      nombre: this.lineaSeleccionada.nombre,
      idEmpresa: this.lineaSeleccionada.idEmpresa ?? ID_EMPRESA_CORREDOR_AZUL
    }).subscribe({
      next: () => { alert(`Línea "${this.lineaSeleccionada?.nombre}" guardada correctamente.`); this.cargarLineas(this.lineaSeleccionada?.idLinea); },
      error: (err) => alert(err?.error?.message ?? 'No se pudo guardar la línea.')
    });
  }

  eliminarLinea(): void {
    if (!this.lineaSeleccionada) return;
    const confirmar = confirm(`¿Eliminar definitivamente la ${this.lineaSeleccionada.nombre}?`);
    if (!confirmar) return;
    this.gestionarLineasService.eliminarLinea(this.lineaSeleccionada.idLinea).subscribe({
      next: () => this.cargarLineas(),
      error: (err) => alert(err?.error?.message ?? 'No se pudo eliminar la línea.')
    });
  }

  cancelarLinea(): void {
    this.busqueda = '';
    this.cargarLineas();
  }

  /* ─────────────── Rutas (ida / vuelta) ─────────────── */

  cargarRutasLinea(idLinea: number): void {
    this.gestionarLineasService.listarRutas(idLinea).subscribe({
      next: (rutas) => { this.rutasLinea = rutas; this.actualizarRutaActual(); },
      error: () => { this.rutasLinea = []; this.actualizarRutaActual(); }
    });
  }

  /** Cambia el toggle Ida/Vuelta y recarga lo que corresponda. */
  cambiarTipoRuta(tipo: 'ida' | 'vuelta'): void {
    this.tipoRuta = tipo;
    this.actualizarRutaActual();
  }

  private actualizarRutaActual(): void {
    this.rutaActual = this.rutasLinea.find(r => r.idaVuelta === this.tipoRuta) ?? null;
    this.paraderoSeleccionadoIdx = null;
    if (this.rutaActual) {
      this.cargarParaderos(this.rutaActual.idRuta);
      this.cargarHorarios(this.rutaActual.idRuta);
    } else {
      this.paraderos = [];
      this.horarios = [];
    }
  }

  /** Botón "Guardar Ruta": si la ruta ida/vuelta actual no existe todavía, la crea. */
  guardarRuta(): void {
    if (!this.lineaSeleccionada) return;
    if (this.rutaActual) {
      alert(`La ruta de ${this.tipoRuta} ya existe para esta línea.`);
      return;
    }
    this.gestionarLineasService.crearRuta(this.lineaSeleccionada.idLinea, { idaVuelta: this.tipoRuta }).subscribe({
      next: () => this.cargarRutasLinea(this.lineaSeleccionada!.idLinea),
      error: (err) => alert(err?.error?.message ?? 'No se pudo crear la ruta.')
    });
  }

  /** Botón "Eliminar Ruta": borra la ruta ida/vuelta actual (paraderos y horarios incluidos). */
  eliminarRuta(): void {
    if (!this.rutaActual) { alert(`No hay ruta de ${this.tipoRuta} creada todavía.`); return; }
    const confirmar = confirm(`¿Eliminar la ruta de ${this.tipoRuta} y todos sus paraderos/horarios?`);
    if (!confirmar) return;
    this.gestionarLineasService.eliminarRuta(this.rutaActual.idRuta).subscribe({
      next: () => this.cargarRutasLinea(this.lineaSeleccionada!.idLinea),
      error: (err) => alert(err?.error?.message ?? 'No se pudo eliminar la ruta.')
    });
  }

  /** Botón "Cancelar": descarta cambios locales y recarga la ruta actual desde el servidor. */
  cancelarRuta(): void {
    this.actualizarRutaActual();
  }

  /* ─────────────── Paraderos ─────────────── */

  cargarParaderos(idRuta: number): void {
    this.gestionarLineasService.listarParaderos(idRuta).subscribe({
      next: (paraderos) => this.paraderos = paraderos,
      error: () => this.paraderos = []
    });
  }

  seleccionarParadero(idx: number): void {
    this.paraderoSeleccionadoIdx = this.paraderoSeleccionadoIdx === idx ? null : idx;
  }

  /* ── Modal mapa (selección de coordenadas del paradero) ── */
  mapaModalAbierto   = false;
  mapaModalNombre    = '';
  mapaModalLat: number | null = null;
  mapaModalLng: number | null = null;
  mapaModalEditIdx: number | null = null; // null = nuevo paradero, idx = editar existente
  private mapaModalInst: any = null;
  private marcadorModal: any = null;

  abrirModalParadero(idx?: number): void {
    if (!this.rutaActual) {
      alert(`Primero crea la ruta de ${this.tipoRuta} con el botón "Guardar Ruta".`);
      return;
    }

    if (idx !== undefined) {
      const p = this.paraderos[idx];
      this.mapaModalNombre   = p.nombre;
      this.mapaModalLat      = p.latitud;
      this.mapaModalLng      = p.longitud;
      this.mapaModalEditIdx  = idx;
    } else {
      this.mapaModalNombre   = '';
      this.mapaModalLat      = null;
      this.mapaModalLng      = null;
      this.mapaModalEditIdx  = null;
    }

    this.mapaModalAbierto = true;
    setTimeout(() => this.renderizarMapaModal(), 50);
  }

  cerrarModalParadero(): void {
    this.mapaModalAbierto = false;
    if (this.mapaModalInst) { this.mapaModalInst.remove(); this.mapaModalInst = null; }
    this.marcadorModal = null;
  }

  private renderizarMapaModal(): void {
    if (this.mapaModalInst) { this.mapaModalInst.remove(); this.mapaModalInst = null; }

    const tieneCoords = this.mapaModalLat != null && this.mapaModalLng != null;
    const centro: [number, number] = tieneCoords
      ? [this.mapaModalLat as number, this.mapaModalLng as number]
      : [-12.0464, -77.0428]; // Lima, centro por defecto

    const map = L.map('mapa-paradero-modal').setView(centro, tieneCoords ? 16 : 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>, © <a href="https://carto.com">CARTO</a>',
      maxZoom: 19
    }).addTo(map);

    if (tieneCoords) {
      this.colocarPinModal(map, this.mapaModalLat as number, this.mapaModalLng as number);
    }

    map.on('click', (e: any) => {
      this.mapaModalLat = e.latlng.lat;
      this.mapaModalLng = e.latlng.lng;
      this.colocarPinModal(map, e.latlng.lat, e.latlng.lng);
    });

    this.mapaModalInst = map;
    setTimeout(() => map.invalidateSize(), 120);
  }

  private colocarPinModal(map: any, lat: number, lng: number): void {
    if (this.marcadorModal) this.marcadorModal.remove();
    this.marcadorModal = L.marker([lat, lng], { draggable: true }).addTo(map);
    this.marcadorModal.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      this.mapaModalLat = pos.lat;
      this.mapaModalLng = pos.lng;
    });
  }

  puedeGuardarParadero(): boolean {
    return !!this.mapaModalNombre.trim() && this.mapaModalLat != null && this.mapaModalLng != null;
  }

  guardarParaderoModal(): void {
    if (!this.rutaActual || !this.puedeGuardarParadero()) return;
    const lat = this.mapaModalLat as number;
    const lng = this.mapaModalLng as number;
    const idRuta = this.rutaActual.idRuta;

    if (this.mapaModalEditIdx !== null) {
      const p = this.paraderos[this.mapaModalEditIdx];
      const km = this.calcularKmPreview(this.mapaModalEditIdx, lat, lng);
      this.gestionarLineasService.editarParadero(idRuta, p.idParadero, {
        nombre: this.mapaModalNombre.trim(), direccion: p.direccion ?? '', latitud: lat, longitud: lng, km
      }).subscribe({
        next: () => { this.cargarParaderos(idRuta); this.cerrarModalParadero(); },
        error: (err) => alert(err?.error?.message ?? 'No se pudo editar el paradero.')
      });
    } else {
      const km = this.calcularKmPreview(this.paraderos.length, lat, lng);
      this.gestionarLineasService.agregarParadero(idRuta, {
        nombre: this.mapaModalNombre.trim(), direccion: '', latitud: lat, longitud: lng, km
      }).subscribe({
        next: () => { this.cargarParaderos(idRuta); this.cerrarModalParadero(); },
        error: (err) => alert(err?.error?.message ?? 'No se pudo agregar el paradero.')
      });
    }
  }

  agregarParadero(): void { this.abrirModalParadero(); }
  editarParadero(idx: number): void { this.abrirModalParadero(idx); }

  eliminarParadero(idx: number): void {
    if (!this.rutaActual) return;
    const p = this.paraderos[idx];
    const confirmar = confirm(`¿Eliminar el paradero "${p.nombre}"?`);
    if (!confirmar) return;

    this.gestionarLineasService.eliminarParadero(this.rutaActual.idRuta, p.idParadero).subscribe({
      next: () => {
        if (this.paraderoSeleccionadoIdx === idx) this.paraderoSeleccionadoIdx = null;
        this.cargarParaderos(this.rutaActual!.idRuta);
      },
      error: (err) => alert(err?.error?.message ?? 'No se pudo eliminar el paradero.')
    });
  }

  /* ─────────────── Distancias (Haversine) ─────────────── */

  private distanciaHaversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calcula el km que tendría un paradero en la posición `idx` de la lista
   * si su coordenada fuera (lat,lng) — usado antes de guardar (agregar/editar),
   * comparando contra el paradero anterior ya persistido en `this.paraderos`.
   */
  private calcularKmPreview(idx: number, lat: number, lng: number): number {
    if (idx === 0 || this.paraderos.length === 0) return 0;
    const anterior = this.paraderos[idx - 1] ?? this.paraderos[this.paraderos.length - 1];
    if (anterior.latitud == null || anterior.longitud == null) return 0;
    const base = idx === 0 ? 0 : (anterior.km ?? 0);
    return Math.round((base + this.distanciaHaversine(anterior.latitud, anterior.longitud, lat, lng)) * 100) / 100;
  }

  /* ─────────────── Drag & Drop (reordenar paraderos) ─────────────── */

  onDragStart(idx: number): void { this.dragIdx = idx; this.paraderoSeleccionadoIdx = null; }

  onDragOver(event: DragEvent, idx: number): void { event.preventDefault(); this.dragOverIdx = idx; }

  onDrop(idx: number): void {
    if (this.dragIdx === null || !this.rutaActual) return;
    if (this.dragIdx === idx) { this.dragIdx = null; this.dragOverIdx = null; return; }

    const [moved] = this.paraderos.splice(this.dragIdx, 1);
    this.paraderos.splice(idx, 0, moved);
    this.dragIdx = null; this.dragOverIdx = null; this.paraderoSeleccionadoIdx = idx;

    this.persistirOrdenYKm();
  }

  onDragEnd(): void { this.dragIdx = null; this.dragOverIdx = null; }

  /** Recalcula km en memoria con Haversine y persiste orden + km nuevos en el backend. */
  private persistirOrdenYKm(): void {
    if (!this.rutaActual) return;
    const idRuta = this.rutaActual.idRuta;

    // Recalcular km localmente según el nuevo orden
    let acumulado = 0;
    this.paraderos.forEach((p, i) => {
      if (i === 0) { p.km = 0; return; }
      const anterior = this.paraderos[i - 1];
      if (anterior.latitud != null && anterior.longitud != null && p.latitud != null && p.longitud != null) {
        acumulado += this.distanciaHaversine(anterior.latitud, anterior.longitud, p.latitud, p.longitud);
      }
      p.km = Math.round(acumulado * 100) / 100;
    });

    const idsEnOrden = this.paraderos.map(p => p.idParadero);

    this.gestionarLineasService.reordenarParaderos(idRuta, idsEnOrden).subscribe({
      next: () => {
        // El SP de reordenar solo toca el orden — persistimos el km recalculado aparte.
        this.paraderos.forEach(p => {
          this.gestionarLineasService.editarParadero(idRuta, p.idParadero, {
            nombre: p.nombre, direccion: p.direccion ?? '', latitud: p.latitud!, longitud: p.longitud!, km: p.km
          }).subscribe();
        });
      },
      error: (err) => { alert(err?.error?.message ?? 'No se pudo guardar el nuevo orden.'); this.cargarParaderos(idRuta); }
    });
  }

  /* ─────────────── Horarios ─────────────── */

  cargarHorarios(idRuta: number): void {
    this.gestionarLineasService.listarHorarios(idRuta).subscribe({
      next: (horarios) => this.horarios = horarios,
      error: () => this.horarios = []
    });
  }

  asignarHorario(): void {
    if (!this.rutaActual) {
      alert(`Primero crea la ruta de ${this.tipoRuta} con el botón "Guardar Ruta".`);
      return;
    }
    if (this.horarios.length >= 7) {
      alert('Ya tienes el máximo de 7 horarios para esta ruta.');
      return;
    }
    this.modalHorario = this.horarioVacio();
    this.mostrarModalHorario = true;
  }

  editarHorario(idx: number): void {
    const h = this.horarios[idx];
    this.modalHorario = {
      lunes: h.lunes, martes: h.martes, miercoles: h.miercoles,
      jueves: h.jueves, viernes: h.viernes, sabado: h.sabado, domingo: h.domingo,
      horaInicio: h.horaInicio, horaFin: h.horaFin,
      editandoId: h.idHorario
    };
    this.mostrarModalHorario = true;
  }

  cerrarModalHorario(): void {
    this.mostrarModalHorario = false;
    this.modalHorario = this.horarioVacio();
  }

  toggleDia(dia: keyof Pick<ModalHorario, 'lunes'|'martes'|'miercoles'|'jueves'|'viernes'|'sabado'|'domingo'>): void {
    this.modalHorario[dia] = !this.modalHorario[dia];
  }

  puedeGuardarHorario(): boolean {
    const { lunes, martes, miercoles, jueves, viernes, sabado, domingo, horaInicio, horaFin } = this.modalHorario;
    const hayDia = lunes || martes || miercoles || jueves || viernes || sabado || domingo;
    return hayDia && !!horaInicio && !!horaFin && horaInicio < horaFin;
  }

  getDiasLabel(): string {
    const dias = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'] as const;
    const labels: Record<string, string> = {
      lunes: 'Lun', martes: 'Mar', miercoles: 'Mié',
      jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom'
    };
    return dias.filter(d => this.modalHorario[d]).map(d => labels[d]).join(' · ');
  }

  /** Devuelve las abreviaturas de los días activos de un HorarioAdmin ya guardado. */
  getDiasLabelHorario(h: HorarioAdmin): string {
    const mapa: { key: keyof HorarioAdmin; label: string }[] = [
      { key: 'lunes',     label: 'Lun' },
      { key: 'martes',    label: 'Mar' },
      { key: 'miercoles', label: 'Mié' },
      { key: 'jueves',    label: 'Jue' },
      { key: 'viernes',   label: 'Vie' },
      { key: 'sabado',    label: 'Sáb' },
      { key: 'domingo',   label: 'Dom' },
    ];
    return mapa.filter(d => h[d.key]).map(d => d.label).join(' · ') || '—';
  }

  /** Solo para mostrar en pantalla — el backend recibe horaInicio/horaFin en 'HH:mm'. */
  formatHora12(time: string): string {
    if (!time) return '';
    const [hStr, mStr] = time.split(':');
    const h = parseInt(hStr, 10);
    const m = mStr;
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m} ${ampm}`;
  }

  guardarHorarioModal(): void {
    if (!this.rutaActual || !this.puedeGuardarHorario()) return;
    const idRuta = this.rutaActual.idRuta;
    const m = this.modalHorario;
    const body = {
      lunes: m.lunes, martes: m.martes, miercoles: m.miercoles,
      jueves: m.jueves, viernes: m.viernes, sabado: m.sabado, domingo: m.domingo,
      horaInicio: m.horaInicio, horaFin: m.horaFin
    };

    const obs = m.editandoId !== null
      ? this.gestionarLineasService.editarHorario(m.editandoId, body)
      : this.gestionarLineasService.asignarHorario(idRuta, body);

    obs.subscribe({
      next: () => { this.cargarHorarios(idRuta); this.cerrarModalHorario(); },
      error: (err) => alert(err?.error?.message ?? 'No se pudo guardar el horario.')
    });
  }

  eliminarHorario(idx: number): void {
    if (!this.rutaActual) return;
    const h = this.horarios[idx];
    this.gestionarLineasService.eliminarHorario(h.idHorario).subscribe({
      next: () => this.cargarHorarios(this.rutaActual!.idRuta),
      error: (err) => alert(err?.error?.message ?? 'No se pudo eliminar el horario.')
    });
  }

  /* ─────────────── Navegación ─────────────── */

  irInicio(): void { this.router.navigate(['/inicio']); }

  onLogout(): void { this.auth.cerrarSesion(); this.router.navigate(['/login']); }
}