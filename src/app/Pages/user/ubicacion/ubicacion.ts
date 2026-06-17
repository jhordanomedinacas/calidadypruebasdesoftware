import { Component, OnInit, OnDestroy, AfterViewInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

import * as L from 'leaflet';
import 'leaflet.markercluster';

import { NavbarComponent } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth';
import { VerbusesService, LineaResponse, ParaderoResponse } from '../../../services/verbuses';
import { ML_API_URL } from '../../../services/api/api';

const fadeSlideIn = trigger('fadeSlideIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(24px) scale(0.97)' }),
    animate('320ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
  ])
]);

// ── Modelo de Bus ──────────────────────────────────────────────────────────────
export interface Bus {
  id: number;
  linea: string;
  origen: string;
  destino: string;
  unidad: number;
  tiempoLlegada: number;
  distancia: number;
  duracionTotal: number;
  estado: string;
  estadoColor: string;
  estadoDot: string;
  siguiendo: boolean;
}

// ── Paradero del Corredor Azul (coordenadas reales Lima) ───────────────────────
export interface Paradero {
  id: number;
  nombre: string;
  lat: number;
  lng: number;
  lineas: string[];
}

// ── Bus simulado con estado de movimiento en el mapa ──────────────────────────
interface BusEnMapa {
  busId: number;
  label: string;
  color: string;
  rutaWaypoints: [number, number][];
  indiceActual: number;
  marker: any;
  polylineRecorrido: any | null;
  polylineRecorrida: any | null;
  origenLatLng: [number, number];
  destinoLatLng: [number, number];
  paraderoLatLngs: [number, number][];
}

// ── Tipo de paso del viaje ─────────────────────────────────────────────────────
type PasoViaje = 'acercando' | 'abordo' | 'fin';

// ── Estado GPS ─────────────────────────────────────────────────────────────────
type EstadoGps = 'inactivo' | 'cargando' | 'activo' | 'error';

// ── Estado IA ─────────────────────────────────────────────────────────────────
type EstadoIA = 'idle' | 'pensando' | 'respondido';

// ── SVG paths reutilizables ───────────────────────────────────────────────────
const SVG_BUS = `
  <rect x="2" y="4" width="20" height="14" rx="3"/>
  <path d="M5 20 L5 22M19 20 L19 22"/>
  <rect x="4" y="8" width="4" height="4" rx="0.8" fill="white" stroke="none"/>
  <rect x="16" y="8" width="4" height="4" rx="0.8" fill="white" stroke="none"/>
  <line x1="11" y1="8" x2="11" y2="12" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
  <line x1="13" y1="8" x2="13" y2="12" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>`;

const SVG_PARADERO = `
  <rect x="3" y="3" width="18" height="13" rx="3"/>
  <path d="M5 19 L5 21M19 19 L19 21" stroke-width="2"/>
  <rect x="6" y="7" width="4" height="3" rx="0.5" fill="white" stroke="none"/>
  <rect x="14" y="7" width="4" height="3" rx="0.5" fill="white" stroke="none"/>`;

const SVG_UBICACION = `
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
  <circle cx="12" cy="9" r="2.5"/>`;

@Component({
  selector: 'app-ubicacion',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './ubicacion.html',
  styleUrl: './ubicacion.css',
  animations: [fadeSlideIn]
})
export class UbicacionComponent implements OnInit, OnDestroy, AfterViewInit {

  // ── Filtros ──────────────────────────────────────────────────────────────────
  lineaSeleccionada    = '';
  origenSeleccionado   = '';
  destinoSeleccionado  = '';

  paraderosDeLineaSeleccionada: Paradero[] = [];

  // ── Datos reales de BD ───────────────────────────────────────────────────────
  lineas:       LineaResponse[] = [];
  cargandoDatos = true;

  readonly ML_API_URL = ML_API_URL;

  // ── Estado del stepper ───────────────────────────────────────────────────────
  pasoViaje: PasoViaje = 'acercando';

  // ── IA ───────────────────────────────────────────────────────────────────────
  preguntaDestino      = '';
  estadoIA: EstadoIA   = 'idle';
  respuestaIA          = '';
  paraderoDestinoIA: Paradero | null = null;

  // ── ETA ──────────────────────────────────────────────────────────────────────
  estadoETA: 'idle' | 'calculando' | 'calculado' | 'error' = 'idle';
  etaMinutos        = 0;
  etaClima          = '';
  etaTimestamp      = '';
  etaHayAccidente   = false;
  etaHayEvento      = false;
  etaHoraPunta      = false;

  // ── GPS ───────────────────────────────────────────────────────────────────────
  estadoGps: EstadoGps              = 'inactivo';
  ubicacionActual: { lat: number; lng: number } | null = null;
  paraderoMasCercano: Paradero | null = null;
  distanciaAlParadero                 = 0;

  // ── Bottom sheet ─────────────────────────────────────────────────────────────
  sheetExpanded = false;

  toggleSheet(): void {
    this.sheetExpanded = !this.sheetExpanded;
  }

  // ── Modal GPS ────────────────────────────────────────────────────────────────
  modalGpsAbierto = false;

  // ── Mapa ─────────────────────────────────────────────────────────────────────
  private mapaUnificadoInst: any = null;
  private leafletCargado         = false;
  private mapaRef: any           = null;
  private clusterParaderos: L.MarkerClusterGroup | null = null;

  // ── Simulación ───────────────────────────────────────────────────────────────
  private busesEnMapa: BusEnMapa[]                     = [];
  private intervalSimulacion: any                      = null;
  private marcadoresParaderos: { paraderoId: number; marker: any }[] = [];
  private marcadorUbicacion: any                       = null;
  private polylinePeatonal: any                        = null;

  busSiguiendo: BusEnMapa | null = null;
  etaDinamicoMinutos = 0;

  // ── Vista previa de ruta ──────────────────────────────────────────────────────
  busViendoRuta: Bus | null    = null;
  private rutaOverlayMarkers: any[] = [];
  private rutaOverlayPolyline: any  = null;

