import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar';

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
  badge: string;           // texto del chip
  fecha: string;
  titulo: string;
  resumen: string;
  imagen: string;          // url o ruta de asset
  autor?: string;
  avatarAutor?: string;
  vistas?: number;
  destacada?: boolean;     // hero
  secundaria?: boolean;    // cards medianas
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
      vistas: 0,
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
      resumen: 'Desde el próximo viernes las unidades operarán hasta las 11 pm.',
      imagen: 'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=800&auto=format&fit=crop',
    },
    {
      id: 5,
      categoria: 'Institucional',
      badge: 'Institucional',
      fecha: '25 ago 2025',
      titulo: 'Rutas 301 y 305 amplían horario nocturno los fines de semana',
      resumen: 'Desde el próximo viernes las unidades operarán hasta las 11 pm.',
      imagen: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
    },
    {
      id: 6,
      categoria: 'Alertas',
      badge: 'Operativo',
      fecha: '24 ago 2025',
      titulo: 'Rutas 301 y 305 amplían horario nocturno los fines de semana',
      resumen: 'Desde el próximo viernes las unidades operarán hasta las 11 pm.',
      imagen: 'https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?w=800&auto=format&fit=crop',
    },
    {
      id: 7,
      categoria: 'Institucional',
      badge: 'Institucional',
      fecha: '24 ago 2025',
      titulo: 'Rutas 301 y 305 amplían horario nocturno los fines de semana',
      resumen: 'Desde el próximo viernes las unidades operarán hasta las 11 pm.',
      imagen: 'https://images.unsplash.com/photo-1567360425618-1594206637d2?w=800&auto=format&fit=crop',
    }
  ];

  noticiaHero:       Noticia | null = null;
  noticiasSecundarias: Noticia[]   = [];
  noticiasGrid:      Noticia[]     = [];

  // ── Alertas ────────────────────────────────────────────────────────────────
  alertas: Alerta[] = [
    {
      id: 1,
      tipo: 'warning',
      titulo: 'Desvío por manifestación en Av. Abancay',
      descripcion:
        'Los servicios 301 y 305 desvían su recorrido por Av. Tacna y Av. Garcilaso de la Vega en ambos sentidos. Se estima normalización en 45 minutos.',
      hace: 'Hace 12 min',
      lineas: ['301', '302']
    },
    {
      id: 2,
      tipo: 'warning',
      titulo: 'Desvío por manifestación en Av. Abancay',
      descripcion:
        'Los servicios 301 y 305 desvían su recorrido por Av. Tacna y Av. Garcilaso de la Vega en ambos sentidos. Se estima normalización en 45 minutos.',
      hace: 'Hace 12 min',
      lineas: ['301', '302']
    },
    {
      id: 3,
      tipo: 'warning',
      titulo: 'Desvío por manifestación en Av. Abancay',
      descripcion:
        'Los servicios 301 y 305 desvían su recorrido por Av. Tacna y Av. Garcilaso de la Vega en ambos sentidos. Se estima normalización en 45 minutos.',
      hace: 'Hace 12 min',
      lineas: ['301', '302']
    },
    {
      id: 4,
      tipo: 'warning',
      titulo: 'Desvío por manifestación en Av. Abancay',
      descripcion:
        'Los servicios 301 y 305 desvían su recorrido por Av. Tacna y Av. Garcilaso de la Vega en ambos sentidos. Se estima normalización en 45 minutos.',
      hace: 'Hace 12 min',
      lineas: ['301', '302']
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

  // ── Ticker interval ────────────────────────────────────────────────────────
  private tickerInterval: any;

  constructor(private router: Router) {}

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
    this.router.navigate(['/login']);
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────
  seleccionarCategoria(cat: CategoriaNoticia): void {
    this.categoriaActiva = cat;
    this.aplicarFiltro();
  }

  private aplicarFiltro(): void {
    const filtradas = this.categoriaActiva === 'Todas'
      ? this.todasNoticias
      : this.todasNoticias.filter(n => n.categoria === this.categoriaActiva);

    this.noticiaHero         = filtradas.find(n => n.destacada) ?? filtradas[0] ?? null;
    this.noticiasSecundarias = filtradas.filter(n => n.secundaria).slice(0, 2);
    this.noticiasGrid        = filtradas.filter(n => !n.destacada && !n.secundaria);
  }

  // ── Helpers de tráfico ─────────────────────────────────────────────────────
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
  verTodas(): void {
    this.router.navigate(['/noticias/todas']);
  }
}