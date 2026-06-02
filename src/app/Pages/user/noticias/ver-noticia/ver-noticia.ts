import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../../components/navbar/navbar';
import { AuthService } from '../../../../services/auth';

// ── Modelos ────────────────────────────────────────────────────────────────────

export interface BloqueContenido {
  tipo: 'parrafo' | 'subtitulo' | 'imagen';
  texto?: string;
  src?: string;
  alt?: string;
}

export interface DetalleNoticia {
  titulo: string;
  lead: string;
  imagen: string;
  autor: string;
  iniciales: string;
  cargo: string;
  fecha: string;
  bloques: BloqueContenido[];
}

export interface NoticiaRelacionada {
  id: number;
  badge: string;
  titulo: string;
  imagen: string;
  vistas: number;
}

export interface Comentario {
  id: number;
  autor: string;
  iniciales: string;
  colorAvatar: string;
  texto: string;
  respuestas: number;
  hace: string;
}

// ── Componente ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-ver-noticia',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './ver-noticia.html',
  styleUrl: './ver-noticia.css'
})
export class VerNoticiaComponent implements OnInit {

  // ── Detalle de la noticia ──────────────────────────────────────────────────
  noticia: DetalleNoticia = {
    titulo: 'Corredor Azul expande su cobertura hasta el Callao con 20 buses cero kilómetro',
    lead: 'El nuevo servicio parte desde la Av. Tacna (Centro Cívico) hasta la intersección de Faucett con Quilca, en el Callao. Una solución esperada por miles de usuarios que hoy pagan hasta S/ 10 en transbordos para hacer el mismo trayecto.',
    imagen: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=900&auto=format&fit=crop',
    autor: 'Jorge Luis Machado Flores',
    iniciales: 'JL',
    cargo: 'Comunicador oficial de la ATU',
    fecha: '26 ago 2025',
    bloques: [
      {
        tipo: 'parrafo',
        texto: 'El nuevo servicio parte desde la Av. Tacna (Centro Cívico) hasta la intersección de Faucett con Quilca, en el Callao. Una solución esperada por miles de usuarios que hoy pagan hasta S/ 10 en transbordos para hacer el mismo trayecto.'
      },
      {
        tipo: 'subtitulo',
        texto: '¿Cuál es el recorrido exacto?'
      },
      {
        tipo: 'parrafo',
        texto: 'El nuevo trayecto tiene como punto de partida el cruce de la Av. Tacna con el Centro Cívico y se extiende hacia el oeste de la capital. Desde allí, los buses transitarán por la Av. Venezuela, continuarán por Dueñas, tomarán la Av. Perú y concluirán en la intersección de Faucett con Quilca, en el Callao.'
      },
      {
        tipo: 'subtitulo',
        texto: '¿Por qué es importante esta nueva ruta?'
      },
      {
        tipo: 'parrafo',
        texto: 'Actualmente, los usuarios que necesitan desplazarse entre el Centro de Lima y el Callao deben realizar varios transbordos, llegando a pagar hasta S/ 10 por el mismo trayecto. La nueva ruta elimina esa necesidad al ofrecer un recorrido directo con buses exclusivos y modernos.'
      },
      {
        tipo: 'imagen',
        src: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop',
        alt: 'Buses del Corredor Azul'
      },
      {
        tipo: 'parrafo',
        texto: 'Una de las ventajas más destacadas es el sistema de transbordo integrado: quienes ya hayan validado su Lima Pass en algún tramo de la troncal principal y luego realicen una segunda validación en el nuevo ramal al Callao, solo deberán abonar S/ 0.40 adicionales.'
      },
      {
        tipo: 'subtitulo',
        texto: 'Flota de buses y características'
      },
      {
        tipo: 'parrafo',
        texto: 'Para cubrir este servicio se incorporarán 20 unidades nuevas. Nueve de ellas se integrarán a la troncal principal para reemplazar unidades que serán destinadas al nuevo tramo, garantizando que la operación general no pierda capacidad de atención.'
      },
      {
        tipo: 'parrafo',
        texto: 'Los vehículos son articulados de piso bajo, con rampas de accesibilidad, WiFi a bordo, aire acondicionado y sistema de validación con Lima Pass en todas las puertas. Cada unidad tiene capacidad para 160 pasajeros.'
      }
    ]
  };

