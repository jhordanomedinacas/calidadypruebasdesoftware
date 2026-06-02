import { Component, OnInit, OnDestroy, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

import { NavbarComponent } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth';

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
  id: string;
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
  rutaWaypoints: [number, number][];   // ruta completa OSRM
  indiceActual: number;                // posición actual en la ruta
  marker: any;                         // L.Marker
  polylineRecorrido: any | null;       // L.Polyline de la ruta completa (tenue)
  polylineRecorrida: any | null;       // L.Polyline del tramo ya recorrido
  origenLatLng: [number, number];
  destinoLatLng: [number, number];
  paraderoLatLngs: [number, number][]; // coords de cada paradero de su línea (para detectar paradas)
}

// ── Tipo de paso del viaje ─────────────────────────────────────────────────────
type PasoViaje = 'acercando' | 'abordo' | 'fin';

// ── Estado GPS ─────────────────────────────────────────────────────────────────
type EstadoGps = 'inactivo' | 'cargando' | 'activo' | 'error';

// ── Estado IA ─────────────────────────────────────────────────────────────────
type EstadoIA = 'idle' | 'pensando' | 'respondido';

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

  // ── Estado del stepper ───────────────────────────────────────────────────────
  pasoViaje: PasoViaje = 'acercando';

  // ── IA: pregunta de destino ──────────────────────────────────────────────────
  preguntaDestino      = '';
  estadoIA: EstadoIA   = 'idle';
  respuestaIA          = '';
  paraderoDestinoIA: Paradero | null = null;

  // ── ETA (Predicción ML) ───────────────────────────────────────────────────────
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
  modalGpsAbierto: boolean = false;

  // ── Mapa ─────────────────────────────────────────────────────────────────────
  private mapaUnificadoInst: any = null;
  private leafletCargado         = false;
  private mapaRef: any           = null;

  // ── Simulación de buses ───────────────────────────────────────────────────────
  // Buses que están siendo animados en el mapa
  private busesEnMapa: BusEnMapa[] = [];
  // Intervalo de animación (mueve todos los buses cada tick)
  private intervalSimulacion: any  = null;
  // Marcadores de paraderos en el mapa (para poder ocultarlos al seguir un bus)
  private marcadoresParaderos: any[] = [];
  // Marcador de mi ubicación
  private marcadorUbicacion: any   = null;
  // Polyline de ruta peatonal
  private polylinePeatonal: any    = null;

  // ── Bus que se está siguiendo actualmente ─────────────────────────────────────
  // null = modo normal (todos los buses visibles)
  busSiguiendo: BusEnMapa | null = null;

  // ETA dinámico del bus que se sigue
  etaDinamicoMinutos = 0;

  // ── Vista previa de ruta (Ver Ruta) ───────────────────────────────────────────
  busViendoRuta: Bus | null = null;
  private rutaOverlayMarkers: any[] = [];
  private rutaOverlayPolyline: any  = null;

  // ── Paraderos del Corredor Azul (Lima) ────────────────────────────────────────
  readonly paraderos: Paradero[] = [
    { id: 'P01', nombre: 'Paradero Barranco',      lat: -12.1480, lng: -77.0215, lineas: ['204','412'] },
    { id: 'P02', nombre: 'Paradero Miraflores',    lat: -12.1196, lng: -77.0302, lineas: ['204','301'] },
    { id: 'P03', nombre: 'Paradero Surco',         lat: -12.1494, lng: -76.9997, lineas: ['301'] },
    { id: 'P04', nombre: 'Paradero San Isidro',    lat: -12.0972, lng: -77.0364, lineas: ['204'] },
    { id: 'P05', nombre: 'Paradero Lince',         lat: -12.0838, lng: -77.0368, lineas: ['204','301'] },
    { id: 'P06', nombre: 'Paradero Breña',         lat: -12.0601, lng: -77.0490, lineas: ['204'] },
    { id: 'P07', nombre: 'Paradero Centro Lima',   lat: -12.0464, lng: -77.0428, lineas: ['204','301','412'] },
    { id: 'P08', nombre: 'Paradero Rímac',         lat: -12.0352, lng: -77.0312, lineas: ['204'] },
    { id: 'P09', nombre: 'Paradero Independencia', lat: -12.0082, lng: -77.0530, lineas: ['204','412'] },
    { id: 'P10', nombre: 'Paradero Comas',         lat: -11.9333, lng: -77.0500, lineas: ['204'] },
  ];

  // ── Datos de rutas de cada bus simulado ───────────────────────────────────────
  // paraderoIds define la secuencia completa de paraderos que recorre el bus.
  // OSRM recibirá todos como waypoints para que la ruta pase por cada uno.
  private readonly CONFIG_BUSES = [
    {
      busId:      1,
      label:      'Bus 47 · L204 · En movimiento',
      color:      '#22c55e',
      paraderoIds: ['P01','P02','P04','P05','P06','P07','P08','P09','P10'],
    },
    {
      busId:      2,
      label:      'Bus 12 · L204 · Detenido',
      color:      '#f59e0b',
      paraderoIds: ['P02','P04','P05','P06','P07','P08','P09','P10'],
    },
    {
      busId:      3,
      label:      'Bus 47 · L301 · Demorado',
      color:      '#ef4444',
      paraderoIds: ['P03','P05','P07'],
    },
  ];

  // ── Datos de buses (cards) ───────────────────────────────────────────────────
  private todosBuses: Bus[] = [
    { id: 1, linea: '204', origen: 'Barranco',   destino: 'Comas',       unidad: 47, tiempoLlegada: 1, distancia: 1.5, duracionTotal: 45, estado: 'En movimiento', estadoColor: '#22c55e', estadoDot: 'green',  siguiendo: false },
    { id: 2, linea: '204', origen: 'Miraflores', destino: 'Comas',       unidad: 12, tiempoLlegada: 3, distancia: 2.8, duracionTotal: 48, estado: 'Detenido',      estadoColor: '#f59e0b', estadoDot: 'yellow', siguiendo: false },
    { id: 3, linea: '301', origen: 'Surco',      destino: 'Centro Lima', unidad: 47, tiempoLlegada: 2, distancia: 1.9, duracionTotal: 32, estado: 'Demorado',      estadoColor: '#ef4444', estadoDot: 'red',    siguiendo: false },
    { id: 4, linea: '412', origen: 'Barranco',   destino: 'Comas',       unidad: 47, tiempoLlegada: 2, distancia: 1.9, duracionTotal: 32, estado: 'Demorado',      estadoColor: '#ef4444', estadoDot: 'red',    siguiendo: false },
  ];

  busesFiltrados: Bus[] = [];

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

  constructor(private router: Router, private ngZone: NgZone, private auth: AuthService) {}

  ngOnInit(): void {
    this.busesFiltrados = [...this.todosBuses];
    // Activar GPS automáticamente al cargar la vista
    setTimeout(() => this.activarGPS(), 300);
  }

  ngAfterViewInit(): void {
    this.cargarLeaflet();
    // Auto-expand el bottom sheet al cargar
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
    this.router.navigate(['/login']); }

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  filtrarBuses(): void {
    this.busesFiltrados = this.todosBuses.filter(bus => {
      const matchLinea   = !this.lineaSeleccionada   || bus.linea === this.lineaSeleccionada;
      const matchOrigen  = !this.origenSeleccionado  || bus.origen.toLowerCase()  === this.origenSeleccionado;
      const matchDestino = !this.destinoSeleccionado || bus.destino.toLowerCase() === this.destinoSeleccionado;
      return matchLinea && matchOrigen && matchDestino;
    });
    this.paginaActual = 1;
  }

  buscarBuses(): void { this.filtrarBuses(); }

  // ── Acciones de tarjeta ──────────────────────────────────────────────────────

  /**
   * Seguir un bus:
   * - Marca ese bus como "siguiendo" en las cards
   * - En el mapa: oculta todos los otros buses y paraderos
   * - Muestra el recorrido completo del bus seguido (origen → destino)
   * - El mapa hace zoom/fit sobre ese bus y su ruta
   */
  seguirBus(bus: Bus): void {
    this.todosBuses.forEach(b => b.siguiendo = false);
    bus.siguiendo  = true;
    this.pasoViaje = 'acercando';
    this.filtrarBuses();

    // Encontrar el BusEnMapa correspondiente
    const busEnMapa = this.busesEnMapa.find(b => b.busId === bus.id);
    if (!busEnMapa) return;

    this.busSiguiendo = busEnMapa;

    // Ocultar todos los buses que NO son el seguido
    for (const b of this.busesEnMapa) {
      if (b.busId !== bus.id) {
        this.ocultarBusEnMapa(b);
      } else {
        this.mostrarBusEnMapa(b);
      }
    }

    // Ocultar paraderos que no pertenecen a la línea del bus seguido
    // (o simplemente ocultarlos todos para foco total)
    this.ocultarParaderos();

    // Mostrar la ruta completa del bus seguido con línea destacada
    this.mostrarRecorridoCompleto(busEnMapa);

    // Calcular ETA dinámico inicial
    this.actualizarEtaDinamico(busEnMapa);

    // Ajustar el mapa para que muestre toda la ruta del bus + mi ubicación
    if (this.mapaRef && busEnMapa.rutaWaypoints.length > 1) {
      const L      = (window as any).L;
      const bounds = L.latLngBounds(busEnMapa.rutaWaypoints);
      // Extender los bounds para incluir siempre la ubicación del usuario
      if (this.ubicacionActual) {
        bounds.extend([this.ubicacionActual.lat, this.ubicacionActual.lng]);
      }
      this.mapaRef.fitBounds(bounds, { padding: [60, 60], animate: true });
    }
  }

  /**
   * Dejar de seguir: vuelve al modo normal (todos los buses visibles)
   */
  dejarDeSeguir(): void {
    this.todosBuses.forEach(b => b.siguiendo = false);
    this.busSiguiendo = null;
    this.filtrarBuses();

    // Mostrar todos los buses de nuevo
    for (const b of this.busesEnMapa) {
      this.mostrarBusEnMapa(b);
      // Quitar la polyline de recorrido completo destacado
      if (b.polylineRecorrido) {
        b.polylineRecorrido.setStyle({ weight: 2, opacity: 0.45 });
      }
    }

    // Restaurar paraderos
    this.mostrarParaderos();

    // Volver al fit de la ubicación actual
    if (this.mapaRef && this.ubicacionActual && this.paraderoMasCercano) {
      const L = (window as any).L;
      const bounds = L.latLngBounds([
        [this.ubicacionActual.lat, this.ubicacionActual.lng],
        [this.paraderoMasCercano.lat, this.paraderoMasCercano.lng],
      ]);
      this.mapaRef.fitBounds(bounds, { padding: [80, 80], animate: true });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VER RUTA — muestra los paraderos de la línea y la ruta en el mapa
  // ─────────────────────────────────────────────────────────────────────────────
  verRuta(bus: Bus): void {
    if (!this.mapaRef) return;

    // Si ya se estaba viendo la ruta del mismo bus, cerrarla (toggle)
    if (this.busViendoRuta?.id === bus.id) {
      this.cerrarVistaRuta();
      return;
    }

    this.cerrarVistaRuta();
    this.busViendoRuta = bus;

    const paraderosDeLinea = this.paraderos.filter(p => p.lineas.includes(bus.linea));
    if (paraderosDeLinea.length === 0) return;

    this.dibujarParaderosDeRuta(paraderosDeLinea);
    this.dibujarPolylineDeRuta(paraderosDeLinea);
    this.ajustarVistaRuta();
  }

  cerrarVistaRuta(): void {
    if (!this.busViendoRuta) return;

    this.rutaOverlayMarkers.forEach(m => m.remove());
    this.rutaOverlayPolyline?.remove();

    this.rutaOverlayMarkers  = [];
    this.rutaOverlayPolyline = null;
    this.busViendoRuta        = null;
  }

  private dibujarParaderosDeRuta(paraderos: Paradero[]): void {
    const L = (window as any).L;

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
    const L      = (window as any).L;
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
      this.pasoViaje   = 'acercando';
      this.busSiguiendo = null;
    }
    // Remover del mapa
    const busEnMapa = this.busesEnMapa.find(b => b.busId === bus.id);
    if (busEnMapa) this.destruirBusEnMapa(busEnMapa);
    this.busesEnMapa     = this.busesEnMapa.filter(b => b.busId !== bus.id);
    this.busesFiltrados  = this.busesFiltrados.filter(b => b.id !== bus.id);
    this.todosBuses      = this.todosBuses.filter(b => b.id !== bus.id);
  }

  // ── IA ────────────────────────────────────────────────────────────────────────
  async consultarIA(): Promise<void> {
    const q = this.preguntaDestino.trim();
    if (!q) return;

    this.estadoIA          = 'pensando';
    this.respuestaIA       = '';
    this.paraderoDestinoIA = null;

    const paraderoDestino = this.buscarParaderoPorTexto(q);

    try {
      const systemPrompt = `Eres el asistente de navegación del Corredor Azul de Lima, Perú.
Tu rol es ayudar a los pasajeros a encontrar su paradero más cercano.
Responde siempre en español, de forma amigable y concisa (máximo 3 oraciones).
No uses markdown.
Lista de paraderos disponibles: ${this.paraderos.map(p => p.nombre).join(', ')}.`;

      const userMsg = `El usuario preguntó: "${q}".
El paradero más cercano a ese destino es: ${paraderoDestino.nombre}.
${this.ubicacionActual
  ? `La ubicación actual del usuario es aproximadamente lat ${this.ubicacionActual.lat.toFixed(4)}, lng ${this.ubicacionActual.lng.toFixed(4)}.`
  : 'El usuario aún no ha activado su GPS.'
}
Responde mencionando el paradero destino y pídele que active el GPS si aún no lo hizo.`;

      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMsg }]
        })
      });

      const data  = await response.json();
      const texto = data.content?.find((b: any) => b.type === 'text')?.text ?? '';

      this.ngZone.run(() => {
        this.respuestaIA       = texto || `El paradero más cercano a tu destino es ${paraderoDestino.nombre}. Activa tu GPS para ver la ruta en el mapa.`;
        this.paraderoDestinoIA = paraderoDestino;
        this.estadoIA          = 'respondido';
      });
    } catch {
      this.ngZone.run(() => {
        this.respuestaIA       = `El paradero más cercano a tu destino es ${paraderoDestino.nombre}. Activa tu GPS para ver la ruta en el mapa interactivo.`;
        this.paraderoDestinoIA = paraderoDestino;
        this.estadoIA          = 'respondido';
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

  private buscarParaderoPorTexto(texto: string): Paradero {
    const t     = texto.toLowerCase();
    const match = this.paraderos.find(p =>
      p.nombre.toLowerCase().includes(t) ||
      t.includes(p.nombre.toLowerCase().replace('paradero ', ''))
    );
    return match ?? this.paraderos[Math.floor(Math.random() * this.paraderos.length)];
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
    this.consultarETA();
    // El div #mapa-unificado siempre está en el DOM, solo esperamos
    // un tick para que Leaflet ya esté cargado
    if (this.leafletCargado) {
      setTimeout(() => this.renderizarMapaUnificado(), 50);
    }
    // Si Leaflet aún no cargó, cargarLeaflet() lo inicializará al terminar
  }

  // ── ETA (Modelo ML FastAPI) ────────────────────────────────────────────────────
  async consultarETA(): Promise<void> {
    if (!this.ubicacionActual || !this.paraderoMasCercano) return;

    this.estadoETA = 'calculando';

    const ahora      = new Date();
    const hora       = ahora.getHours();
    const diaSemana  = ahora.getDay() === 0 ? 6 : ahora.getDay() - 1;
    const horaPunta  = (hora >= 7 && hora <= 9) || (hora >= 17 && hora <= 19);

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
      });
    } catch {
      this.ngZone.run(() => { this.estadoETA = 'error'; });
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

  // ── Cargar Leaflet ────────────────────────────────────────────────────────────
  private cargarLeaflet(): void {
    if ((window as any).L) { this.leafletCargado = true; return; }

    const link  = document.createElement('link');
    link.rel    = 'stylesheet';
    link.href   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script    = document.createElement('script');
    script.src      = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload   = () => this.ngZone.run(() => {
      this.leafletCargado = true;
      if (this.estadoGps === 'activo') this.renderizarMapaUnificado();
    });
    document.head.appendChild(script);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ESPERAR A QUE EL DIV DEL MAPA EXISTA EN EL DOM (via MutationObserver)
  // Esto resuelve el mapa en blanco causado por *ngIf que aún no renderizó
  // ════════════════════════════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════════════════════════════
  // MAPA UNIFICADO
  // ════════════════════════════════════════════════════════════════════════════
  renderizarMapaUnificado(): void {
    const L   = (window as any).L;
    const ubi = this.ubicacionActual;
    const par = this.paraderoMasCercano;
    if (!L || !ubi || !par) return;

    // Destruir instancia previa y limpiar estado de simulación
    this.detenerSimulacion();
    if (this.mapaUnificadoInst) {
      this.mapaUnificadoInst.remove();
      this.mapaUnificadoInst = null;
    }
    this.busesEnMapa           = [];
    this.marcadoresParaderos   = [];
    this.marcadorUbicacion     = null;
    this.polylinePeatonal      = null;
    this.busSiguiendo          = null;

    // ── Crear mapa ────────────────────────────────────────────────────────────
    const map = L.map('mapa-unificado').setView([ubi.lat, ubi.lng], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>, © <a href="https://carto.com">CARTO</a>',
      maxZoom: 19
    }).addTo(map);

    this.mapaUnificadoInst = map;
    this.mapaRef = map;

    // ResizeObserver: detecta cuando el contenedor realmente tiene tamaño
    // y llama invalidateSize — fix para el mapa "dormido" al entrar
    const contenedorMapa = document.getElementById('mapa-unificado');
    if (contenedorMapa) {
      const ro = new ResizeObserver(() => { map.invalidateSize(); });
      ro.observe(contenedorMapa);
      setTimeout(() => ro.disconnect(), 3000); // desconectar tras 3s
    }
    // Simular click en el centro del mapa para que Leaflet se active sin interacción del usuario
    setTimeout(() => {
      const el = document.getElementById('mapa-unificado');
      if (el) {
        map.invalidateSize();
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: cx, clientY: cy }));
      }
    }, 400);

    // ── Helper SVG burbuja ────────────────────────────────────────────────────
    const crearBurbuja = (
      iconSvgPath: string,
      texto: string,
      bgColor: string,
      textColor: string = '#fff',
    ): string => {
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
    };

    // ── 1. Mi ubicación ───────────────────────────────────────────────────────
    const iconoMiUbicacion = L.divIcon({
      className: '',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;">
          ${crearBurbuja(
            `<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
             <circle cx="12" cy="9" r="2.5"/>`,
            'Mi ubicación', '#2366CE'
          )}
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

    // ── 2. Paraderos ──────────────────────────────────────────────────────────
    const iconSvgParadero = `
      <rect x="3" y="3" width="18" height="13" rx="3"/>
      <path d="M5 19 L5 21M19 19 L19 21" stroke-width="2"/>
      <rect x="6" y="7" width="4" height="3" rx="0.5" fill="white" stroke="none"/>
      <rect x="14" y="7" width="4" height="3" rx="0.5" fill="white" stroke="none"/>`;

    for (const paradero of this.paraderos) {
      const esCercano   = paradero.id === this.paraderoMasCercano?.id;
      const esDestino   = paradero.id === this.paraderoDestinoIA?.id;
      const esRelevante = esCercano || esDestino;

      const bgColor = esDestino ? '#059669' : esCercano ? '#1a3a8f' : '#475569';
      const label   = esDestino  ? `${paradero.nombre} · Destino` :
                      esCercano  ? `${paradero.nombre} · Cercano` :
                      paradero.nombre;

      const iconoParadero = L.divIcon({
        className: '',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;opacity:${esRelevante ? '1' : '0.65'};">
            ${crearBurbuja(iconSvgParadero, label, bgColor)}
            <div style="width:10px;height:10px;background:${bgColor};border:2px solid #fff;
                        border-radius:3px;box-shadow:0 2px 6px rgba(0,0,0,0.3);margin-top:2px;"></div>
          </div>`,
        iconSize: [200, 65],
        iconAnchor: [100, 63]
      });

      const marker = L.marker([paradero.lat, paradero.lng], { icon: iconoParadero })
        .addTo(map)
        .bindPopup(`<b>${paradero.nombre}</b><br>Líneas: ${paradero.lineas.join(', ')}`);

      this.marcadoresParaderos.push(marker);
    }

    // ── 3. Ruta peatonal (mi ubicación → paradero más cercano) ────────────────
    this.trazarRutaPeatonal(map, ubi, par);

    // ── 4. Iniciar buses simulados con rutas reales (OSRM) ────────────────────
    this.inicializarBusesSimulados(map, crearBurbuja);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RUTA PEATONAL
  // ─────────────────────────────────────────────────────────────────────────────
  private trazarRutaPeatonal(map: any, ubi: {lat:number;lng:number}, par: Paradero): void {
    const L = (window as any).L;
    const url = `https://router.project-osrm.org/route/v1/foot/${ubi.lng},${ubi.lat};${par.lng},${par.lat}?overview=full&geometries=geojson`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        const coords = data.routes?.[0]?.geometry?.coordinates?.map((c: number[]) => [c[1], c[0]]);
        if (coords?.length) {
          this.polylinePeatonal = L.polyline(coords, { color: '#2366CE', weight: 4, dashArray: '10,8', opacity: 0.9 }).addTo(map);
          map.fitBounds(coords, { padding: [80, 80] });
        } else {
          this.polylinePeatonal = L.polyline([[ubi.lat, ubi.lng], [par.lat, par.lng]], { color: '#2366CE', weight: 4, dashArray: '10,8', opacity: 0.9 }).addTo(map);
          map.fitBounds([[ubi.lat, ubi.lng], [par.lat, par.lng]], { padding: [80, 80] });
        }
      })
      .catch(() => {
        const L2 = (window as any).L;
        this.polylinePeatonal = L2.polyline([[ubi.lat, ubi.lng], [par.lat, par.lng]], { color: '#2366CE', weight: 4, dashArray: '10,8', opacity: 0.9 }).addTo(map);
        map.fitBounds([[ubi.lat, ubi.lng], [par.lat, par.lng]], { padding: [80, 80] });
      });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INICIALIZAR BUSES SIMULADOS
  // Obtiene la ruta OSRM pasando por TODOS los paraderos de la línea en orden.
  // El bus empieza en un ~15% del recorrido para que se vea en movimiento
  // desde el primer frame.
  // ─────────────────────────────────────────────────────────────────────────────
  private inicializarBusesSimulados(map: any, crearBurbuja: Function): void {
    const L = (window as any).L;

    const iconSvgBus = `
      <rect x="2" y="4" width="20" height="14" rx="3"/>
      <path d="M5 20 L5 22M19 20 L19 22"/>
      <rect x="4" y="8" width="4" height="4" rx="0.8" fill="white" stroke="none"/>
      <rect x="16" y="8" width="4" height="4" rx="0.8" fill="white" stroke="none"/>
      <line x1="11" y1="8" x2="11" y2="12" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
      <line x1="13" y1="8" x2="13" y2="12" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>`;

    const promesas = this.CONFIG_BUSES.map(async cfg => {
      const paraderosDeBus = cfg.paraderoIds
        .map(id => this.paraderos.find(p => p.id === id))
        .filter((p): p is Paradero => !!p);

      if (paraderosDeBus.length < 2) return;

      const origenLatLng:  [number, number] = [paraderosDeBus[0].lat,  paraderosDeBus[0].lng];
      const destinoLatLng: [number, number] = [paraderosDeBus[paraderosDeBus.length - 1].lat,
                                               paraderosDeBus[paraderosDeBus.length - 1].lng];

      const waypoints = await this.obtenerRutaOsrmMultiParadero(paraderosDeBus);

      const indiceInicial = Math.floor(waypoints.length * 0.15);
      const posInicial    = waypoints[indiceInicial];
      const iconoBus      = this.crearIconoBus(L, iconSvgBus, cfg.label, cfg.color, crearBurbuja as any);

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

  // ─────────────────────────────────────────────────────────────────────────────
  // OSRM MULTI-PARADERO
  // Construye la URL con todos los paraderos como waypoints y devuelve los
  // coords decodificados. Si OSRM falla, hace fallback a línea recta entre
  // paraderos consecutivos.
  // ─────────────────────────────────────────────────────────────────────────────
  private async obtenerRutaOsrmMultiParadero(paraderos: Paradero[]): Promise<[number, number][]> {
    const coordsStr = paraderos.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;

    try {
      const resp   = await fetch(url);
      const data   = await resp.json();
      const coords = data.routes?.[0]?.geometry?.coordinates;

      if (coords?.length) {
        return coords.map((c: number[]) => [c[1], c[0]] as [number, number]);
      }
    } catch { /* fallback abajo */ }

    // Fallback: línea recta entre cada par de paraderos consecutivos
    return paraderos.map(p => [p.lat, p.lng] as [number, number]);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CREAR ÍCONO SVG DEL BUS — badge compacto
  // ─────────────────────────────────────────────────────────────────────────────
  private crearIconoBus(L: any, iconSvgBus: string, label: string, color: string, _crearBurbuja: (a:string,b:string,c:string)=>string): any {
    // Extraer "L204", "L301", etc. del label para mostrarlo en el badge
    const lineaMatch = label.match(/L(\d+)/);
    const lineaText  = lineaMatch ? `L${lineaMatch[1]}` : label.split('·')[1]?.trim() ?? '';

    return L.divIcon({
      className: '',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.28));">
          <div style="background:${color};border-radius:10px;padding:5px 9px;
                      display:flex;align-items:center;gap:5px;border:2px solid rgba(255,255,255,0.7);">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"
                 stroke-linecap="round" stroke-linejoin="round">${iconSvgBus}</svg>
            <span style="font-size:11px;font-weight:800;color:#fff;font-family:'Inter',sans-serif;
                         letter-spacing:0.04em;">${lineaText}</span>
          </div>
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none" style="margin-top:-1px;display:block;">
            <path d="M0 0 L4 6 L8 0 Z" fill="${color}"/>
          </svg>
        </div>`,
      iconSize: [70, 36],
      iconAnchor: [35, 34]
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SIMULACIÓN — tick cada 1.8 segundos
  // Avanza cada bus 1 waypoint por tick.
  // Al llegar a un paradero hace una parada de ~33 ticks (≈ 1 minuto real).
  // Cuando llega al destino, reinicia desde el origen (loop).
  // ─────────────────────────────────────────────────────────────────────────────

  // Ticks restantes de parada por busId. Solo se usa cuando el bus está en paradero.
  private ticksDetenido: Map<number, number> = new Map();

  // Radio en metros para considerar que el bus "llegó" a un paradero
  private readonly RADIO_PARADERO_M = 80;

  // Ticks de parada en paradero (1.8s × 33 ≈ 60s)
  private readonly TICKS_PARADA_PARADERO = 33;

  private iniciarSimulacion(): void {
    this.detenerSimulacion();

    this.intervalSimulacion = setInterval(() => {
      this.ngZone.run(() => {
        for (const bus of this.busesEnMapa) {
          this.procesarTickBus(bus);
        }
      });
    }, 1800);
  }

  private procesarTickBus(bus: BusEnMapa): void {
    // ── Si está haciendo parada, descontar tick y no avanzar ─────────────────
    const ticksPendientes = this.ticksDetenido.get(bus.busId) ?? 0;
    if (ticksPendientes > 0) {
      this.ticksDetenido.set(bus.busId, ticksPendientes - 1);
      this.actualizarEstadoBus(bus.busId, 'En paradero', '#f59e0b', 'yellow');
      return;
    }

    // ── Avanzar al siguiente waypoint ────────────────────────────────────────
    bus.indiceActual++;

    if (bus.indiceActual >= bus.rutaWaypoints.length) {
      bus.indiceActual = 0; // loop: vuelve al origen
    }

    const posActual = bus.rutaWaypoints[bus.indiceActual];

    // ── Detectar si llegó a un paradero ──────────────────────────────────────
    const estaEnParadero = this.detectarParadero(posActual, bus.paraderoLatLngs);
    if (estaEnParadero) {
      this.ticksDetenido.set(bus.busId, this.TICKS_PARADA_PARADERO);
      this.actualizarEstadoBus(bus.busId, 'En paradero', '#f59e0b', 'yellow');
    } else {
      this.actualizarEstadoBus(bus.busId, 'En movimiento', '#22c55e', 'green');
    }

    // ── Mover marcador y actualizar polyline recorrida ───────────────────────
    bus.marker.setLatLng(posActual);

    if (bus.polylineRecorrida) {
      bus.polylineRecorrida.setLatLngs(
        bus.rutaWaypoints.slice(0, bus.indiceActual + 1)
      );
    }

    // ── Actualizar ETA si este bus está siendo seguido ───────────────────────
    if (this.busSiguiendo?.busId === bus.busId) {
      this.actualizarEtaDinamico(bus);
      this.recentrarMapaSiBusEscapa(posActual);
    }
  }

  // Retorna true si posActual está dentro del radio de algún paradero de la línea
  private detectarParadero(
    pos: [number, number],
    paraderoLatLngs: [number, number][]
  ): boolean {
    return paraderoLatLngs.some(paradero => {
      const distancia = this.calcularDistancia(
        { lat: pos[0],      lng: pos[1] },
        { lat: paradero[0], lng: paradero[1] }
      );
      return distancia <= this.RADIO_PARADERO_M;
    });
  }

  private recentrarMapaSiBusEscapa(posActual: [number, number]): void {
    if (!this.mapaRef || !this.ubicacionActual) return;
    if (this.mapaRef.getBounds().contains(posActual)) return;

    const L      = (window as any).L;
    const bounds = L.latLngBounds([
      posActual,
      [this.ubicacionActual.lat, this.ubicacionActual.lng],
    ]);
    this.mapaRef.fitBounds(bounds, { padding: [70, 70], animate: true, maxZoom: 15 });
  }

  // Sincroniza estado de la card con el estado real del bus en el mapa
  private actualizarEstadoBus(busId: number, estado: string, color: string, dot: string): void {
    const bus = this.todosBuses.find(b => b.id === busId);
    if (bus) {
      bus.estado      = estado;
      bus.estadoColor = color;
      bus.estadoDot   = dot;
    }
    // Actualizar label y color del marcador en el mapa
    const busEnMapa = this.busesEnMapa.find(b => b.busId === busId);
    if (busEnMapa) {
      busEnMapa.label = busEnMapa.label.replace(/·[^·]*$/, `· ${estado}`);
      busEnMapa.color = color;
      // Refrescar el ícono del marcador con el nuevo color
      const L = (window as any).L;
      if (L && busEnMapa.marker) {
        const lineaMatch = busEnMapa.label.match(/L(\d+)/);
        const lineaText  = lineaMatch ? `L${lineaMatch[1]}` : '';
        const iconSvgBus = `
          <rect x="2" y="4" width="20" height="14" rx="3"/>
          <path d="M5 20 L5 22M19 20 L19 22"/>
          <rect x="4" y="8" width="4" height="4" rx="0.8" fill="white" stroke="none"/>
          <rect x="16" y="8" width="4" height="4" rx="0.8" fill="white" stroke="none"/>`;
        const nuevoIcono = L.divIcon({
          className: '',
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.28));">
              <div style="background:${color};border-radius:10px;padding:5px 9px;
                          display:flex;align-items:center;gap:5px;border:2px solid rgba(255,255,255,0.7);">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"
                     stroke-linecap="round" stroke-linejoin="round">${iconSvgBus}</svg>
                <span style="font-size:11px;font-weight:800;color:#fff;font-family:'Inter',sans-serif;
                             letter-spacing:0.04em;">${lineaText}</span>
              </div>
              <svg width="8" height="6" viewBox="0 0 8 6" fill="none" style="margin-top:-1px;display:block;">
                <path d="M0 0 L4 6 L8 0 Z" fill="${color}"/>
              </svg>
            </div>`,
          iconSize: [70, 36],
          iconAnchor: [35, 34]
        });
        busEnMapa.marker.setIcon(nuevoIcono);
      }
    }
  }

  private detenerSimulacion(): void {
    if (this.intervalSimulacion) {
      clearInterval(this.intervalSimulacion);
      this.intervalSimulacion = null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MOSTRAR / OCULTAR BUSES Y PARADEROS
  // ─────────────────────────────────────────────────────────────────────────────
  private ocultarBusEnMapa(bus: BusEnMapa): void {
    const map = this.mapaRef;
    if (!map) return;
    if (bus.marker        && map.hasLayer(bus.marker))          bus.marker.remove();
    if (bus.polylineRecorrido && map.hasLayer(bus.polylineRecorrido)) bus.polylineRecorrido.remove();
    if (bus.polylineRecorrida && map.hasLayer(bus.polylineRecorrida)) bus.polylineRecorrida.remove();
  }

  private mostrarBusEnMapa(bus: BusEnMapa): void {
    const map = this.mapaRef;
    if (!map) return;
    if (bus.marker        && !map.hasLayer(bus.marker))          bus.marker.addTo(map);
    if (bus.polylineRecorrido && !map.hasLayer(bus.polylineRecorrido)) bus.polylineRecorrido.addTo(map);
    if (bus.polylineRecorrida && !map.hasLayer(bus.polylineRecorrida)) bus.polylineRecorrida.addTo(map);
  }

  private destruirBusEnMapa(bus: BusEnMapa): void {
    const map = this.mapaRef;
    if (!map) return;
    if (bus.marker)           { bus.marker.remove(); }
    if (bus.polylineRecorrido){ bus.polylineRecorrido.remove(); }
    if (bus.polylineRecorrida){ bus.polylineRecorrida.remove(); }
  }

  private ocultarParaderos(): void {
    const map = this.mapaRef;
    if (!map) return;
    for (const m of this.marcadoresParaderos) {
      if (map.hasLayer(m)) m.remove();
    }
    if (this.polylinePeatonal && map.hasLayer(this.polylinePeatonal)) {
      this.polylinePeatonal.remove();
    }
  }

  private mostrarParaderos(): void {
    const map = this.mapaRef;
    if (!map) return;
    for (const m of this.marcadoresParaderos) {
      if (!map.hasLayer(m)) m.addTo(map);
    }
    if (this.polylinePeatonal && !map.hasLayer(this.polylinePeatonal)) {
      this.polylinePeatonal.addTo(map);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RECORRIDO COMPLETO — al seguir un bus
  // Destaca la polyline del recorrido completo con mayor peso/opacidad
  // y hace zoom para ver toda la ruta
  // ─────────────────────────────────────────────────────────────────────────────
  private mostrarRecorridoCompleto(bus: BusEnMapa): void {
    if (!bus.polylineRecorrido) return;
    // Destacar la polyline de la ruta completa
    bus.polylineRecorrido.setStyle({
      weight:    4,
      opacity:   0.35,
      dashArray: '8,6',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ETA DINÁMICO
  // Calcula los minutos restantes basado en waypoints que faltan y velocidad media
  // ─────────────────────────────────────────────────────────────────────────────
  private actualizarEtaDinamico(bus: BusEnMapa): void {
    const waypointsRestantes = bus.rutaWaypoints.length - bus.indiceActual - 1;
    if (waypointsRestantes <= 0) {
      this.etaDinamicoMinutos = 0;
      this.pasoViaje = 'fin';
      return;
    }

    // Calcular distancia restante entre waypoints consecutivos
    let distanciaRestante = 0;
    for (let i = bus.indiceActual; i < bus.rutaWaypoints.length - 1; i++) {
      const a = { lat: bus.rutaWaypoints[i][0],   lng: bus.rutaWaypoints[i][1] };
      const b = { lat: bus.rutaWaypoints[i+1][0], lng: bus.rutaWaypoints[i+1][1] };
      distanciaRestante += this.calcularDistancia(a, b);
    }

    const velocidadMs = 25 / 3.6; // 25 km/h en m/s (velocidad urbana Lima)
    const segundosRestantes = distanciaRestante / velocidadMs;
    this.etaDinamicoMinutos = Math.max(1, Math.round(segundosRestantes / 60));

    // Actualizar stepper según progreso
    const progreso = bus.indiceActual / bus.rutaWaypoints.length;
    if (progreso < 0.1)       this.pasoViaje = 'acercando';
    else if (progreso < 0.95) this.pasoViaje = 'abordo';
    else                      this.pasoViaje = 'fin';
  }

  contarParaderosPorLinea(linea: string): number {
    return this.paraderos.filter(p => p.lineas.includes(linea)).length;
  }

  formatearDistancia(metros: number): string {
    return metros >= 1000
      ? `${(metros / 1000).toFixed(1)} km`
      : `${Math.round(metros)} m`;
  }
}