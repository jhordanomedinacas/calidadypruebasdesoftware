import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../../../components/navbar/navbar';
import { AuthService } from '../../../../services/auth';
import {
  NoticiaUsuarioService,
  NoticiaDetalle,
  NoticiaRelacionada,
  Comentario
} from '../../../../services/noticia-usuario';
import { formatFechaCorta, formatFechaHora } from '../../../../services/utils/fecha';

// ── Componente ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-ver-noticia',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './ver-noticia.html',
  styleUrl: './ver-noticia.css'
})
export class VerNoticiaComponent implements OnInit {

  // ── IDs ────────────────────────────────────────────────────────────────────
  private noticiaId: number | null = null;

  // ── Estado de carga ────────────────────────────────────────────────────────
  cargando        = true;
  errorCarga      = '';
  cargandoCom     = false;

  // ── Detalle de la noticia ──────────────────────────────────────────────────
  noticia: NoticiaDetalle | null = null;
  contenidoHtml: SafeHtml = '';
  fechaFormateada = '';

  // ── Relacionadas ───────────────────────────────────────────────────────────
  relacionadas: NoticiaRelacionada[] = [];

  // ── Comentarios ────────────────────────────────────────────────────────────
  totalComentarios  = 0;
  comentarios:       Comentario[] = [];
  nuevoComentario   = '';
  publicando        = false;
  errorComentario   = '';

  // ── Respuestas inline ──────────────────────────────────────────────────────
  // idComentario → lista de respuestas cargadas
  respuestasPorComentario: Record<number, Comentario[]> = {};
  cargandoRespuestas: Record<number, boolean>  = {};
  mostrandoRespuestas: Record<number, boolean> = {};
  // idComentario padre al que se está respondiendo
  respondiendo: number | null = null;
  textoRespuesta = '';

  // ── Eliminar ───────────────────────────────────────────────────────────────
  eliminando: Record<number, boolean> = {};

