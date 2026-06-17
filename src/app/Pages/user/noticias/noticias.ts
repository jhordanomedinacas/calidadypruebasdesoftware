import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NavbarComponent } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth';
import { NoticiaUsuarioService, CategoriaNoticia, NoticiaItem } from '../../../services/noticia-usuario';
import { formatFechaCorta } from '../../../services/utils/fecha';

// ── Modelos del template ───────────────────────────────────────────────────────

export interface Noticia {
  id:        number;
  categoria: string;
  fecha:     string;
  titulo:    string;
  resumen:   string;
  imagen:    string;
  autor:     string;
  vistas:    number;
  destacada: boolean;
}

export type NivelTrafico = 'PESADO' | 'MODERADO' | 'FLUIDO';

export interface Alerta {
  id:          number;
  titulo:      string;
  descripcion: string;
  hace:        string;
  lineas:      string[];
}

export interface ZonaTrafico {
  avenida: string;
  tramo:   string;
  nivel:   NivelTrafico;
}

// ── Componente ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-noticias',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './noticias.html',
  styleUrl: './noticias.css'
})
export class NoticiasComponent implements OnInit, OnDestroy {

  vista: 'resumen' | 'todas' = 'resumen';

  // ── Ticker ─────────────────────────────────────────────────────────────────
  tickerItems: string[] = [
    'Av. Arequipa con congestión moderada en hora punta — tiempo adicional: 12 min',
    'Nueva ruta SE08 (Cercado Lima – SMP) operando con normalidad',
    'Rutas 301 y 305 amplían horario hasta las 11:00 pm los fines de semana',
    'Corredor Azul incorpora 20 nuevas unidades en la troncal principal',
  ];

  // ── Tabs ───────────────────────────────────────────────────────────────────
  categorias: CategoriaNoticia[] = [
    'Todas', 'Institucional', 'Rutas', 'Alertas', 'Tráfico', 'Eventos'
  ];
  categoriaActiva: CategoriaNoticia = 'Todas';

  // ── Estado de carga ────────────────────────────────────────────────────────
  cargando = false;
  error    = '';

  // ── Búsqueda (solo en vista "todas") ──────────────────────────────────────
  busqueda = '';
  private busquedaSubject = new Subject<void>();

  // ── Datos del backend ──────────────────────────────────────────────────────
  private todasNoticias: Noticia[] = [];

  // ── Vista resumen ──────────────────────────────────────────────────────────
  noticiaHero:         Noticia | null = null;
  noticiasSecundarias: Noticia[]      = [];
  noticiasGrid:        Noticia[]      = [];

  // ── Vista todas (paginación server-side) ──────────────────────────────────
  readonly itemsPorPagina = 6;
  paginaActual     = 1;
  noticiasPagina:  Noticia[]          = [];
  totalPaginas     = 1;
  paginasVisibles: (number | '...')[] = [];

  // ── Tráfico (datos fijos) ──────────────────────────────────────────────────
  zonasTrafico: ZonaTrafico[] = [
    { avenida: 'Av. Arequipa',  tramo: 'Miraflores - Centro',   nivel: 'PESADO'   },
    { avenida: 'Av. Brasil',    tramo: 'Breña - Magdalena',     nivel: 'MODERADO' },
    { avenida: 'Av. Venezuela', tramo: 'Centro - Callao',       nivel: 'PESADO'   },
    { avenida: 'Av. Tacna',     tramo: 'Cercado - SMP',         nivel: 'FLUIDO'   },
    { avenida: 'Av. Colonial',  tramo: 'Callao - Breña',        nivel: 'PESADO'   },
    { avenida: 'Av. Grau',      tramo: 'Centro - La Victoria',  nivel: 'MODERADO' },
    { avenida: 'Vía Expresa',   tramo: 'Barranco - San Isidro', nivel: 'FLUIDO'   },
    { avenida: 'Av. Javier P.', tramo: 'Surco - San Borja',     nivel: 'MODERADO' },
  ];

  // ── Alertas (datos fijos) ──────────────────────────────────────────────────
  alertas: Alerta[] = [
    { id: 1, titulo: 'Desvío por manifestación en Av. Abancay',    descripcion: 'Los servicios 301 y 305 desvían su recorrido por Av. Tacna y Av. Garcilaso de la Vega en ambos sentidos. Se estima normalización en 45 minutos.', hace: 'Hace 12 min', lineas: ['301', '305'] },
    { id: 2, titulo: 'Congestión en Av. Colonial por accidente',    descripcion: 'Unidades del Corredor Azul reportan demoras de hasta 20 minutos en el tramo Breña–Callao por accidente de tránsito.',                          hace: 'Hace 28 min', lineas: ['302']       },
    { id: 3, titulo: 'Cierre temporal de paradero Miraflores Sur', descripcion: 'El paradero Miraflores Sur estará cerrado hasta las 18:00 por trabajos de mantenimiento. Se habilitó paradero alternativo a 200m.',             hace: 'Hace 1 h',    lineas: ['201', '203'] },
    { id: 4, titulo: 'Demora en ruta 401 por lluvia intensa',       descripcion: 'Las unidades de la ruta 401 registran demoras de 15 minutos debido a lluvia intensa en el distrito de San Juan de Lurigancho.',                   hace: 'Hace 2 h',    lineas: ['401']       },
  ];

  ultimaActualizacion = 'Actualizado hace 5 min';

  constructor(
    private router: Router,
    private auth: AuthService,
    private noticiaService: NoticiaUsuarioService
  ) {}

  ngOnInit(): void {
    // Debounce del buscador (solo activo en vista "todas")
    this.busquedaSubject.pipe(debounceTime(350)).subscribe(() => {
      this.paginaActual = 1;
      this.filtrarEnCliente();
    });

    this.cargarNoticias();
  }

