import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth';
import {
  VerbusesService,
  LineaResponse,
  ParaderoResponse,
  BusResponse,
} from '../../../services/verbuses';

@Component({
  selector: 'app-verbuses',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './verbuses.html',
  styleUrl: './verbuses.css',
})
export class VerBusesComponent implements OnInit {

  // ── Estado UI ────────────────────────────────────────────────────────────────
  busqueda       = '';
  tabActivo: 'ida' | 'vuelta' = 'ida';

  // ── Datos del backend ────────────────────────────────────────────────────────
  lineas:          LineaResponse[]    = [];
  lineasFiltradas: LineaResponse[]    = [];
  paraderos:       ParaderoResponse[] = [];
  buses:           BusResponse[]      = [];

  lineaSeleccionada: LineaResponse | null = null;

  // ── Loading / error flags ────────────────────────────────────────────────────
  cargandoLineas    = false;
  cargandoParaderos = false;
  cargandoBuses     = false;
  errorLineas       = '';
  errorParaderos    = '';
  errorBuses        = '';

  constructor(
    private router:   Router,
    private auth:     AuthService,
    private verbuses: VerbusesService,
  ) {}

  // ── Ciclo de vida ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.cargarLineas();
  }

  // ── Carga de datos ───────────────────────────────────────────────────────────

  cargarLineas(): void {
    this.cargandoLineas = true;
    this.errorLineas    = '';
    this.verbuses.obtenerLineas().subscribe({
      next: (data) => {
        this.lineas          = data;
        this.lineasFiltradas = [...data];
        this.cargandoLineas  = false;
        if (data.length > 0) {
          this.seleccionarLinea(data[0]);
        }
      },
      error: (err) => {
        this.errorLineas    = err?.error?.message ?? 'Error al cargar las líneas.';
        this.cargandoLineas = false;
      },
    });
  }

  seleccionarLinea(linea: LineaResponse): void {
    this.lineaSeleccionada = linea;
    this.tabActivo         = 'ida';
    this.paraderos         = [];
    this.buses             = [];
    this.cargarParaderos(linea.idLinea, 'ida');
    this.cargarBuses(linea.idLinea);
  }

  cargarParaderos(idLinea: number, direccion: 'ida' | 'vuelta'): void {
    this.cargandoParaderos = true;
    this.errorParaderos    = '';
    this.verbuses.obtenerParaderos(idLinea, direccion).subscribe({
      next: (data) => {
        this.paraderos         = data.sort((a, b) => a.orden - b.orden);
        this.cargandoParaderos = false;
      },
      error: (err) => {
        this.errorParaderos    = err?.error?.message ?? 'Error al cargar paraderos.';
        this.cargandoParaderos = false;
      },
    });
  }

  cargarBuses(idLinea: number): void {
    this.cargandoBuses = true;
    this.errorBuses    = '';
    this.verbuses.obtenerBuses(idLinea).subscribe({
      next: (data) => {
        this.buses         = data;
        this.cargandoBuses = false;
      },
      error: (err) => {
        this.buses         = [];
        this.cargandoBuses = false;
        if (err?.status !== 404) {
          this.errorBuses = err?.error?.message ?? 'Error al cargar buses.';
        }
      },
    });
  }

  // ── Cambio de tab Ida / Vuelta ───────────────────────────────────────────────

  cambiarTab(tab: 'ida' | 'vuelta'): void {
    if (this.tabActivo === tab || !this.lineaSeleccionada) return;
    this.tabActivo = tab;
    this.cargarParaderos(this.lineaSeleccionada.idLinea, tab);
  }

  // ── Filtrado de líneas ───────────────────────────────────────────────────────

  filtrarLineas(): void {
    const t = this.busqueda.toLowerCase().trim();
    this.lineasFiltradas = t
      ? this.lineas.filter(
          (l) =>
            l.nombreLinea.toLowerCase().includes(t) ||
            l.empresa.toLowerCase().includes(t),
        )
      : [...this.lineas];
  }

  // ── Helpers de paraderos en 2 columnas ──────────────────────────────────────

  getParaderosColumna(col: 0 | 1): ParaderoResponse[] {
    const mitad = Math.ceil(this.paraderos.length / 2);
    return col === 0 ? this.paraderos.slice(0, mitad) : this.paraderos.slice(mitad);
  }

  // ── Helpers para el panel derecho ────────────────────────────────────────────

  /** Capacidad del primer bus activo; fallback 80 (Padrón). */
  getCapacidadTotal(): number {
    return this.buses.length > 0 ? this.buses[0].capacidad : 80;
  }

  /** Porcentaje de ocupación sobre 80 pasajeros (Padrón). */
  getCapacidadPct(capacidad: number): number {
    return Math.min(Math.round((capacidad / 80) * 100), 100);
  }

  // ── Navegación ───────────────────────────────────────────────────────────────

  irInicio(): void {
    this.router.navigate(['/inicio']);
  }

  onLogout(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }
}