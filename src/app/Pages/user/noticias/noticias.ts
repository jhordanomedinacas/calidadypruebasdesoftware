import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth';

// ── Modelos ────────────────────────────────────────────────────────────────────

export type CategoriaNoticia =
  | 'Todas'
  | 'Institucional'
  | 'Rutas'
  | 'Alertas'
  | 'Tráfico'
  | 'Eventos';

export type NivelTrafico = 'PESADO' | 'MODERADO' | 'FLUIDO';

export interface Noticia {
  id: number;
  categoria: Exclude<CategoriaNoticia, 'Todas'>;
  badge: string;
  fecha: string;
  titulo: string;
  resumen: string;
  imagen: string;
  autor?: string;
  avatarAutor?: string;
  vistas?: number;
  destacada?: boolean;
  secundaria?: boolean;
}

export interface Alerta {
  id: number;
  tipo: 'warning' | 'danger' | 'info';
  titulo: string;
  descripcion: string;
  hace: string;
  lineas: string[];
}

export interface ZonaTrafico {
  avenida: string;
  tramo: string;
  nivel: NivelTrafico;
}

// ── Componente ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-noticias',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
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

  // ── Noticias ───────────────────────────────────────────────────────────────
  private todasNoticias: Noticia[] = [
    {
      id: 1,
      categoria: 'Rutas',
      badge: 'NUEVA RUTA',
      fecha: '26 ago 2025',
      titulo: 'Nueva ruta conectará el Centro de Lima con el Callao',
      resumen:
        'La nueva extensión parte desde la intersección de la Av. Tacna con el Centro Cívico y llega hasta la intersección de Faucett con Quilca, en el Callao. El servicio incorpora 20 unidades nuevas y reduce drásticamente los transbordos que hoy obligan a los usuarios a pagar hasta S/ 10 por el mismo trayecto.\n\nLa integración tarifaria permitirá que quienes ya hayan validado en la troncal principal paguen solo S/ 0.40 adicionales para continuar al Callao, mejorando la conectividad de dos grandes zonas de la capital.',
      imagen: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=900&auto=format&fit=crop',
      autor: 'Jorge Luis',
      avatarAutor: 'assets/avatares/jorge.jpg',
      vistas: 12340,
      destacada: true
    },
    {
      id: 2,
      categoria: 'Institucional',
      badge: 'NUEVA RUTA',
      fecha: '26 ago 2025',
      titulo: 'SE08: La ruta que une el Cercado de Lima con San Martín de Porres arrancó operaciones',
      resumen:
        'Tras 3 días de marcha blanca y más de 10 mil viajes gratuitos, el Servicio Alimentador Extraordinario 08 inicia operaciones regulares con 22 paraderos de ida y 26 de vuelta.',
      imagen: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop',
      vistas: 8420,
      secundaria: true
    },
    {
      id: 3,
      categoria: 'Institucional',
      badge: 'Institucional',
      fecha: '26 ago 2025',
      titulo: 'SE08: La ruta que une el Cercado de Lima con San Martín de Porres arrancó operaciones',
      resumen:
        'Tras 3 días de marcha blanca y más de 10 mil viajes gratuitos, el Servicio Alimentador Extraordinario 08 inicia operaciones regulares con 22 paraderos de ida y 26 de vuelta.',
      imagen: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop',
      vistas: 8420,
      secundaria: true
    },
    {
      id: 4,
      categoria: 'Rutas',
      badge: 'Servicios',
      fecha: '25 ago 2025',
      titulo: 'Rutas 301 y 305 amplían horario nocturno los fines de semana',
      resumen: 'Desde el próximo viernes las unidades operarán hasta las 11 pm, mejorando la conectividad nocturna en las principales avenidas.',
      imagen: 'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=800&auto=format&fit=crop',
      vistas: 5310,
    },
    {
      id: 5,
      categoria: 'Institucional',
      badge: 'Institucional',
      fecha: '25 ago 2025',
      titulo: 'Rutas 301 y 305 amplían horario nocturno los fines de semana',
      resumen: 'Desde el próximo viernes las unidades operarán hasta las 11 pm, mejorando la conectividad nocturna en las principales avenidas.',
      imagen: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
      vistas: 3200,
    },
    {
      id: 6,
      categoria: 'Alertas',
      badge: 'Operativo',
      fecha: '24 ago 2025',
      titulo: 'Desvío temporal en Av. Abancay por trabajos de mantenimiento',
      resumen: 'Los servicios 301 y 305 desviarán su recorrido por Av. Tacna durante los próximos 3 días hábiles.',
      imagen: 'https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?w=800&auto=format&fit=crop',
      vistas: 2890,
    },
    {
      id: 7,
      categoria: 'Institucional',
      badge: 'Institucional',
      fecha: '24 ago 2025',
      titulo: 'Corredor Azul presenta nuevo plan de mantenimiento preventivo para su flota',
      resumen: 'El plan contempla revisiones técnicas cada 5,000 km para garantizar la seguridad de los pasajeros en toda la red.',
      imagen: 'https://images.unsplash.com/photo-1567360425618-1594206637d2?w=800&auto=format&fit=crop',
      vistas: 1740,
    },
    {
      id: 8,
      categoria: 'Rutas',
      badge: 'Servicios',
      fecha: '23 ago 2025',
      titulo: 'Nuevos paraderos accesibles para personas con discapacidad en 12 estaciones',
      resumen: 'Se implementarán rampas, señalética braille y asientos prioritarios en los paraderos de mayor afluencia.',
      imagen: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop',
      vistas: 4120,
    },
  ];

  // ── Vista resumen ──────────────────────────────────────────────────────────
  noticiaHero:         Noticia | null = null;
  noticiasSecundarias: Noticia[]      = [];
  noticiasGrid:        Noticia[]      = [];

  // ── Vista todas (paginación) ───────────────────────────────────────────────
  readonly itemsPorPagina = 6;
  paginaActual     = 1;
  noticiasPagina:  Noticia[]          = [];
  totalPaginas     = 1;
  paginasVisibles: (number | '...')[] = [];

  // ── Alertas ────────────────────────────────────────────────────────────────
  alertas: Alerta[] = [
    {
      id: 1, tipo: 'warning',
      titulo: 'Desvío por manifestación en Av. Abancay',
      descripcion: 'Los servicios 301 y 305 desvían su recorrido por Av. Tacna y Av. Garcilaso de la Vega en ambos sentidos. Se estima normalización en 45 minutos.',
      hace: 'Hace 12 min', lineas: ['301', '302']
    },
    {
      id: 2, tipo: 'warning',
      titulo: 'Desvío por manifestación en Av. Abancay',
      descripcion: 'Los servicios 301 y 305 desvían su recorrido por Av. Tacna y Av. Garcilaso de la Vega en ambos sentidos. Se estima normalización en 45 minutos.',
      hace: 'Hace 12 min', lineas: ['301', '302']
    },
    {
      id: 3, tipo: 'warning',
      titulo: 'Desvío por manifestación en Av. Abancay',
      descripcion: 'Los servicios 301 y 305 desvían su recorrido por Av. Tacna y Av. Garcilaso de la Vega en ambos sentidos. Se estima normalización en 45 minutos.',
      hace: 'Hace 12 min', lineas: ['301', '302']
    },
    {
      id: 4, tipo: 'warning',
      titulo: 'Desvío por manifestación en Av. Abancay',
      descripcion: 'Los servicios 301 y 305 desvían su recorrido por Av. Tacna y Av. Garcilaso de la Vega en ambos sentidos. Se estima normalización en 45 minutos.',
      hace: 'Hace 12 min', lineas: ['301', '302']
    }
  ];

  ultimaActualizacion = 'Actualizado hace 5 min';

  // ── Tráfico ────────────────────────────────────────────────────────────────
  zonasTrafico: ZonaTrafico[] = [
    { avenida: 'Av. Arequipa', tramo: 'Miraflores - Centro', nivel: 'PESADO' },
    { avenida: 'Av. Arequipa', tramo: 'Miraflores - Centro', nivel: 'MODERADO' },
    { avenida: 'Av. Arequipa', tramo: 'Miraflores - Centro', nivel: 'PESADO' },
    { avenida: 'Av. Arequipa', tramo: 'Miraflores - Centro', nivel: 'FLUIDO' },
    { avenida: 'Av. Arequipa', tramo: 'Miraflores - Centro', nivel: 'PESADO' },
    { avenida: 'Av. Arequipa', tramo: 'Miraflores - Centro', nivel: 'MODERADO' },
    { avenida: 'Av. Arequipa', tramo: 'Miraflores - Centro', nivel: 'PESADO' },
    { avenida: 'Av. Arequipa', tramo: 'Miraflores - Centro', nivel: 'FLUIDO' },
  ];

  private tickerInterval: any;

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    this.aplicarFiltro();
  }

  ngOnDestroy(): void {
    if (this.tickerInterval) clearInterval(this.tickerInterval);
  }

  // ── Navegación ─────────────────────────────────────────────────────────────
  irA(seccion: string): void {
    this.router.navigate([`/${seccion}`]);
  }

  onLogout(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────
  seleccionarCategoria(cat: CategoriaNoticia): void {
    this.categoriaActiva = cat;
    this.paginaActual = 1;
    this.aplicarFiltro();
  }

  // ── Vista ──────────────────────────────────────────────────────────────────
  verTodas(): void {
    this.vista = 'todas';
    this.paginaActual = 1;
    this.aplicarFiltro();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  volverResumen(): void {
    this.vista = 'resumen';
  }

  // ── Filtro + paginación ────────────────────────────────────────────────────
  private aplicarFiltro(): void {
    const filtradas = this.categoriaActiva === 'Todas'
      ? this.todasNoticias
      : this.todasNoticias.filter(n => n.categoria === this.categoriaActiva);

    // Resumen
    this.noticiaHero         = filtradas.find(n => n.destacada) ?? filtradas[0] ?? null;
    this.noticiasSecundarias = filtradas.filter(n => n.secundaria).slice(0, 2);
    this.noticiasGrid        = filtradas.filter(n => !n.destacada && !n.secundaria);

    // Todas
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
    this.aplicarFiltro();
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
  badgeStyle(badge: string): { background: string; color: string } {
    const b = badge.toLowerCase();
    if (b.includes('ruta'))          return { background: 'rgba(35,102,206,0.12)', color: '#2366CE' };
    if (b.includes('institucional')) return { background: 'rgba(139,92,246,0.12)', color: '#7c3aed' };
    if (b.includes('operativo'))     return { background: 'rgba(34,197,94,0.12)',  color: '#16a34a' };
    if (b.includes('servicio'))      return { background: 'rgba(245,158,11,0.12)', color: '#b45309' };
    return { background: 'rgba(107,114,128,0.12)', color: '#374151' };
  }

  verMapa(): void {
    this.router.navigate(['/ubicacion']);
  }

  verNoticia(): void {
    this.router.navigate(['/user/noticias/ver-noticia']);
  }
}