  ngOnDestroy(): void {
    this.busquedaSubject.complete();
  }

  // ── Navegación ─────────────────────────────────────────────────────────────
  irA(seccion: string): void { this.router.navigate([`/${seccion}`]); }

  onLogout(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }

  verNoticia(id: number): void {
    this.router.navigate(['/user/noticias/ver-noticia'], { queryParams: { id } });
  }

  verMapa(): void { this.router.navigate(['/ubicacion']); }

  // ── Vista ──────────────────────────────────────────────────────────────────
  verTodas(): void {
    this.vista = 'todas';
    this.paginaActual = 1;
    this.filtrarEnCliente();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  volverResumen(): void {
    this.vista = 'resumen';
    this.busqueda = '';
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────
  seleccionarCategoria(cat: CategoriaNoticia): void {
    this.categoriaActiva = cat;
    this.paginaActual    = 1;
    this.busqueda        = '';
    this.cargarNoticias();
  }

  onBusqueda(): void { this.busquedaSubject.next(); }

  // ── Carga desde el backend ─────────────────────────────────────────────────
  private cargarNoticias(): void {
    this.cargando = true;
    this.error    = '';

    // Para el resumen traemos las primeras 12; para "todas" usaremos filtrado local
    this.noticiaService.listar(this.categoriaActiva, 1, 12).subscribe({
      next: (res) => {
        this.todasNoticias = res.noticias.map(n => this.mapNoticia(n));
        this.cargando = false;
        this.filtrarEnCliente();
      },
      error: () => {
        this.error    = 'No se pudieron cargar las noticias. Intenta nuevamente.';
        this.cargando = false;
      }
    });
  }

  private mapNoticia(n: NoticiaItem): Noticia {
    return {
      id:        n.id,
      categoria: n.categoria,
      fecha:     formatFechaCorta(n.fecha),
      titulo:    n.titulo,
      resumen:   n.resumen,
      imagen:    n.imagen,
      autor:     n.autor,
      vistas:    n.vistas,
      destacada: n.destacada
    };
  }

  // ── Filtrado + distribución local ─────────────────────────────────────────
  private filtrarEnCliente(): void {
    let filtradas = this.todasNoticias;

    if (this.busqueda.trim()) {
      const q = this.busqueda.trim().toLowerCase();
      filtradas = filtradas.filter(n =>
        n.titulo.toLowerCase().includes(q) ||
        n.resumen.toLowerCase().includes(q)
      );
    }

    // ── Resumen ───────────────────────────────────────────────────────────
    this.noticiaHero         = filtradas.find(n => n.destacada) ?? filtradas[0] ?? null;
    this.noticiasSecundarias = filtradas.filter(n => !n.destacada).slice(0, 2);
    this.noticiasGrid        = filtradas.filter(n =>
      n !== this.noticiaHero && !this.noticiasSecundarias.includes(n)
    ).slice(0, 8);

    // ── Todas (paginación local) ──────────────────────────────────────────
    this.totalPaginas = Math.max(1, Math.ceil(filtradas.length / this.itemsPorPagina));
    if (this.paginaActual > this.totalPaginas) this.paginaActual = this.totalPaginas;
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    this.noticiasPagina = filtradas.slice(inicio, inicio + this.itemsPorPagina);
    this.calcularPaginasVisibles();
  }

  private calcularPaginasVisibles(): void {
    const total  = this.totalPaginas;
    const actual = this.paginaActual;
    const paginas: (number | '...')[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) paginas.push(i);
    } else {
      paginas.push(1);
      if (actual > 3) paginas.push('...');
      for (let i = Math.max(2, actual - 1); i <= Math.min(total - 1, actual + 1); i++) {
        paginas.push(i);
      }
      if (actual < total - 2) paginas.push('...');
      paginas.push(total);
    }
    this.paginasVisibles = paginas;
  }

  irAPagina(pagina: number | '...'): void {
    if (pagina === '...' || pagina === this.paginaActual) return;
    this.paginaActual = pagina as number;
    this.filtrarEnCliente();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) this.irAPagina(this.paginaActual - 1);
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) this.irAPagina(this.paginaActual + 1);
  }

  // ── Helpers tráfico ────────────────────────────────────────────────────────
  nivelColor(nivel: NivelTrafico): string {
    return nivel === 'PESADO'   ? '#ef4444'
         : nivel === 'MODERADO' ? '#f59e0b'
         :                        '#22c55e';
  }

  nivelBg(nivel: NivelTrafico): string {
    return nivel === 'PESADO'   ? 'rgba(239,68,68,0.08)'
         : nivel === 'MODERADO' ? 'rgba(245,158,11,0.08)'
         :                        'rgba(34,197,94,0.08)';
  }

  // ── Badge color ────────────────────────────────────────────────────────────
  badgeStyle(cat: string): { background: string; color: string } {
    const c = cat.toLowerCase();
    if (c.includes('institucional')) return { background: 'rgba(139,92,246,0.12)', color: '#7c3aed' };
    if (c.includes('ruta'))          return { background: 'rgba(35,102,206,0.12)',  color: '#2366CE' };
    if (c.includes('alerta'))        return { background: 'rgba(239,68,68,0.12)',   color: '#dc2626' };
    if (c.includes('tráfico') || c.includes('trafico'))
                                     return { background: 'rgba(245,158,11,0.12)',  color: '#b45309' };
    if (c.includes('evento'))        return { background: 'rgba(34,197,94,0.12)',   color: '#16a34a' };
    return { background: 'rgba(107,114,128,0.12)', color: '#374151' };
  }
}