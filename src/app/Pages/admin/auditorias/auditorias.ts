import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NavbarComponent } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth';
import { AuditoriaService, AuditoriaItem, TablaAuditoria } from '../../../services/auditoria';
import { formatFechaHora } from '../../../services/utils/fecha';

@Component({
  selector: 'app-auditorias',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './auditorias.html',
  styleUrl: './auditorias.css'
})
export class AuditoriasComponent implements OnInit, OnDestroy {

  constructor(
    private router: Router,
    private auth: AuthService,
    private auditoriaService: AuditoriaService,
    private sanitizer: DomSanitizer
  ) {}

  // ── Filtros ────────────────────────────────────────────────
  tablas: TablaAuditoria[] = [
    'Todas', 'Usuario', 'Tarjeta', 'Tarjeta_Usuario',
    'Recarga', 'Noticia', 'Comentario', 'Rol',
    'Token_Verificacion', 'Token_Recuperacion'
  ];
  tablaActiva: TablaAuditoria = 'Todas';
  fechaIni = '';
  fechaFin = '';
  busquedaUsuario = '';

  private busquedaSubject = new Subject<void>();

  // ── Datos ─────────────────────────────────────────────────
  auditorias: AuditoriaItem[] = [];
  cargando = false;
  error = '';

  // ── Paginación ────────────────────────────────────────────
  readonly itemsPorPagina = 10;
  paginaActual = 1;
  totalPaginas = 1;
  totalRegistros = 0;
  paginasVisibles: (number | '...')[] = [];

  // ── Modal ─────────────────────────────────────────────────
  modalDetalle = false;
  auditoriaSeleccionada: AuditoriaItem | null = null;

  // ── Lifecycle ─────────────────────────────────────────────
  ngOnInit(): void {
    this.busquedaSubject.pipe(debounceTime(350)).subscribe(() => {
      this.paginaActual = 1;
      this.cargar();
    });
    this.cargar();
  }

  ngOnDestroy(): void {
    this.busquedaSubject.complete();
  }

  // ── Navegación (mismo patrón que dashboard) ───────────────
  irA(ruta: string): void {
    this.router.navigate([ruta]);
  }

  onLogout(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }

  // ── Carga ─────────────────────────────────────────────────
  cargar(): void {
    this.cargando = true;
    this.error    = '';

    this.auditoriaService.listar(
      this.tablaActiva,
      this.fechaIni  || null,
      this.fechaFin  || null,
      this.busquedaUsuario,
      this.paginaActual,
      this.itemsPorPagina
    ).subscribe({
      next: res => {
        this.auditorias     = res.auditorias;
        this.totalRegistros = res.total;
        this.totalPaginas   = Math.max(1, Math.ceil(res.total / this.itemsPorPagina));
        this.construirPaginacion();
        this.cargando = false;
      },
      error: () => {
        this.error    = 'No se pudo cargar el registro de auditorías.';
        this.cargando = false;
      }
    });
  }

  // ── Filtros ───────────────────────────────────────────────
  cambiarTabla(tabla: TablaAuditoria): void {
    this.tablaActiva  = tabla;
    this.paginaActual = 1;
    this.cargar();
  }

  onBusquedaChange(): void { this.busquedaSubject.next(); }

  onFechaChange(): void {
    this.paginaActual = 1;
    this.cargar();
  }

  limpiarFiltros(): void {
    this.tablaActiva     = 'Todas';
    this.fechaIni        = '';
    this.fechaFin        = '';
    this.busquedaUsuario = '';
    this.paginaActual    = 1;
    this.cargar();
  }

  // ── Paginación ────────────────────────────────────────────
  private construirPaginacion(): void {
    const total = this.totalPaginas;
    const actual = this.paginaActual;
    const pages: (number | '...')[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (actual > 3)           pages.push('...');
      for (let i = Math.max(2, actual - 1); i <= Math.min(total - 1, actual + 1); i++) {
        pages.push(i);
      }
      if (actual < total - 2)   pages.push('...');
      pages.push(total);
    }
    this.paginasVisibles = pages;
  }

  irPagina(p: number | '...'): void {
    if (p === '...' || +p === this.paginaActual) return;
    this.paginaActual = +p;
    this.cargar();
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) { this.paginaActual--; this.cargar(); }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) { this.paginaActual++; this.cargar(); }
  }

  // ── Modal ─────────────────────────────────────────────────
  verDetalle(a: AuditoriaItem): void {
    this.auditoriaSeleccionada = a;
    this.modalDetalle = true;
  }

  cerrarModal(): void {
    this.modalDetalle          = false;
    this.auditoriaSeleccionada = null;
  }

  // ── Helpers template ──────────────────────────────────────
  badgeOperacion(op: string): string {
    const map: Record<string, string> = {
      INSERT: 'badge-insert',
      UPDATE: 'badge-update',
      DELETE: 'badge-delete'
    };
    return map[op] ?? '';
  }

  // ── Iconos SVG por tabla (paths estilo outline, 24x24) ────
  private readonly tablaIconos: Record<string, string> = {
    Todas: `<path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25ZM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25Z"/>`,
    Usuario: `<path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0ZM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>`,
    Tarjeta: `<path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5Z"/>`,
    Tarjeta_Usuario: `<path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/>`,
    Recarga: `<path d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.768 0-1.536-.219-2.121-.659-1.172-.879-1.172-2.303 0-3.182s3.07-.879 4.242 0l.659.659M21 12a9 9 0 11-18 0 9 9 0 0118 0Z"/>`,
    Noticia: `<path d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5"/>`,
    Comentario: `<path d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155Z"/>`,
    Rol: `<path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12Z"/>`,
    Token_Verificacion: `<path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25Z"/>`,
    Token_Recuperacion: `<path d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25Z"/>`
  };

  private readonly svgCache = new Map<string, SafeHtml>();

  iconoTablaSvg(tabla: string): SafeHtml {
    if (this.svgCache.has(tabla)) return this.svgCache.get(tabla)!;
    const path = this.tablaIconos[tabla] ?? this.tablaIconos['Todas'];
    const markup = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
    const safe = this.sanitizer.bypassSecurityTrustHtml(markup);
    this.svgCache.set(tabla, safe);
    return safe;
  }

  formatearValor(val: string | null): string {
    if (!val) return '—';
    return val.split('|').filter(Boolean).join('\n');
  }

  /** Fecha/hora corregida a UTC-5 (Perú) — usada en el template en vez del pipe `date` */
  protected readonly formatFechaHora = formatFechaHora;
}