  // ── Noticias relacionadas ──────────────────────────────────────────────────
  relacionadas: NoticiaRelacionada[] = [
    {
      id: 2,
      badge: 'Institucional',
      titulo: 'SE08: La ruta que une el Cercado de Lima con San Martín de Porres arrancó operaciones',
      imagen: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop',
      vistas: 8420
    },
    {
      id: 3,
      badge: 'Institucional',
      titulo: 'SE08: La ruta que une el Cercado de Lima con San Martín de Porres arrancó operaciones',
      imagen: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop',
      vistas: 8420
    }
  ];

  // ── Publicidad ─────────────────────────────────────────────────────────────
  publicidad: string[] = [
    'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&auto=format&fit=crop',
  ];

  // ── Comentarios ────────────────────────────────────────────────────────────
  totalComentarios = 17;
  nuevoComentario  = '';

  comentarios: Comentario[] = [
    {
      id: 1,
      autor: 'Jorge Luis Machado Flores',
      iniciales: 'JL',
      colorAvatar: 'linear-gradient(135deg,#1a3a8f,#2366CE)',
      texto: 'Este nuevo servicio será de gran ayuda para las personas que diariamente viajan entre el Centro de Lima y el Callao. La reducción de transbordos no solo ahorrará dinero, sino también tiempo y esfuerzo para miles de pasajeros. Además, la incorporación de buses modernos y accesibles demuestra un avance importante en la mejora del transporte público en la ciudad.',
      respuestas: 7,
      hace: 'Hace 2 horas'
    },
    {
      id: 2,
      autor: 'Jorge Luis Machado Flores',
      iniciales: 'JL',
      colorAvatar: 'linear-gradient(135deg,#1a3a8f,#2366CE)',
      texto: 'Este nuevo servicio será de gran ayuda para las personas que diariamente viajan entre el Centro de Lima y el Callao. La reducción de transbordos no solo ahorrará dinero, sino también tiempo y esfuerzo para miles de pasajeros. Además, la incorporación de buses modernos y accesibles demuestra un avance importante en la mejora del transporte público en la ciudad.',
      respuestas: 7,
      hace: 'Hace 3 horas'
    }
  ];

  // ── Usuario actual ─────────────────────────────────────────────────────────
  usuarioIniciales = 'YM';
  usuarioColor     = 'linear-gradient(135deg,#1a3a8f,#2366CE)';

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {}

  // ── Navegación ─────────────────────────────────────────────────────────────
  irA(seccion: string): void {
    this.router.navigate([`/${seccion}`]);
  }

  onLogout(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }

  volverNoticias(): void {
    this.router.navigate(['/noticias']);
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

  // ── Compartir ──────────────────────────────────────────────────────────────
  compartir(red: string): void {
    const url    = encodeURIComponent(window.location.href);
    const titulo = encodeURIComponent(this.noticia.titulo);
    const links: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter:  `https://twitter.com/intent/tweet?url=${url}&text=${titulo}`,
      whatsapp: `https://api.whatsapp.com/send?text=${titulo}%20${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };
    if (links[red]) window.open(links[red], '_blank');
  }

  // ── Comentarios ────────────────────────────────────────────────────────────
  publicarComentario(): void {
    if (!this.nuevoComentario.trim()) return;
    this.comentarios.unshift({
      id: Date.now(),
      autor: 'Yerami Medina',
      iniciales: this.usuarioIniciales,
      colorAvatar: this.usuarioColor,
      texto: this.nuevoComentario.trim(),
      respuestas: 0,
      hace: 'Ahora mismo'
    });
    this.totalComentarios++;
    this.nuevoComentario = '';
  }

  cancelarComentario(): void {
    this.nuevoComentario = '';
  }
}