  // ── Usuario actual ─────────────────────────────────────────────────────────
  usuarioId      = 0;
  usuarioNombre  = '';
  usuarioIniciales = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private noticiaService: NoticiaUsuarioService
  ) {}

  ngOnInit(): void {
    // Datos del usuario logueado
    const datos = this.auth.obtenerDatosUsuario();
    if (datos) {
      this.usuarioId       = Number(datos.sub);
      this.usuarioNombre   = datos.nombres ?? '';
      this.usuarioIniciales = this.usuarioNombre.charAt(0).toUpperCase();
    }

    const idParam = this.route.snapshot.queryParamMap.get('id');
    if (!idParam) {
      this.errorCarga = 'No se especificó la noticia.';
      this.cargando = false;
      return;
    }

    this.noticiaId = Number(idParam);
    this.cargarNoticia(this.noticiaId);
  }

  // ── Carga principal ────────────────────────────────────────────────────────
  private cargarNoticia(id: number): void {
    this.cargando   = true;
    this.errorCarga = '';

    this.noticiaService.obtenerDetalle(id).subscribe({
      next: (res) => {
        this.noticia         = res;
        this.fechaFormateada = formatFechaCorta(res.fecha);
        this.contenidoHtml   = this.sanitizer.bypassSecurityTrustHtml(res.contenidoHtml);
        this.cargando        = false;
        this.cdr.markForCheck();

        this.noticiaService.registrarVista(id).subscribe({ error: () => {} });
        this.cargarRelacionadas(id, res.categoria);
        this.cargarComentarios(id);
      },
      error: () => {
        this.errorCarga = 'No se pudo cargar la noticia. Intenta nuevamente.';
        this.cargando   = false;
        this.cdr.markForCheck();
      }
    });
  }

  private cargarRelacionadas(id: number, categoria: string): void {
    this.noticiaService.obtenerRelacionadas(id, categoria, 4).subscribe({
      next:  (res) => { this.relacionadas = res; this.cdr.markForCheck(); },
      error: () =>    { this.relacionadas = [];  this.cdr.markForCheck(); }
    });
  }

  private cargarComentarios(id: number): void {
    this.cargandoCom = true;
    this.noticiaService.listarComentarios(id).subscribe({
      next: (res) => {
        this.totalComentarios = res.total;
        // Formateamos la fecha de cada comentario a hora Perú (UTC-5)
        this.comentarios = res.comentarios.map(c => ({
          ...c,
          fecha: formatFechaHora(c.fecha)
        }));
        this.cargandoCom = false;
        this.cdr.markForCheck();
      },
      error: () => { this.cargandoCom = false; this.cdr.markForCheck(); }
    });
  }

  // ── Comentarios ────────────────────────────────────────────────────────────
  publicarComentario(): void {
    if (!this.nuevoComentario.trim() || !this.noticiaId) return;

    this.publicando      = true;
    this.errorComentario = '';

    this.noticiaService.crearComentario(this.noticiaId, this.nuevoComentario.trim()).subscribe({
      next: () => {
        this.nuevoComentario = '';
        this.publicando      = false;
        this.cargarComentarios(this.noticiaId!);
      },
      error: () => {
        this.publicando      = false;
        this.errorComentario = 'No se pudo publicar el comentario. Intenta nuevamente.';
        this.cdr.markForCheck();
      }
    });
  }

  cancelarComentario(): void { this.nuevoComentario = ''; }

  eliminarComentario(idComentario: number): void {
    this.eliminando[idComentario] = true;
    this.noticiaService.eliminarComentario(idComentario).subscribe({
      next: () => {
        delete this.eliminando[idComentario];
        this.comentarios = this.comentarios.filter(c => c.id !== idComentario);
        this.totalComentarios = Math.max(0, this.totalComentarios - 1);
        this.cdr.markForCheck();
      },
      error: () => { delete this.eliminando[idComentario]; this.cdr.markForCheck(); }
    });
  }

  toggleLike(comentario: Comentario): void {
    this.noticiaService.toggleLike(comentario.id).subscribe({
      next: (res) => {
        comentario.leDioLike  = res.leDioLike;
        comentario.totalLikes = res.totalLikes;
      },
      error: () => {}
    });
  }

  // ── Respuestas ─────────────────────────────────────────────────────────────
  toggleRespuestas(comentario: Comentario): void {
    const id = comentario.id;

    if (this.mostrandoRespuestas[id]) {
      this.mostrandoRespuestas[id] = false;
      return;
    }

    this.mostrandoRespuestas[id]  = true;
    if (this.respuestasPorComentario[id]) return; // ya cargadas

    this.cargandoRespuestas[id] = true;
    this.noticiaService.listarRespuestas(id).subscribe({
      next: (res) => {
        this.respuestasPorComentario[id] = res.map(r => ({
          ...r,
          fecha: formatFechaHora(r.fecha)
        }));
        this.cargandoRespuestas[id] = false;
        this.cdr.markForCheck();
      },
      error: () => { this.cargandoRespuestas[id] = false; this.cdr.markForCheck(); }
    });
  }

  iniciarRespuesta(idComentario: number): void {
    this.respondiendo    = idComentario;
    this.textoRespuesta  = '';
  }

  cancelarRespuesta(): void {
    this.respondiendo   = null;
    this.textoRespuesta = '';
  }

  publicarRespuesta(comentario: Comentario): void {
    if (!this.textoRespuesta.trim() || !this.noticiaId) return;

    this.noticiaService
      .crearComentario(this.noticiaId, this.textoRespuesta.trim(), comentario.id)
      .subscribe({
        next: () => {
          // Recargamos respuestas de ese comentario
          delete this.respuestasPorComentario[comentario.id];
          this.mostrandoRespuestas[comentario.id] = true;
          this.toggleRespuestas(comentario);
          comentario.totalRespuestas++;
          this.cancelarRespuesta();
        },
        error: () => { this.errorComentario = 'No se pudo publicar la respuesta.'; }
      });
  }

  // ── Navegación ─────────────────────────────────────────────────────────────
  irA(seccion: string): void { this.router.navigate([`/${seccion}`]); }

  onLogout(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }

  volverNoticias(): void { this.router.navigate(['/user/noticias']); }

  verRelacionada(id: number): void {
    this.router.navigate(['/user/noticias/ver-noticia'], { queryParams: { id } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.cargarNoticia(id);
  }

  // ── Compartir ──────────────────────────────────────────────────────────────
  compartir(red: string): void {
    const url    = encodeURIComponent(window.location.href);
    const titulo = encodeURIComponent(this.noticia?.titulo ?? '');
    const links: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter:  `https://twitter.com/intent/tweet?url=${url}&text=${titulo}`,
      whatsapp: `https://api.whatsapp.com/send?text=${titulo}%20${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };
    if (links[red]) window.open(links[red], '_blank');
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  esPropio(idUsuario: number): boolean {
    return this.usuarioId === idUsuario;
  }

  iniciales(nombre: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : '?';
  }

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