  // ── Paraderos y buses ─────────────────────────────────────────────────────────
  paraderos: Paradero[] = [];

  private configBusesSimulados: {
    busId:      number;
    label:      string;
    color:      string;
    paraderoIds: number[];
    paraderos:  Paradero[];
  }[] = [];

  private todosBuses:   Bus[] = [];
  busesFiltrados:       Bus[] = [];

  // ── Paginación ───────────────────────────────────────────────────────────────
  paginaActual   = 1;
  busesPorPagina = 4;

  get totalPaginas(): number {
    return Math.ceil(this.busesFiltrados.length / this.busesPorPagina);
  }

  get paginasVisibles(): (number | '...')[] {
    const total = this.totalPaginas;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const paginas: (number | '...')[] = [1];
    if (this.paginaActual > 3) paginas.push('...');
    for (let p = Math.max(2, this.paginaActual - 1); p <= Math.min(total - 1, this.paginaActual + 1); p++) {
      paginas.push(p);
    }
    if (this.paginaActual < total - 2) paginas.push('...');
    paginas.push(total);
    return paginas;
  }

  get busesPaginados(): Bus[] {
    const inicio = (this.paginaActual - 1) * this.busesPorPagina;
    return this.busesFiltrados.slice(inicio, inicio + this.busesPorPagina);
  }

