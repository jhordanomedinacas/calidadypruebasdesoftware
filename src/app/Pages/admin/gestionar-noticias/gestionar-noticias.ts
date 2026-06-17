import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NavbarComponent } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth';
import { NoticiaAdminService, CategoriaNoticia } from '../../../services/noticia-admin';
import { formatFechaCorta } from '../../../services/utils/fecha';

// ── Modelo usado por el template ───────────────────────────────────────────────

export interface Noticia {
  id: number;
  categoria: Exclude<CategoriaNoticia, 'Todas'>;
  fecha: string;
  titulo: string;
  resumen: string;
  imagen: string;
  vistas: number;
  publicada: boolean;
  destacada: boolean;
}

// ── Componente ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-gestionar-noticias',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './gestionar-noticias.html',
  styleUrl: './gestionar-noticias.css'
})
export class GestionarNoticiasComponent implements OnInit, OnDestroy {

  constructor(
    private router: Router,
    private auth: AuthService,
    private noticiaService: NoticiaAdminService
  ) {}

  // ── Tabs ───────────────────────────────────────────────────────────────────
  categorias: CategoriaNoticia[] = [
    'Todas', 'Institucional', 'Rutas', 'Alertas', 'Tráfico', 'Eventos'
  ];
  categoriaActiva: CategoriaNoticia = 'Todas';

  // ── Búsqueda (con debounce para no golpear el backend en cada tecla) ────────
  busqueda = '';
  private busquedaSubject = new Subject<void>();

  // ── Datos (ahora vienen del backend) ─────────────────────────────────────────
  noticiasPagina: Noticia[] = [];
  cargando = false;
  error = '';

  // ── Paginación (server-side: el backend ya pagina) ───────────────────────────
  readonly itemsPorPagina = 6;
  paginaActual = 1;
  totalPaginas = 1;
  paginasVisibles: (number | '...')[] = [];

  // ── Modal eliminar ─────────────────────────────────────────────────────────
  modalEliminarNoticia = false;
  idEliminarNoticia: number | null = null;
  eliminando = false;

  // ── Ticker (no forma parte del backend de noticias; se deja como contenido fijo) ──
  tickerItems: string[] = [
    'Av. Arequipa con congestión moderada en hora punta — tiempo adicional: 12 min',
    'Nueva ruta SE08 (Cercado Lima – SMP) operando con normalidad',
    'Rutas 301 y 305 amplían horario hasta las 11:00 pm los fines de semana',
    'Corredor Azul incorpora 20 nuevas unidades en la troncal principal',
  ];

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.busquedaSubject.pipe(debounceTime(350)).subscribe(() => {
      this.paginaActual = 1;
      this.cargarNoticias();
    });
    this.cargarNoticias();
  }

  ngOnDestroy(): void {
    this.busquedaSubject.complete();
  }

  // ── Carga desde el backend ────────────────────────────────────────────────
  private cargarNoticias(): void {
    this.cargando = true;
    this.error    = '';

    this.noticiaService
      .listar(this.categoriaActiva, this.busqueda, this.paginaActual, this.itemsPorPagina)
      .subscribe({
        next: (res) => {
          this.totalPaginas = Math.max(1, Math.ceil(res.total / this.itemsPorPagina));
          if (this.paginaActual > this.totalPaginas) {
            this.paginaActual = this.totalPaginas;
          }

          this.noticiasPagina = res.noticias.map(n => ({
            id:        n.id,
            categoria: n.categoria as Exclude<CategoriaNoticia, 'Todas'>,
            fecha:     formatFechaCorta(n.fecha),
            titulo:    n.titulo,
            resumen:   n.resumen,
            imagen:    n.imagen,
            vistas:    n.vistas,
            publicada: n.publicada,
            destacada: n.destacada
          }));

          this.calcularPaginasVisibles();
          this.cargando = false;
        },
        error: () => {
          this.error         = 'No se pudieron cargar las noticias. Intenta nuevamente.';
          this.noticiasPagina = [];
          this.cargando      = false;
        }
      });
  }

  // ── Navegación ─────────────────────────────────────────────────────────────
  irInicio(): void { this.router.navigate(['/inicia']); }

  onLogout(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }

  /** Botón "Agregar Noticia" → página crear/editar en modo crear */
  irACrear(): void {
    this.router.navigate(['/gestion-noticias/crear']);
  }

  /** Botón "Editar" de una card → página crear/editar en modo editar */
  irAEditar(id: number): void {
    this.router.navigate(['/gestion-noticias/editar', id]);
  }

  /** Botón "Ver noticia" → vista pública */
  verNoticia(id: number): void {
    this.router.navigate(['/user/noticias/ver-noticia'], { queryParams: { id } });
  }

  // ── Tabs / búsqueda ────────────────────────────────────────────────────────
  seleccionarCategoria(cat: CategoriaNoticia): void {
    this.categoriaActiva = cat;
    this.paginaActual = 1;
    this.cargarNoticias();
  }

  onBusqueda(): void {
    this.busquedaSubject.next();
  }

  // ── Paginación ─────────────────────────────────────────────────────────────
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
    this.cargarNoticias();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) this.irAPagina(this.paginaActual - 1);
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) this.irAPagina(this.paginaActual + 1);
  }

  // ── Modal eliminar ─────────────────────────────────────────────────────────
  confirmarEliminar(id: number): void {
    this.idEliminarNoticia  = id;
    this.modalEliminarNoticia = true;
  }

  cancelarEliminar(): void {
    if (this.eliminando) return;
    this.modalEliminarNoticia = false;
    this.idEliminarNoticia    = null;
  }

  ejecutarEliminar(): void {
    if (this.idEliminarNoticia === null) return;

    this.eliminando = true;
    this.noticiaService.eliminar(this.idEliminarNoticia).subscribe({
      next: () => {
        this.eliminando           = false;
        this.modalEliminarNoticia = false;

        // Si era el único elemento visible de una página > 1, retrocedemos una.
        if (this.noticiasPagina.length === 1 && this.paginaActual > 1) {
          this.paginaActual--;
        }

        this.idEliminarNoticia = null;
        this.cargarNoticias();
      },
      error: () => {
        this.eliminando           = false;
        this.modalEliminarNoticia = false;
        this.idEliminarNoticia    = null;
        this.error                = 'No se pudo eliminar la noticia. Intenta nuevamente.';
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  badgeStyle(categoria: string): { background: string; color: string } {
    const c = categoria.toLowerCase();
    if (c === 'institucional') return { background: 'rgba(139,92,246,0.12)', color: '#7c3aed' };
    if (c === 'rutas')         return { background: 'rgba(35,102,206,0.12)',  color: '#2366CE' };
    if (c === 'alertas')       return { background: 'rgba(239,68,68,0.12)',   color: '#dc2626' };
    if (c === 'tráfico')       return { background: 'rgba(245,158,11,0.12)',  color: '#b45309' };
    if (c === 'eventos')       return { background: 'rgba(34,197,94,0.12)',   color: '#16a34a' };
    return { background: 'rgba(107,114,128,0.12)', color: '#374151' };
  }
}
