import { Component, AfterViewInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { NavbarComponent } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth';

const fadeSlideIn = trigger('fadeSlideIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(24px)' }),
    animate('420ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

interface Tarjeta {
  id: string;
  alias: string;
  empresa: string;
  codigo: string;
  imagen: string;
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
export class InicioComponent implements AfterViewInit, OnDestroy {
  nombreUsuario = '';

  constructor(private auth: AuthService, private router: Router) {
    const datos = this.auth.obtenerDatosUsuario();
    this.nombreUsuario = datos?.nombres ?? 'Usuario';
  }
  private observers: ResizeObserver[] = [];

  /* ── Carrusel ── */
  tarjetas: Tarjeta[] = [
    {
      id: '1',
      alias: 'Mi tarjeta principal',
      empresa: 'Corredor Azul',
      codigo: 'CA-2024-XXXXXX',
      imagen: 'TarjetCorredorAzul.png'
    }
  ];
  tarjetaActiva = 0;

  // Drag / swipe
  dragging = false;
  private dragStartX = 0;
  private dragCurrentX = 0;
  private readonly SWIPE_THRESHOLD = 50;

  /* Imagen por empresa */
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
  empresaSeleccionada: 'metropolitano' | 'corredor' | 'metro' | '' = '';
  codigoTarjeta = '';
  aliasNueva = '';

  /* ── Modal Editar ── */
  editNombre      = 'Mi tarjeta principal';
  editNombreActual = 'Mi tarjeta principal';
  editEmpresa: 'metropolitano' | 'corredor' | 'metro' = 'corredor';



  ngAfterViewInit(): void {
    setTimeout(() => this.initBorderTraces(), 50);
  }

  ngOnDestroy(): void {
    this.observers.forEach(o => o.disconnect());
  }

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
      rect.style.transition = 'none';
      rect.style.strokeDasharray  = `${perimeter}`;
      rect.style.strokeDashoffset = `${perimeter}`;
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

  /* ── Stack: posición visual de cada carta ── */
  getStackTransform(i: number): string {
    // "posición en la pila" = cuánto está detrás de la activa
    // la activa = 0, la siguiente = 1, etc.
    const pos = (i - this.tarjetaActiva + this.tarjetas.length) % this.tarjetas.length;

    // Solo mostramos la activa (pos=0) y hasta 2 detrás (pos=1, pos=2)
    if (pos > 2) return 'translateY(200px) scale(0.7)';

    if (pos === 0) {
      // Carta activa: puede ser arrastrada
      let dragX = 0;
      if (this.dragging) dragX = this.dragCurrentX - this.dragStartX;
      // Rotación sutil al arrastrar
      const rot = this.dragging ? (dragX / 15) : 0;
      return `translateX(${dragX}px) rotate(${rot}deg) translateY(0px) scale(1)`;
    }
    // Carta detrás: más pequeña, desplazada hacia abajo y centrada
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
    // La activa tiene el z más alto, las de atrás van bajando
    return Math.max(0, 10 - pos);
  }

  irASlide(i: number): void {
    this.tarjetaActiva = Math.max(0, Math.min(i, this.tarjetas.length - 1));
    this.sincronizarSaldo();
  }

  /* Mouse drag */
  onDragStart(e: MouseEvent): void {
    this.dragging = true;
    this.dragStartX = e.clientX;
    this.dragCurrentX = e.clientX;
  }
  onDragMove(e: MouseEvent): void {
    if (!this.dragging) return;
    this.dragCurrentX = e.clientX;
  }
  onDragEnd(e: MouseEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    const delta = e.clientX - this.dragStartX;
    this.resolverSwipe(delta);
  }

  /* Touch swipe */
  onTouchStart(e: TouchEvent): void {
    this.dragging = true;
    this.dragStartX = e.touches[0].clientX;
    this.dragCurrentX = e.touches[0].clientX;
  }
  onTouchMove(e: TouchEvent): void {
    if (!this.dragging) return;
    this.dragCurrentX = e.touches[0].clientX;
  }
  onTouchEnd(e: TouchEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    const delta = e.changedTouches[0].clientX - this.dragStartX;
    this.resolverSwipe(delta);
  }

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
    // Aquí conectar con el servicio real para traer el saldo de tarjetas[tarjetaActiva]
  }

  get tarjetaActivaObj(): Tarjeta | null {
    return this.tarjetas[this.tarjetaActiva] ?? null;
  }

  /* ── Modal Agregar ── */
  abrirModalAgregar(): void {
    this.empresaSeleccionada = '';
    this.codigoTarjeta = '';
    this.aliasNueva = '';
    this.modalAgregarAbierto = true;
  }
  cerrarModalAgregar(): void { this.modalAgregarAbierto = false; }
  agregarValido(): boolean {
    return this.empresaSeleccionada !== '' && this.codigoTarjeta.trim().length >= 4;
  }
  confirmarAgregar(): void {
    if (!this.agregarValido()) return;
    const empresaLabel: Record<string, string> = {
      metropolitano: 'Metropolitano',
      corredor:      'Corredor Azul',
      metro:         'Metro de Lima',
    };
    const nueva: Tarjeta = {
      id: Date.now().toString(),
      alias:   this.aliasNueva.trim() || 'Nueva tarjeta',
      empresa: empresaLabel[this.empresaSeleccionada] ?? '',
      codigo:  this.codigoTarjeta.trim(),
      imagen:  this.imagenPorEmpresa[this.empresaSeleccionada] ?? 'TarjetCorredorAzul.png',
    };
    this.tarjetas.push(nueva);
    // Navegar automáticamente a la tarjeta recién agregada
    setTimeout(() => { this.tarjetaActiva = this.tarjetas.length - 1; }, 50);
    this.modalAgregarAbierto = false;
  }

  /* ── Modal Editar ── */
  abrirModalEditar(): void {
    const t = this.tarjetaActivaObj;
    if (!t) return;
    this.editNombre      = t.alias;
    this.editNombreActual = t.alias;
    this.editEmpresa = (t.empresa === 'Metropolitano' ? 'metropolitano'
                       : t.empresa === 'Metro de Lima' ? 'metro' : 'corredor') as any;
    this.modalEditarAbierto = true;
  }
  cerrarModalEditar(): void { this.modalEditarAbierto = false; }
  confirmarEditar(): void {
    if (!this.editNombre.trim()) return;
    const t = this.tarjetaActivaObj;
    if (!t) return;
    t.alias = this.editNombre.trim();
    t.empresa = { metropolitano: 'Metropolitano', corredor: 'Corredor Azul', metro: 'Metro de Lima' }[this.editEmpresa];
    t.imagen  = this.imagenPorEmpresa[this.editEmpresa];
    this.editNombreActual = t.alias;
    this.modalEditarAbierto = false;
  }

  /* ── Modal Eliminar ── */
  abrirModalEliminar(): void { this.modalEliminarAbierto = true; }
  cerrarModalEliminar(): void { this.modalEliminarAbierto = false; }
  confirmarEliminar(): void {
    if (this.tarjetas.length === 0) return;
    this.tarjetas.splice(this.tarjetaActiva, 1);
    this.tarjetaActiva = Math.max(0, this.tarjetaActiva - 1);
    this.modalEliminarAbierto = false;
  }

  /* ── Cerrar al hacer click en overlay ── */
  cerrarOverlay(event: MouseEvent, modal: 'agregar' | 'editar' | 'eliminar'): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      if (modal === 'agregar')  this.cerrarModalAgregar();
      if (modal === 'editar')   this.cerrarModalEditar();
      if (modal === 'eliminar') this.cerrarModalEliminar();
    }
  }

  irA(seccion: string): void { this.router.navigate([`/${seccion}`]); }
  onLogout(): void { 
    this.auth.cerrarSesion();
    this.router.navigate(['/login']); }
}