  irAPagina(pagina: number | '...'): void { if (typeof pagina === 'number') this.paginaActual = pagina; }
  paginaAnterior(): void { if (this.paginaActual > 1) this.paginaActual--; }
  paginaSiguiente(): void { if (this.paginaActual < this.totalPaginas) this.paginaActual++; }

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private verbusesService: VerbusesService
  ) {}

  ngOnInit(): void {
    this.cargarDatosBackend();
    setTimeout(() => this.activarGPS(), 300);
  }

  ngAfterViewInit(): void {
    this.cargarLeaflet();
    setTimeout(() => { this.sheetExpanded = true; }, 800);
  }

  ngOnDestroy(): void {
    this.detenerSimulacion();
    this.cerrarVistaRuta();
    if (this.mapaUnificadoInst) {
      this.mapaUnificadoInst.remove();
      this.mapaUnificadoInst = null;
    }
    this.mapaRef = null;
  }

  // ── Navegación ───────────────────────────────────────────────────────────────
  irA(seccion: string): void { this.router.navigate([`/${seccion}`]); }
  onLogout(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }

  // ── Carga inicial desde BD ───────────────────────────────────────────────────
  private cargarDatosBackend(): void {
    this.verbusesService.obtenerLineas().subscribe({
      next: (lineas) => {
        this.lineas = lineas;

        const peticionesParaderos = lineas.map(l =>
          this.verbusesService.obtenerParaderos(l.idLinea, 'ida').toPromise()
            .then(ps => ({ linea: l, paraderos: (ps ?? []) as ParaderoResponse[] }))
            .catch(() => ({ linea: l, paraderos: [] as ParaderoResponse[] }))
        );

        Promise.all(peticionesParaderos).then(resultadosParaderos => {
          const mapaParaderos = new Map<number, Paradero>();

          for (const { linea, paraderos } of resultadosParaderos) {
            for (const p of paraderos) {
              if (p.latitud == null || p.longitud == null) continue;
              const existente = mapaParaderos.get(p.idParadero);
              if (existente) {
                if (!existente.lineas.includes(linea.nombreLinea)) {
                  existente.lineas.push(linea.nombreLinea);
                }
              } else {
                mapaParaderos.set(p.idParadero, {
                  id:     p.idParadero,
                  nombre: p.nombre,
                  lat:    p.latitud,
                  lng:    p.longitud,
                  lineas: [linea.nombreLinea]
                });
              }
            }
          }

          this.paraderos = Array.from(mapaParaderos.values());

          const peticionesBuses = lineas.map(l =>
            this.verbusesService.obtenerBuses(l.idLinea).toPromise()
              .then(bs => ({ linea: l, buses: bs ?? [] }))
              .catch(() => ({ linea: l, buses: [] }))
          );

          Promise.all(peticionesBuses).then(resultadosBuses => {
            const colores = ['#22c55e', '#f59e0b', '#ef4444', '#6366f1', '#0ea5e9'];
            let contadorId = 1;

            this.configBusesSimulados = [];

            for (const { linea, buses } of resultadosBuses) {
              const paraderosLinea = resultadosParaderos
                .find(r => r.linea.idLinea === linea.idLinea)?.paraderos
                .filter(p => p.latitud != null && p.longitud != null) ?? [];

              if (paraderosLinea.length < 2) continue;

              const origen  = paraderosLinea[0].nombre;
              const destino = paraderosLinea[paraderosLinea.length - 1].nombre;

              for (const bus of buses) {
                const id    = contadorId++;
                const color = colores[(id - 1) % colores.length];

                this.todosBuses.push({
                  id,
                  linea:         linea.nombreLinea,
                  origen,
                  destino,
                  unidad:        bus.idBus,
                  tiempoLlegada: Math.floor(Math.random() * 5) + 1,
                  distancia:     parseFloat((Math.random() * 3 + 0.5).toFixed(1)),
                  duracionTotal: Math.floor(Math.random() * 30) + 20,
                  estado:        'En movimiento',
                  estadoColor:   color,
                  estadoDot:     'green',
                  siguiendo:     false
                });

                this.configBusesSimulados.push({
                  busId:       id,
                  label:       `Bus ${bus.idBus} · ${linea.nombreLinea} · En movimiento`,
                  color,
                  paraderoIds: paraderosLinea.map(p => p.idParadero),
                  paraderos:   paraderosLinea
                    .filter(p => p.latitud != null && p.longitud != null)
                    .map(p => ({
                      id:     p.idParadero,
                      nombre: p.nombre,
                      lat:    p.latitud!,
                      lng:    p.longitud!,
                      lineas: [linea.nombreLinea]
                    }))
                });
              }
            }

            this.busesFiltrados = [...this.todosBuses];
            this.cargandoDatos  = false;
            this.cdr.detectChanges();

            if (this.estadoGps === 'activo' && this.leafletCargado) {
              setTimeout(() => this.renderizarMapaUnificado(), 50);
            }
          });
        });
      },
      error: () => {
        this.cargandoDatos = false;
        this.busesFiltrados = [];
        this.cdr.detectChanges();
      }
    });
  }

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  filtrarBuses(): void {
    if (this.lineaSeleccionada) {
      const cfg = this.configBusesSimulados.find(c => {
        const bus = this.todosBuses.find(b => b.id === c.busId);
        return bus?.linea === this.lineaSeleccionada;
      });
      this.paraderosDeLineaSeleccionada = cfg?.paraderos ?? [];
    } else {
      this.paraderosDeLineaSeleccionada = [];
    }

    this.origenSeleccionado  = '';
    this.destinoSeleccionado = '';

    this.busesFiltrados = this.todosBuses.filter(bus =>
      !this.lineaSeleccionada || bus.linea === this.lineaSeleccionada
    );
    this.paginaActual = 1;
    this.mostrarParaderos();
  }

  buscarBuses(): void {
    this.busesFiltrados = this.todosBuses.filter(bus => {
      const matchLinea   = !this.lineaSeleccionada   || bus.linea   === this.lineaSeleccionada;
      const matchOrigen  = !this.origenSeleccionado  || bus.origen  === this.origenSeleccionado;
      const matchDestino = !this.destinoSeleccionado || bus.destino === this.destinoSeleccionado;
      return matchLinea && matchOrigen && matchDestino;
    });
    this.paginaActual = 1;
    this.aplicarFiltroParaderosEnMapa();
  }

  private aplicarFiltroParaderosEnMapa(): void {
    if (!this.mapaRef) return;
    if (!this.lineaSeleccionada) { this.mostrarParaderos(); return; }

    const cfg = this.configBusesSimulados.find(c => {
      const bus = this.todosBuses.find(b => b.id === c.busId);
      return bus?.linea === this.lineaSeleccionada;
    });
    if (!cfg) { this.mostrarParaderos(); return; }

    const paraderosLinea = cfg.paraderos;
    let inicio = 0;
    let fin    = paraderosLinea.length - 1;

    if (this.origenSeleccionado) {
      const idx = paraderosLinea.findIndex(p => p.nombre === this.origenSeleccionado);
      if (idx !== -1) inicio = idx;
    }
    if (this.destinoSeleccionado) {
      const idx = paraderosLinea.findIndex(p => p.nombre === this.destinoSeleccionado);
      if (idx !== -1) fin = idx;
    }

    if (inicio > fin) [inicio, fin] = [fin, inicio];

    const idsVisibles = new Set(
      paraderosLinea.slice(inicio, fin + 1).map(p => p.id)
    );

    this.filtrarParaderosEnMapa(idsVisibles);

    if (this.mapaRef) {
      const coords = paraderosLinea.slice(inicio, fin + 1).map(p => [p.lat, p.lng] as [number, number]);
      if (coords.length > 1) {
        this.mapaRef.fitBounds(L.latLngBounds(coords), { padding: [60, 60], animate: true });
      }
    }
  }

  // ── Acciones de tarjeta ──────────────────────────────────────────────────────
  seguirBus(bus: Bus): void {
    this.todosBuses.forEach(b => b.siguiendo = false);
    bus.siguiendo  = true;
    this.pasoViaje = 'acercando';
    this.filtrarBuses();

    const busEnMapa = this.busesEnMapa.find(b => b.busId === bus.id);
    if (!busEnMapa) return;

    this.busSiguiendo = busEnMapa;

    for (const b of this.busesEnMapa) {
      b.busId !== bus.id ? this.ocultarBusEnMapa(b) : this.mostrarBusEnMapa(b);
    }

    this.ocultarParaderos();
    this.mostrarRecorridoCompleto(busEnMapa);
    this.actualizarEtaDinamico(busEnMapa);

    if (this.mapaRef && busEnMapa.rutaWaypoints.length > 1) {
      const bounds = L.latLngBounds(busEnMapa.rutaWaypoints as any);
      if (this.ubicacionActual) {
        bounds.extend([this.ubicacionActual.lat, this.ubicacionActual.lng]);
      }
      this.mapaRef.fitBounds(bounds, { padding: [60, 60], animate: true });
    }
  }

  dejarDeSeguir(): void {
    this.todosBuses.forEach(b => b.siguiendo = false);
    this.busSiguiendo = null;
    this.filtrarBuses();

    for (const b of this.busesEnMapa) {
      this.mostrarBusEnMapa(b);
      if (b.polylineRecorrido) {
        b.polylineRecorrido.setStyle({ weight: 2, opacity: 0.45 });
      }
    }

    this.mostrarParaderos();

    if (this.mapaRef && this.ubicacionActual && this.paraderoMasCercano) {
      const bounds = L.latLngBounds([
        [this.ubicacionActual.lat, this.ubicacionActual.lng],
        [this.paraderoMasCercano.lat, this.paraderoMasCercano.lng],
      ] as any);
      this.mapaRef.fitBounds(bounds, { padding: [80, 80], animate: true });
    }
  }

  // ── Ver ruta ─────────────────────────────────────────────────────────────────
  verRuta(bus: Bus): void {
    if (!this.mapaRef) return;

    if (this.busViendoRuta?.id === bus.id) {
      this.cerrarVistaRuta();
      return;
    }

    this.cerrarVistaRuta();
    this.busViendoRuta = bus;

    const cfg = this.configBusesSimulados.find(c => c.busId === bus.id);
    const paraderosOrdenados = cfg?.paraderos ?? this.paraderos.filter(p => p.lineas.includes(bus.linea));

    if (paraderosOrdenados.length === 0) return;

    this.dibujarParaderosDeRuta(paraderosOrdenados);
    this.dibujarPolylineDeRuta(paraderosOrdenados);
    this.ajustarVistaRuta();
  }

  cerrarVistaRuta(): void {
    if (!this.busViendoRuta) return;

    this.rutaOverlayMarkers.forEach(m => m.remove());
    this.rutaOverlayPolyline?.remove();

    this.rutaOverlayMarkers  = [];
    this.rutaOverlayPolyline = null;
    this.busViendoRuta       = null;
  }

  private dibujarParaderosDeRuta(paraderos: Paradero[]): void {
    paraderos.forEach((paradero, index) => {
      const esOrigen  = index === 0;
      const esDestino = index === paraderos.length - 1;
      const color     = esOrigen ? '#2366CE' : esDestino ? '#dc2626' : '#f59e0b';
      const numero    = index + 1;

      const icon = L.divIcon({
        className: '',
        html: this.buildParaderoRutaIconHtml(numero, color, paradero.nombre, esOrigen, esDestino),
        iconSize:   [28, 60],
        iconAnchor: [14, 58],
      });

      const marker = L.marker([paradero.lat, paradero.lng], { icon, zIndexOffset: 900 })
        .addTo(this.mapaRef)
        .bindTooltip(
          `<b>${paradero.nombre}</b><br>Líneas: ${paradero.lineas.join(', ')}`,
          { direction: 'top', offset: [0, -52] }
        );

      this.rutaOverlayMarkers.push(marker);
    });
  }

  private buildParaderoRutaIconHtml(
    numero: number,
    color: string,
    nombre: string,
    esOrigen: boolean,
    esDestino: boolean,
  ): string {
    const etiqueta = esOrigen ? 'Inicio' : esDestino ? 'Fin' : `Parada ${numero}`;
    return `
      <div style="display:flex;flex-direction:column;align-items:center;font-family:'Inter',sans-serif;">
        <div style="background:#fff;border:2px solid ${color};border-radius:8px;padding:3px 8px;
                    font-size:10px;font-weight:700;color:${color};white-space:nowrap;
                    box-shadow:0 2px 8px rgba(0,0,0,0.18);margin-bottom:2px;">
          ${etiqueta}
        </div>
        <div style="background:${color};color:#fff;border-radius:50%;width:26px;height:26px;
                    display:flex;align-items:center;justify-content:center;font-size:12px;
                    font-weight:800;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);">
          ${numero}
        </div>
        <div style="width:2px;height:8px;background:${color};margin-top:1px;"></div>
      </div>`;
  }

  private dibujarPolylineDeRuta(paraderos: Paradero[]): void {
    const coords = paraderos.map(p => [p.lat, p.lng] as [number, number]);

    this.rutaOverlayPolyline = L.polyline(coords, {
      color:     '#2366CE',
      weight:    3,
      opacity:   0.85,
      dashArray: '7,5',
    }).addTo(this.mapaRef);
  }

  private ajustarVistaRuta(): void {
    if (!this.rutaOverlayPolyline) return;
    this.mapaRef.fitBounds(
      this.rutaOverlayPolyline.getBounds(),
      { padding: [60, 60], animate: true, maxZoom: 15 }
    );
  }

  quitarBus(bus: Bus): void {
    if (bus.siguiendo) {
      this.pasoViaje    = 'acercando';
      this.busSiguiendo = null;
    }
    const busEnMapa = this.busesEnMapa.find(b => b.busId === bus.id);
    if (busEnMapa) this.destruirBusEnMapa(busEnMapa);
    this.busesEnMapa    = this.busesEnMapa.filter(b => b.busId !== bus.id);
    this.busesFiltrados = this.busesFiltrados.filter(b => b.id !== bus.id);
    this.todosBuses     = this.todosBuses.filter(b => b.id !== bus.id);
  }

  // ── Buscador IA ───────────────────────────────────────────────────────────────
  async consultarIA(): Promise<void> {
    const q = this.preguntaDestino.trim();
    if (!q || this.paraderos.length === 0) return;

    this.estadoIA          = 'pensando';
    this.respuestaIA       = '';
    this.paraderoDestinoIA = null;

    try {
      const response = await fetch(`${this.ML_API_URL}/ubicacion/coordenadas-destino`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: q })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: { latitud: number; longitud: number; lugar: string } = await response.json();
      const destino = { lat: data.latitud, lng: data.longitud };

      const paraderoMasCercano = this.paraderos.reduce((min, p) =>
        this.calcularDistancia(destino, { lat: p.lat, lng: p.lng }) <
        this.calcularDistancia(destino, { lat: min.lat, lng: min.lng }) ? p : min
      );

      const distancia    = this.calcularDistancia(destino, { lat: paraderoMasCercano.lat, lng: paraderoMasCercano.lng });
      const lineasTexto  = paraderoMasCercano.lineas.length > 0
        ? ` Pasan las líneas: ${paraderoMasCercano.lineas.join(', ')}.`
        : '';
      const gpsHint      = this.estadoGps === 'activo'
        ? ` Tú estás a ${this.formatearDistancia(this.calcularDistancia(
            this.ubicacionActual!,
            { lat: paraderoMasCercano.lat, lng: paraderoMasCercano.lng }
          ))} de ese paradero.`
        : ' Activa tu GPS para ver la distancia desde tu ubicación.';

      this.ngZone.run(() => {
        this.respuestaIA       = `El paradero más cercano a ${data.lugar} es ${paraderoMasCercano.nombre} (a ${this.formatearDistancia(distancia)} del destino).${lineasTexto}${gpsHint}`;
        this.paraderoDestinoIA = paraderoMasCercano;
        this.estadoIA          = 'respondido';
        this.cdr.detectChanges();
      });

    } catch {
      const fallback = this.paraderoMasCercano ?? this.paraderos[0];
      this.ngZone.run(() => {
        this.respuestaIA       = `El paradero más cercano es ${fallback.nombre}. Activa tu GPS para ver la ruta en el mapa.`;
        this.paraderoDestinoIA = fallback;
        this.estadoIA          = 'respondido';
        this.cdr.detectChanges();
      });
    }
  }

  irAlMapaConDestino(paradero: Paradero): void {
    if (this.mapaRef && this.estadoGps === 'activo') {
      this.mapaRef.flyTo([paradero.lat, paradero.lng], 16, { animate: true, duration: 1.2 });
      return;
    }

    if (this.estadoGps === 'activo' && this.ubicacionActual && this.leafletCargado) {
      this.paraderoDestinoIA = paradero;
      setTimeout(() => {
        this.renderizarMapaUnificado();
        setTimeout(() => {
          if (this.mapaRef) this.mapaRef.flyTo([paradero.lat, paradero.lng], 16, { animate: true, duration: 1.2 });
        }, 400);
      }, 100);
    }
  }

  // ── Normalización de texto (helper reutilizable) ───────────────────────────
  private normalizarTexto(s: string): string {
    return s.toLowerCase()
      .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e')
      .replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o')
      .replace(/[úùü]/g, 'u').replace(/ñ/g, 'n');
  }

  private buscarParaderoPorTexto(texto: string): Paradero {
    if (this.paraderos.length === 0) {
      return { id: 0, nombre: 'paradero más cercano', lat: 0, lng: 0, lineas: [] };
    }

    const t = this.normalizarTexto(texto);

    const match = this.paraderos.find(p => {
      const nombre     = this.normalizarTexto(p.nombre);
      const sinPrefijo = nombre.replace(/paradero\s+/g, '');
      return nombre.includes(t) || t.includes(sinPrefijo) || sinPrefijo.includes(t);
    });

    if (match) return match;
    if (this.paraderoMasCercano) return this.paraderoMasCercano;
    return this.paraderos[0];
  }

  // ── Modal GPS ─────────────────────────────────────────────────────────────────
  confirmarActivarGPS(): void {
    this.modalGpsAbierto = false;
    this.activarGPS();
  }

  omitirModalGps(): void {
    this.modalGpsAbierto = false;
  }

  cerrarModalGpsSiOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay-gps')) {
      this.omitirModalGps();
    }
  }

  // ── GPS ───────────────────────────────────────────────────────────────────────
  activarGPS(): void {
    if (!navigator.geolocation) { this.estadoGps = 'error'; return; }
    this.estadoGps = 'cargando';

    navigator.geolocation.getCurrentPosition(
      pos => this.ngZone.run(() => this.procesarUbicacion(pos.coords.latitude, pos.coords.longitude)),
      _   => this.ngZone.run(() => this.procesarUbicacion(-12.0564, -77.0428)),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  private procesarUbicacion(lat: number, lng: number): void {
    this.ubicacionActual     = { lat, lng };
    this.paraderoMasCercano  = this.calcularParaderoMasCercano(this.ubicacionActual);
    this.distanciaAlParadero = this.calcularDistancia(this.ubicacionActual, this.paraderoMasCercano);
    this.estadoGps           = 'activo';
    this.cdr.detectChanges();
    this.consultarETA();
    if (this.leafletCargado && !this.cargandoDatos) {
      setTimeout(() => this.renderizarMapaUnificado(), 50);
    }
  }

  // ── ETA ───────────────────────────────────────────────────────────────────────
  async consultarETA(): Promise<void> {
    if (!this.ubicacionActual || !this.paraderoMasCercano) return;

    this.estadoETA = 'calculando';

    const ahora     = new Date();
    const hora      = ahora.getHours();
    const diaSemana = ahora.getDay() === 0 ? 6 : ahora.getDay() - 1;
    const horaPunta = (hora >= 7 && hora <= 9) || (hora >= 17 && hora <= 19);

    this.etaHoraPunta = horaPunta;

    try {
      const response = await fetch('http://localhost:8001/predecir-eta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distancia_metros:    this.distanciaAlParadero,
          velocidad_kmh:       15,
          hora,
          dia_semana:          diaSemana,
          hay_accidente:       0,
          hay_evento_especial: 0
        })
      });

      const data = await response.json();

      this.ngZone.run(() => {
        this.etaMinutos      = data.eta_minutos;
        this.etaClima        = data.clima_usado;
        this.etaTimestamp    = new Date(data.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
        this.etaHayAccidente = false;
        this.etaHayEvento    = false;
        this.estadoETA       = 'calculado';
        this.cdr.detectChanges();
      });
    } catch {
      this.ngZone.run(() => { this.estadoETA = 'error'; this.cdr.detectChanges(); });
    }
  }

  private calcularParaderoMasCercano(pos: { lat: number; lng: number }): Paradero {
    return this.paraderos.reduce((min, p) =>
      this.calcularDistancia(pos, p) < this.calcularDistancia(pos, min) ? p : min
    );
  }

  calcularDistancia(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const R    = 6371000;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const x    = Math.sin(dLat / 2) ** 2 +
                 Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
                 Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  // ── Leaflet ───────────────────────────────────────────────────────────────────
  private cargarLeaflet(): void {
    this.leafletCargado = true;
    this.cdr.detectChanges();
    if (this.estadoGps === 'activo') this.renderizarMapaUnificado();
  }

  // ── Burbuja (helper reutilizable) ─────────────────────────────────────────────
  private crearBurbuja(
    iconSvgPath: string,
    texto: string,
    bgColor: string,
    textColor: string = '#fff',
  ): string {
    const ancho = Math.max(texto.length * 7 + 44, 100);
    return `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;pointer-events:none;">
        <div style="background:${bgColor};color:${textColor};padding:5px 10px 5px 7px;border-radius:20px;
          font-size:11.5px;font-weight:700;font-family:'Inter',sans-serif;white-space:nowrap;
          box-shadow:0 3px 12px rgba(0,0,0,0.22);display:flex;align-items:center;gap:5px;
          min-width:${ancho}px;border:1.5px solid rgba(255,255,255,0.25);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"
               stroke-linecap="round" stroke-linejoin="round">${iconSvgPath}</svg>
          ${texto}
        </div>
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style="margin-top:-1px;display:block;">
          <path d="M0 0 L6 8 L12 0 Z" fill="${bgColor}"/>
        </svg>
      </div>`;
  }

  // ── Ícono del bus (helper reutilizable) ───────────────────────────────────────
  private buildIconoBusHtml(label: string, color: string): string {
    const lineaMatch = label.match(/L(\d+)/);
    const lineaText  = lineaMatch ? `L${lineaMatch[1]}` : label.split('·')[1]?.trim() ?? '';

    return `
      <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.28));">
        <div style="background:${color};border-radius:10px;padding:5px 9px;
                    display:flex;align-items:center;gap:5px;border:2px solid rgba(255,255,255,0.7);">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"
               stroke-linecap="round" stroke-linejoin="round">${SVG_BUS}</svg>
          <span style="font-size:11px;font-weight:800;color:#fff;font-family:'Inter',sans-serif;
                       letter-spacing:0.04em;">${lineaText}</span>
        </div>
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none" style="margin-top:-1px;display:block;">
          <path d="M0 0 L4 6 L8 0 Z" fill="${color}"/>
        </svg>
      </div>`;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MAPA UNIFICADO
  // ════════════════════════════════════════════════════════════════════════════
  renderizarMapaUnificado(): void {
    const ubi = this.ubicacionActual;
    const par = this.paraderoMasCercano;
    if (!ubi || !par) return;

    this.detenerSimulacion();
    if (this.mapaUnificadoInst) {
      this.mapaUnificadoInst.remove();
      this.mapaUnificadoInst = null;
    }
    this.busesEnMapa         = [];
    this.marcadoresParaderos = [];
    this.marcadorUbicacion   = null;
    this.polylinePeatonal    = null;
    this.busSiguiendo        = null;
    this.clusterParaderos    = null;

    const map = L.map('mapa-unificado').setView([ubi.lat, ubi.lng], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>, © <a href="https://carto.com">CARTO</a>',
      maxZoom: 19
    }).addTo(map);

    this.mapaUnificadoInst = map;
    this.mapaRef = map;

    // ResizeObserver — fix mapa dormido
    const contenedorMapa = document.getElementById('mapa-unificado');
    if (contenedorMapa) {
      const ro = new ResizeObserver(() => { map.invalidateSize(); });
      ro.observe(contenedorMapa);
      setTimeout(() => ro.disconnect(), 3000);
    }
    setTimeout(() => {
      const el = document.getElementById('mapa-unificado');
      if (el) {
        map.invalidateSize();
        const rect = el.getBoundingClientRect();
        el.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2
        }));
      }
    }, 400);

    // ── Mi ubicación ─────────────────────────────────────────────────────────
    const iconoMiUbicacion = L.divIcon({
      className: '',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;">
          ${this.crearBurbuja(SVG_UBICACION, 'Mi ubicación', '#2366CE')}
          <div style="position:relative;width:18px;height:18px;margin-top:2px;">
            <div style="position:absolute;inset:0;background:rgba(35,102,206,0.25);border-radius:50%;
                        animation:pulse 1.8s ease-out infinite;"></div>
            <div style="position:absolute;inset:3px;background:#2366CE;border:2.5px solid #fff;
                        border-radius:50%;box-shadow:0 2px 6px rgba(35,102,206,0.4);"></div>
          </div>
        </div>`,
      iconSize: [160, 60],
      iconAnchor: [80, 58]
    });

    this.marcadorUbicacion = L.marker([ubi.lat, ubi.lng], { icon: iconoMiUbicacion })
      .addTo(map)
      .bindPopup(`<b>Mi ubicación</b><br>Lat: ${ubi.lat.toFixed(5)}, Lng: ${ubi.lng.toFixed(5)}`);

    // ── Paraderos (con clustering) ───────────────────────────────────────────
    this.clusterParaderos = L.markerClusterGroup({
      maxClusterRadius: 50,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 16,
      iconCreateFunction: (cluster) => L.divIcon({
        className: '',
        html: `<div style="background:#1a3a8f;color:#fff;border-radius:50%;width:36px;height:36px;
                           display:flex;align-items:center;justify-content:center;font-size:13px;
                           font-weight:800;font-family:'Inter',sans-serif;border:2.5px solid #fff;
                           box-shadow:0 2px 8px rgba(0,0,0,0.3);">${cluster.getChildCount()}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      })
    });

    for (const paradero of this.paraderos) {
      const esCercano   = paradero.id === this.paraderoMasCercano?.id;
      const esDestino   = paradero.id === this.paraderoDestinoIA?.id;
      const esRelevante = esCercano || esDestino;

      const bgColor = esDestino ? '#059669' : esCercano ? '#1a3a8f' : '#475569';
      const label   = esDestino ? `${paradero.nombre} · Destino` :
                      esCercano ? `${paradero.nombre} · Cercano` :
                      paradero.nombre;

      const iconoParadero = L.divIcon({
        className: '',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;opacity:${esRelevante ? '1' : '0.65'};">
            ${this.crearBurbuja(SVG_PARADERO, label, bgColor)}
            <div style="width:10px;height:10px;background:${bgColor};border:2px solid #fff;
                        border-radius:3px;box-shadow:0 2px 6px rgba(0,0,0,0.3);margin-top:2px;"></div>
          </div>`,
        iconSize: [200, 65],
        iconAnchor: [100, 63]
      });

      const marker = L.marker([paradero.lat, paradero.lng], { icon: iconoParadero })
        .bindPopup(`<b>${paradero.nombre}</b><br>Líneas: ${paradero.lineas.join(', ')}`);

      this.clusterParaderos.addLayer(marker);
      this.marcadoresParaderos.push({ paraderoId: paradero.id, marker });
    }

    map.addLayer(this.clusterParaderos);

    // ── Ruta peatonal + Buses simulados ───────────────────────────────────────
    this.trazarRutaPeatonal(map, ubi, par);
    this.inicializarBusesSimulados(map);
  }

  // ── Ruta peatonal ─────────────────────────────────────────────────────────────
  private trazarRutaPeatonal(map: any, ubi: { lat: number; lng: number }, par: Paradero): void {
    const fallback  = () => {
      this.polylinePeatonal = L.polyline(
        [[ubi.lat, ubi.lng], [par.lat, par.lng]],
        { color: '#2366CE', weight: 4, dashArray: '10,8', opacity: 0.9 }
      ).addTo(map);
      map.fitBounds([[ubi.lat, ubi.lng], [par.lat, par.lng]], { padding: [80, 80] });
    };

    this.fetchRutaOsrm('foot', [ubi, par])
      .then(coords => {
        if (coords.length) {
          this.polylinePeatonal = L.polyline(coords, { color: '#2366CE', weight: 4, dashArray: '10,8', opacity: 0.9 }).addTo(map);
          map.fitBounds(coords, { padding: [80, 80] });
        } else {
          fallback();
        }
      })
      .catch(fallback);
  }

  // ── OSRM helper (único punto de fetch OSRM) ───────────────────────────────────
  private async fetchRutaOsrm(
    perfil: 'foot' | 'driving',
    puntos: { lat: number; lng: number }[]
  ): Promise<[number, number][]> {
    const coordsStr = puntos.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/${perfil}/${coordsStr}?overview=full&geometries=geojson`;

    try {
      const resp   = await fetch(url);
      const data   = await resp.json();
      const coords = data.routes?.[0]?.geometry?.coordinates;
      if (coords?.length) {
        return coords.map((c: number[]) => [c[1], c[0]] as [number, number]);
      }
    } catch { /* fallback al caller */ }

    // Fallback: línea recta
    return puntos.map(p => [p.lat, p.lng] as [number, number]);
  }

  // ── Buses simulados ───────────────────────────────────────────────────────────
  private inicializarBusesSimulados(map: any): void {
    const promesas = this.configBusesSimulados.map(async cfg => {
      const paraderosDeBus = cfg.paraderos;
      if (paraderosDeBus.length < 2) return;

      const origenLatLng:  [number, number] = [paraderosDeBus[0].lat, paraderosDeBus[0].lng];
      const destinoLatLng: [number, number] = [
        paraderosDeBus[paraderosDeBus.length - 1].lat,
        paraderosDeBus[paraderosDeBus.length - 1].lng
      ];

      const waypoints     = await this.fetchRutaOsrm('driving', paraderosDeBus);
      const indiceInicial = Math.floor(waypoints.length * 0.15);
      const posInicial    = waypoints[indiceInicial];

      const iconoBus = L.divIcon({
        className: '',
        html: this.buildIconoBusHtml(cfg.label, cfg.color),
        iconSize:   [70, 36],
        iconAnchor: [35, 34]
      });

      const marker = L.marker(posInicial, { icon: iconoBus, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`<b>${cfg.label}</b>`);

      const polylineRecorrido = L.polyline(waypoints, {
        color:     cfg.color,
        weight:    2,
        dashArray: '6,5',
        opacity:   0.45,
      }).addTo(map);

      const polylineRecorrida = L.polyline(waypoints.slice(0, indiceInicial + 1), {
        color:   cfg.color,
        weight:  4,
        opacity: 0.85,
      }).addTo(map);

      const busEnMapa: BusEnMapa = {
        busId: cfg.busId,
        label: cfg.label,
        color: cfg.color,
        rutaWaypoints:   waypoints,
        indiceActual:    indiceInicial,
        marker,
        polylineRecorrido,
        polylineRecorrida,
        origenLatLng,
        destinoLatLng,
        paraderoLatLngs: paraderosDeBus.map(p => [p.lat, p.lng] as [number, number]),
      };

      this.ngZone.run(() => this.busesEnMapa.push(busEnMapa));
    });

    Promise.all(promesas).then(() => {
      this.ngZone.run(() => this.iniciarSimulacion());
    });
  }

  // ── Simulación ────────────────────────────────────────────────────────────────
  private ticksDetenido: Map<number, number> = new Map();
  private readonly RADIO_PARADERO_M          = 80;
  private readonly TICKS_PARADA_PARADERO     = 33;

  private iniciarSimulacion(): void {
    this.detenerSimulacion();
    this.intervalSimulacion = setInterval(() => {
      this.ngZone.run(() => {
        this.busesEnMapa.forEach(bus => this.procesarTickBus(bus));
        this.cdr.detectChanges();
      });
    }, 1800);
  }

  private procesarTickBus(bus: BusEnMapa): void {
    const ticksPendientes = this.ticksDetenido.get(bus.busId) ?? 0;
    if (ticksPendientes > 0) {
      this.ticksDetenido.set(bus.busId, ticksPendientes - 1);
      this.actualizarEstadoBus(bus.busId, 'En paradero', '#f59e0b', 'yellow');
      return;
    }

    bus.indiceActual++;
    if (bus.indiceActual >= bus.rutaWaypoints.length) bus.indiceActual = 0;

    const posActual = bus.rutaWaypoints[bus.indiceActual];

    if (this.detectarParadero(posActual, bus.paraderoLatLngs)) {
      this.ticksDetenido.set(bus.busId, this.TICKS_PARADA_PARADERO);
      this.actualizarEstadoBus(bus.busId, 'En paradero', '#f59e0b', 'yellow');
    } else {
      this.actualizarEstadoBus(bus.busId, 'En movimiento', '#22c55e', 'green');
    }

    bus.marker.setLatLng(posActual);
    if (bus.polylineRecorrida) {
      bus.polylineRecorrida.setLatLngs(bus.rutaWaypoints.slice(0, bus.indiceActual + 1));
    }

    if (this.busSiguiendo?.busId === bus.busId) {
      this.actualizarEtaDinamico(bus);
      this.recentrarMapaSiBusEscapa(posActual);
    }
  }

  private detectarParadero(pos: [number, number], paraderoLatLngs: [number, number][]): boolean {
    return paraderoLatLngs.some(paradero =>
      this.calcularDistancia(
        { lat: pos[0],      lng: pos[1] },
        { lat: paradero[0], lng: paradero[1] }
      ) <= this.RADIO_PARADERO_M
    );
  }

  private recentrarMapaSiBusEscapa(posActual: [number, number]): void {
    if (!this.mapaRef || !this.ubicacionActual) return;
    if (this.mapaRef.getBounds().contains(posActual)) return;

    const bounds = L.latLngBounds([posActual, [this.ubicacionActual.lat, this.ubicacionActual.lng]] as any);
    this.mapaRef.fitBounds(bounds, { padding: [70, 70], animate: true, maxZoom: 15 });
  }

  private actualizarEstadoBus(busId: number, estado: string, color: string, dot: string): void {
    const bus = this.todosBuses.find(b => b.id === busId);
    if (bus) {
      bus.estado      = estado;
      bus.estadoColor = color;
      bus.estadoDot   = dot;
    }

    const busEnMapa = this.busesEnMapa.find(b => b.busId === busId);
    if (busEnMapa) {
      busEnMapa.label = busEnMapa.label.replace(/·[^·]*$/, `· ${estado}`);
      busEnMapa.color = color;

      if (busEnMapa.marker) {
        busEnMapa.marker.setIcon(L.divIcon({
          className:  '',
          html:       this.buildIconoBusHtml(busEnMapa.label, color),
          iconSize:   [70, 36],
          iconAnchor: [35, 34]
        }));
      }
    }
  }

  private detenerSimulacion(): void {
    if (this.intervalSimulacion) {
      clearInterval(this.intervalSimulacion);
      this.intervalSimulacion = null;
    }
  }

  // ── Visibilidad de capas (helper unificado) ───────────────────────────────────
  private toggleCapasBus(bus: BusEnMapa, accion: 'mostrar' | 'ocultar' | 'destruir'): void {
    const map = this.mapaRef;
    if (!map) return;

    const capas = [bus.marker, bus.polylineRecorrido, bus.polylineRecorrida].filter(Boolean);

    for (const capa of capas) {
      if (accion === 'mostrar')  { if (!map.hasLayer(capa)) capa.addTo(map); }
      if (accion === 'ocultar')  { if (map.hasLayer(capa))  capa.remove(); }
      if (accion === 'destruir') { capa.remove(); }
    }
  }

  private ocultarBusEnMapa(bus: BusEnMapa): void  { this.toggleCapasBus(bus, 'ocultar');  }
  private mostrarBusEnMapa(bus: BusEnMapa): void   { this.toggleCapasBus(bus, 'mostrar');  }
  private destruirBusEnMapa(bus: BusEnMapa): void  { this.toggleCapasBus(bus, 'destruir'); }

  private ocultarParaderos(): void {
    const map = this.mapaRef;
    if (!map || !this.clusterParaderos) return;
    if (map.hasLayer(this.clusterParaderos)) map.removeLayer(this.clusterParaderos);
    if (this.polylinePeatonal && map.hasLayer(this.polylinePeatonal)) this.polylinePeatonal.remove();
  }

  private mostrarParaderos(): void {
    const map = this.mapaRef;
    if (!map || !this.clusterParaderos) return;
    if (!map.hasLayer(this.clusterParaderos)) map.addLayer(this.clusterParaderos);
    if (this.polylinePeatonal && !map.hasLayer(this.polylinePeatonal)) this.polylinePeatonal.addTo(map);
  }

  private filtrarParaderosEnMapa(idsVisibles: Set<number>): void {
    if (!this.clusterParaderos) return;
    this.clusterParaderos.clearLayers();
    for (const { paraderoId, marker } of this.marcadoresParaderos) {
      if (idsVisibles.has(paraderoId)) {
        this.clusterParaderos.addLayer(marker);
      }
    }
  }

  // ── Recorrido completo (seguir bus) ───────────────────────────────────────────
  private mostrarRecorridoCompleto(bus: BusEnMapa): void {
    if (!bus.polylineRecorrido) return;
    bus.polylineRecorrido.setStyle({ weight: 4, opacity: 0.35, dashArray: '8,6' });
  }

  // ── ETA dinámico ─────────────────────────────────────────────────────────────
  private actualizarEtaDinamico(bus: BusEnMapa): void {
    const waypointsRestantes = bus.rutaWaypoints.length - bus.indiceActual - 1;
    if (waypointsRestantes <= 0) {
      this.etaDinamicoMinutos = 0;
      this.pasoViaje = 'fin';
      return;
    }

    let distanciaRestante = 0;
    for (let i = bus.indiceActual; i < bus.rutaWaypoints.length - 1; i++) {
      const a = { lat: bus.rutaWaypoints[i][0],   lng: bus.rutaWaypoints[i][1] };
      const b = { lat: bus.rutaWaypoints[i+1][0], lng: bus.rutaWaypoints[i+1][1] };
      distanciaRestante += this.calcularDistancia(a, b);
    }

    const velocidadMs       = 25 / 3.6;
    this.etaDinamicoMinutos = Math.max(1, Math.round(distanciaRestante / velocidadMs / 60));

    const progreso = bus.indiceActual / bus.rutaWaypoints.length;
    if (progreso < 0.1)       this.pasoViaje = 'acercando';
    else if (progreso < 0.95) this.pasoViaje = 'abordo';
    else                      this.pasoViaje = 'fin';
  }

  // ── Utils públicos ────────────────────────────────────────────────────────────
  contarParaderosPorLinea(linea: string): number {
    return this.paraderos.filter(p => p.lineas.includes(linea)).length;
  }

  formatearDistancia(metros: number): string {
    return metros >= 1000
      ? `${(metros / 1000).toFixed(1)} km`
      : `${Math.round(metros)} m`;
  }
}