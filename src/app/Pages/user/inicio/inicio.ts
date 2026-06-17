import { Component, AfterViewInit, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { NavbarComponent } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth';
import { TarjetaService, TarjetaResponse } from '../../../services/tarjeta';

const fadeSlideIn = trigger('fadeSlideIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(24px)' }),
    animate('420ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

interface Tarjeta {
  idTarjetaUsuario: number;
  id: string;
  alias: string;
  empresa: string;
  codigo: string;
  imagen: string;
  saldo?: number;
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
  animations: [fadeSlideIn],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class InicioComponent implements OnInit, AfterViewInit, OnDestroy {
  nombreUsuario = '';

  // ── Estado de carga ──
  cargando = false;

  // ── Errores y éxitos por modal (separados) ──
  errorAgregar   = '';
  exitoAgregar   = '';
  errorEditar    = '';
  exitoEditar    = '';
  errorEliminar  = '';

  // ── Modal "sin tarjetas" (al intentar recargar sin tener tarjeta) ──
  modalSinTarjetasAbierto = false;

  constructor(
    private auth:       AuthService,
    private router:     Router,
    private route:      ActivatedRoute,
    private cdr:        ChangeDetectorRef,
    private tarjetaSvc: TarjetaService
  ) {
    const datos = this.auth.obtenerDatosUsuario();
    this.nombreUsuario = datos?.nombres ?? 'Usuario';
  }

  onPerfilActualizado(nombre: string): void {
    this.nombreUsuario = nombre;
    this.cdr.detectChanges();
  }

  private observers: ResizeObserver[] = [];

  /* ── Carrusel ── */
  tarjetas: Tarjeta[] = [];
  tarjetaActiva = 0;

  dragging = false;
  private dragStartX   = 0;
  private dragCurrentX = 0;
  private readonly SWIPE_THRESHOLD = 50;

  private imagenPorEmpresa: Record<string, string> = {
    metropolitano: 'TarjetMetropolitano.png',
    corredor:      'TarjetCorredorAzul.png',
    metro:         'TarjetMetro.png',
  };

  /* ── Modales ── */
  modalAgregarAbierto  = false;
  modalEditarAbierto   = false;
  modalEliminarAbierto = false;

  /* ── Modal Agregar ── */
  empresaSeleccionada: 'corredor' = 'corredor';
  codigoTarjeta = '';
  aliasNueva    = '';

  /* ── Modal Editar ── */
  editNombre       = '';
  editNombreActual = '';
  editCodigo       = '';
  editEmpresa: 'metropolitano' | 'corredor' | 'metro' = 'corredor';

  // ════════════════════════════════════════
  // LIFECYCLE
  // ════════════════════════════════════════

  ngOnInit(): void {
    this.cargarTarjetas();

    this.route.queryParams.subscribe(params => {
      if (params['sinTarjetas'] === '1') {
        this.modalSinTarjetasAbierto = true;
      }
    });
  }
  ngAfterViewInit(): void { setTimeout(() => this.initBorderTraces(), 50); }
  ngOnDestroy(): void { this.observers.forEach(o => o.disconnect()); }

  // ════════════════════════════════════════
  // CARGA DE TARJETAS
  // ════════════════════════════════════════

  private cargarTarjetas(): void {
    this.cargando = true;

    this.tarjetaSvc.obtenerTarjetas().subscribe({
      next: (resp) => {
        this.tarjetas = resp.map(t => this.mapear(t));
        this.tarjetaActiva = Math.min(this.tarjetaActiva, Math.max(0, this.tarjetas.length - 1));
        this.cargando = false;
        this.sincronizarSaldo();
        setTimeout(() => this.initBorderTraces(), 50);
      },
      error: () => { this.cargando = false; }
    });
  }

  private mapear(t: TarjetaResponse): Tarjeta {
    const claveEmpresa = t.tipoTarjeta?.toLowerCase().includes('metro de lima') ? 'metro'
                       : t.tipoTarjeta?.toLowerCase().includes('metropolitano')  ? 'metropolitano'
                       : 'corredor';
    return {
      idTarjetaUsuario: t.idTarjetaUsuario,
      id:      String(t.idTarjetaUsuario),
      alias:   t.alias || 'Mi tarjeta',
      empresa: t.tipoTarjeta || 'Corredor Azul',
      codigo:  t.codigoTarjeta,
      imagen:  this.imagenPorEmpresa[claveEmpresa] ?? 'TarjetCorredorAzul.png',
      saldo:   t.saldo ?? undefined,
    };
  }

  // ════════════════════════════════════════
  // BORDER TRACES
  // ════════════════════════════════════════

  private initBorderTraces(): void {
    const cards = document.querySelectorAll<HTMLElement>('.service-card');
    cards.forEach(card => this.initTrace(card));
  }

  private initTrace(card: HTMLElement): void {
    const svg  = card.querySelector<SVGSVGElement>('.border-trace');
    const rect = card.querySelector<SVGRectElement>('.border-trace .trace-rect');
    if (!svg || !rect) return;
    const R = 15;
    const update = () => {
      const w = card.offsetWidth;
      const h = card.offsetHeight;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      rect.setAttribute('width',  String(w - 2));
      rect.setAttribute('height', String(h - 2));
      rect.setAttribute('rx',     String(R));
      const perimeter = 2 * (w - 2 + h - 2) - 8 * R + 2 * Math.PI * R;
      card.style.setProperty('--perimeter', `${perimeter}`);
      rect.style.transition        = 'none';
      rect.style.strokeDasharray   = `${perimeter}`;
      rect.style.strokeDashoffset  = `${perimeter}`;
    };
    card.addEventListener('mouseleave', () => {
      rect.style.transition       = 'none';
      rect.style.strokeDashoffset = card.style.getPropertyValue('--perimeter');
    });
    const ro = new ResizeObserver(update);
    ro.observe(card);
    this.observers.push(ro);
    update();
  }

  // ════════════════════════════════════════
  // STACK / CARRUSEL
  // ════════════════════════════════════════

  getStackTransform(i: number): string {
    const pos = (i - this.tarjetaActiva + this.tarjetas.length) % this.tarjetas.length;
    if (pos > 2) return 'translateY(200px) scale(0.7)';
    if (pos === 0) {
      let dragX = 0;
      if (this.dragging) dragX = this.dragCurrentX - this.dragStartX;
      const rot = this.dragging ? (dragX / 15) : 0;
      return `translateX(${dragX}px) rotate(${rot}deg) translateY(0px) scale(1)`;
    }
    const scale  = 1 - pos * 0.045;
    const transY = pos * 7;
    return `translateY(${transY}px) scale(${scale})`;
  }

  getStackOpacity(i: number): number {
    const pos = (i - this.tarjetaActiva + this.tarjetas.length) % this.tarjetas.length;
    if (pos === 0) return 1;
    if (pos === 1) return 0.75;
    if (pos === 2) return 0.45;
    return 0;
  }

  getStackZ(i: number): number {
    const pos = (i - this.tarjetaActiva + this.tarjetas.length) % this.tarjetas.length;
    return Math.max(0, 10 - pos);
  }

  irASlide(i: number): void {
    this.tarjetaActiva = Math.max(0, Math.min(i, this.tarjetas.length - 1));
    this.sincronizarSaldo();
  }

  onDragStart(e: MouseEvent): void { this.dragging = true; this.dragStartX = e.clientX; this.dragCurrentX = e.clientX; }
  onDragMove(e: MouseEvent):  void { if (!this.dragging) return; this.dragCurrentX = e.clientX; }
  onDragEnd(e: MouseEvent):   void { if (!this.dragging) return; this.dragging = false; this.resolverSwipe(e.clientX - this.dragStartX); }

  onTouchStart(e: TouchEvent): void { this.dragging = true; this.dragStartX = e.touches[0].clientX; this.dragCurrentX = e.touches[0].clientX; }
  onTouchMove(e: TouchEvent):  void { if (!this.dragging) return; this.dragCurrentX = e.touches[0].clientX; }
  onTouchEnd(e: TouchEvent):   void { if (!this.dragging) return; this.dragging = false; this.resolverSwipe(e.changedTouches[0].clientX - this.dragStartX); }

  private resolverSwipe(delta: number): void {
    if (delta < -this.SWIPE_THRESHOLD && this.tarjetaActiva < this.tarjetas.length - 1) {
      this.tarjetaActiva++;
    } else if (delta > this.SWIPE_THRESHOLD && this.tarjetaActiva > 0) {
      this.tarjetaActiva--;
    }
    this.dragStartX = 0;
    this.dragCurrentX = 0;
    this.sincronizarSaldo();
  }

  private sincronizarSaldo(): void {
    const t = this.tarjetaActivaObj;
    if (!t) return;
    this.tarjetaSvc.obtenerSaldo(t.idTarjetaUsuario).subscribe({
      next: (resp) => { t.saldo = resp.saldo; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  get tarjetaActivaObj(): Tarjeta | null {
    return this.tarjetas[this.tarjetaActiva] ?? null;
  }

  // ════════════════════════════════════════
  // MODAL AGREGAR
  // ════════════════════════════════════════

  abrirModalAgregar(): void {
    this.codigoTarjeta = '';
    this.aliasNueva    = '';
    this.errorAgregar  = '';
    this.exitoAgregar  = '';
    this.modalAgregarAbierto = true;
  }
  cerrarModalAgregar(): void { this.modalAgregarAbierto = false; }

  // ════════════════════════════════════════
  // MODAL "SIN TARJETAS"
  // ════════════════════════════════════════

  cerrarModalSinTarjetas(): void {
    this.modalSinTarjetasAbierto = false;
    this.router.navigate(['/inicio']);
  }

  // Desde el modal "sin tarjetas" → abre directamente el modal agregar
  irAAgregarDesdeSinTarjetas(): void {
    this.modalSinTarjetasAbierto = false;
    this.router.navigate(['/inicio']);
    this.abrirModalAgregar();
  }

  agregarValido(): boolean { return this.codigoTarjeta.trim().length >= 4; }

  confirmarAgregar(): void {
    if (!this.agregarValido()) return;
    this.errorAgregar = '';
    this.exitoAgregar = '';

    this.tarjetaSvc.agregar({
      codigoTarjeta: this.codigoTarjeta.trim(),
      alias:         this.aliasNueva.trim() || 'Nueva tarjeta',
    }).subscribe({
      next: () => {
        this.exitoAgregar = '¡Tarjeta agregada correctamente! Ya puedes usarla.';
        this.cargarTarjetas();
        setTimeout(() => {
          this.tarjetaActiva = this.tarjetas.length - 1;
          this.modalAgregarAbierto = false;
          this.exitoAgregar = '';
        }, 1800);
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.mensaje || '';
        if (msg.toLowerCase().includes('no encontrada') || msg.toLowerCase().includes('inactiva')) {
          this.errorAgregar = 'El código de tarjeta no existe o está inactiva. Revisa el código en el reverso de tu tarjeta.';
        } else if (msg.toLowerCase().includes('ya está vinculada')) {
          this.errorAgregar = 'Esta tarjeta ya está vinculada a tu cuenta.';
        } else if (msg.toLowerCase().includes('otro usuario')) {
          this.errorAgregar = 'Esta tarjeta ya está registrada por otro usuario.';
        } else {
          this.errorAgregar = 'No se pudo agregar la tarjeta. Verifica el código e intenta de nuevo.';
        }
      }
    });
  }

  // ════════════════════════════════════════
  // MODAL EDITAR
  // ════════════════════════════════════════

  abrirModalEditar(): void {
    const t = this.tarjetaActivaObj;
    if (!t) return;
    this.editNombre       = t.alias;
    this.editNombreActual = t.alias;
    this.editCodigo       = t.codigo;
    this.editEmpresa      = (t.empresa === 'Metropolitano' ? 'metropolitano'
                           : t.empresa === 'Metro de Lima' ? 'metro' : 'corredor') as any;
    this.errorEditar  = '';
    this.exitoEditar  = '';
    this.modalEditarAbierto = true;
  }
  cerrarModalEditar(): void { this.modalEditarAbierto = false; }

  confirmarEditar(): void {
    if (!this.editNombre.trim()) return;
    const t = this.tarjetaActivaObj;
    if (!t) return;
    this.errorEditar = '';
    this.exitoEditar = '';

    this.tarjetaSvc.editar(t.idTarjetaUsuario, { alias: this.editNombre.trim() }).subscribe({
      next: () => {
        t.alias               = this.editNombre.trim();
        t.imagen              = this.imagenPorEmpresa[this.editEmpresa];
        this.editNombreActual = t.alias;
        this.exitoEditar = '¡Alias actualizado correctamente!';
        setTimeout(() => {
          this.modalEditarAbierto = false;
          this.exitoEditar = '';
        }, 1800);
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.mensaje || '';
        if (msg.toLowerCase().includes('no encontrada') || msg.toLowerCase().includes('no pertenece')) {
          this.errorEditar = 'Esta tarjeta no existe o no pertenece a tu cuenta. Revisa el código que se encuentra en tu tarjeta.';
        } else {
          this.errorEditar = 'No se pudo editar la tarjeta. Intenta de nuevo más tarde.';
        }
      }
    });
  }

  // ════════════════════════════════════════
  // MODAL ELIMINAR
  // ════════════════════════════════════════

  abrirModalEliminar(): void { this.errorEliminar = ''; this.modalEliminarAbierto = true; }
  cerrarModalEliminar(): void { this.modalEliminarAbierto = false; }

  confirmarEliminar(): void {
    const t = this.tarjetaActivaObj;
    if (!t) return;
    this.errorEliminar = '';

    this.tarjetaSvc.eliminar(t.idTarjetaUsuario).subscribe({
      next: () => {
        this.modalEliminarAbierto = false;
        this.tarjetaActiva = Math.max(0, this.tarjetaActiva - 1);
        this.cargarTarjetas();
      },
      error: () => { this.errorEliminar = 'No se pudo eliminar la tarjeta. Intenta de nuevo.'; }
    });
  }

  // ════════════════════════════════════════
  // OVERLAY & NAVEGACIÓN
  // ════════════════════════════════════════

  cerrarOverlay(event: MouseEvent, modal: 'agregar' | 'editar' | 'eliminar' | 'sinTarjetas'): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      if (modal === 'agregar')     this.cerrarModalAgregar();
      if (modal === 'editar')      this.cerrarModalEditar();
      if (modal === 'eliminar')    this.cerrarModalEliminar();
      if (modal === 'sinTarjetas') this.cerrarModalSinTarjetas();
    }
  }

  irA(seccion: string): void { this.router.navigate([`/${seccion}`]); }

  // Navega a recargas pasando la tarjeta seleccionada (si existe).
  // Si no hay tarjetas, muestra el modal de aviso en vez de navegar.
  irARecargar(idTarjetaUsuario?: number): void {
    if (this.tarjetas.length === 0) {
      this.modalSinTarjetasAbierto = true;
      return;
    }
    this.router.navigate(['/user/recargas'], {
      state: { idTarjetaUsuario: idTarjetaUsuario ?? this.tarjetaActivaObj?.idTarjetaUsuario }
    });
  }
  onLogout(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }
}