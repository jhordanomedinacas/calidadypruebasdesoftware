import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { NavbarComponent } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth';
import {
  RecargaService,
  TarjetaRecargaResponse,
  MetodoPagoResponse,
  HistorialRecargaResponse
} from '../../../services/recarga';

const fadeSlideIn = trigger('fadeSlideIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(24px) scale(0.97)' }),
    animate('320ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
  ])
]);

export interface Recarga {
  metodo: string;
  fecha: string;
  monto: number;
}

@Component({
  selector: 'app-recargas',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './recargas.html',
  styleUrl: './recargas.css',
  animations: [fadeSlideIn]
})
export class RecargasComponent implements OnInit, OnDestroy {

  // ── Tarjetas del usuario ────────────────────────────────────────
  tarjetas: TarjetaRecargaResponse[] = [];
  tarjetaSeleccionada: TarjetaRecargaResponse | null = null;

  // ── Métodos de pago (desde backend) ─────────────────────────────
  metodosPago: MetodoPagoResponse[] = [];

  // ── Saldo y montos ─────────────────────────────────────────────
  montosRapidos: number[] = [5, 10, 15, 20];
  montoSeleccionado: number | null = null;
  montoPersonalizado: number | null = null;
  inputFocused: boolean = false;

  // ── Método de pago ─────────────────────────────────────────────
  metodoPago: string | null = null;

  // ── Campos tarjeta (Culqi widget) ──────────────────────────────
  tipoTarjeta: 'visa' | 'mastercard' | null = null;
  tipoTarjetaDetectado: 'visa' | 'mastercard' | 'amex' | 'diners' | null = null;
  numeroTarjeta: string = '';
  nombreTitular: string = '';
  vencimiento: string = '';
  cvv: string = '';
  cuotasSeleccionadas: string = '1';

  // Focus states (Culqi)
  focusNumero: boolean = false;
  focusNombre: boolean = false;
  focusVenc: boolean = false;
  focusCVV: boolean = false;
  mostrarTooltipCVV: boolean = false;

  // ── Estado del modal ───────────────────────────────────────────
  modalAbierto: boolean = false;
  modalProcesando: boolean = false;
  modalExito: boolean = false;
  modalError: boolean = false;
  mensajeError: string = '';
  referenciaExito: string = '';

  // ── Timer Yape ─────────────────────────────────────────────────
  timerYape: number = 300; // 5 minutos
  private _timerInterval: any = null;

  // ── PagoEfectivo ───────────────────────────────────────────────
  cipGenerado: string = '';
  cipVencimiento: string = '';

  // ── Historial ──────────────────────────────────────────────────
  ultimasRecargas: Recarga[] = [];
  cargandoHistorial: boolean = false;

  // ── Carga inicial ──────────────────────────────────────────────
  cargando: boolean = true;
  errorCarga: string = '';

  constructor(
    private router: Router,
    private auth: AuthService,
    private recargaSvc: RecargaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // idTarjetaUsuario recibido desde Inicio (al elegir "Recargar saldo" sobre una tarjeta)
    const idDesdeInicio: number | undefined = (history.state as any)?.['idTarjetaUsuario'];

    this.cargando = true;

    this.recargaSvc.obtenerTarjetas().subscribe({
      next: (tarjetas) => {
        this.tarjetas = tarjetas;

        // Selecciona la tarjeta indicada desde Inicio, o la primera disponible
        this.tarjetaSeleccionada =
          tarjetas.find(t => t.idTarjetaUsuario === idDesdeInicio) ?? tarjetas[0] ?? null;

        this._cargarHistorial();
        this._verificarCarga();
      },
      error: () => {
        this.errorCarga = 'No se pudieron cargar tus tarjetas.';
        this._verificarCarga();
      }
    });

    this.recargaSvc.obtenerMetodosPago().subscribe({
      next: (metodos) => {
        this.metodosPago = metodos;
        this._verificarCarga();
      },
      error: () => {
        this.errorCarga = 'No se pudieron cargar los métodos de pago.';
        this._verificarCarga();
      }
    });
  }

  private _verificarCarga(): void {
    this.cargando = false;
    this.cdr.detectChanges();
  }

  // ── Saldo de la tarjeta seleccionada ────────────────────────────
  get saldoActual(): number {
    return this.tarjetaSeleccionada?.saldo ?? 0;
  }

  // ── Selección de tarjeta ─────────────────────────────────────────
  seleccionarTarjeta(idTarjetaUsuario: number): void {
    const t = this.tarjetas.find(x => x.idTarjetaUsuario === Number(idTarjetaUsuario));
    if (!t) return;
    this.tarjetaSeleccionada = t;
    this._cargarHistorial();
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this._limpiarTimer();
  }

  // ── Getters ────────────────────────────────────────────────────
  get montoActual(): number {
    return this.montoSeleccionado ?? this.montoPersonalizado ?? 0;
  }

  // ── Selección de monto ─────────────────────────────────────────
  seleccionarMonto(monto: number): void {
    this.montoSeleccionado = monto;
    this.montoPersonalizado = null;
    this.cdr.detectChanges();
  }

  onMontoPersonalizado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = parseFloat(input.value);
    if (!isNaN(valor) && valor > 0) {
      this.montoPersonalizado = valor;
      this.montoSeleccionado = null;
    } else {
      this.montoPersonalizado = null;
    }
  }

  // ── Selección de método ────────────────────────────────────────
  seleccionarMetodo(metodo: string): void {
    this.metodoPago = metodo;
    if (metodo !== 'tarjeta') {
      this._limpiarCamposTarjeta();
    }
    this.cdr.detectChanges();
  }

  // ── Validación del formulario principal ────────────────────────
  puedeConfirmar(): boolean {
    const tieneMonto = this.montoSeleccionado !== null ||
      (this.montoPersonalizado !== null && this.montoPersonalizado > 0);
    return tieneMonto && this.metodoPago !== null;
  }

  // ── Validación específica para Culqi ──────────────────────────
  puedeConfirmarTarjeta(): boolean {
    return !!(
      this.numeroTarjeta.replace(/\s/g, '').length === 16 &&
      this.nombreTitular.trim().length > 2 &&
      this.vencimiento.length === 5 &&
      this.cvv.length >= 3
    );
  }

  // ── Abrir modal según método ───────────────────────────────────
  abrirModalPago(): void {
    if (!this.puedeConfirmar()) return;

    this.modalAbierto = true;
    this.modalProcesando = false;
    this.modalExito = false;
    this.modalError = false;

    if (this.metodoPago === 'yape') {
      this._iniciarTimerYape();
    }

    if (this.metodoPago === 'pagoefectivo') {
      this._generarCIP();
    }

    this.cdr.detectChanges();
  }

  // ── Cerrar modal al hacer click en overlay ────────────────────
  cerrarModalSiEsOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      if (!this.modalProcesando) {
        this.cerrarModal();
      }
    }
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this._limpiarTimer();
    this.modalProcesando = false;
    this.modalExito = false;
    this.modalError = false;
    this.mensajeError = '';
    this.cdr.detectChanges();
  }

  volverFormulario(): void {
    this.modalProcesando = false;
    this.modalExito = false;
    this.modalError = false;
    this.mensajeError = '';
    this.cdr.detectChanges();
  }

  // ── Procesar pago ──────────────────────────────────────────────
  procesarPago(): void {
    this._limpiarTimer();
    this.modalProcesando = true;

    // Simular latencia del gateway de pago (1.8 - 2.5 segundos)
    const delay = 1800 + Math.random() * 700;

    setTimeout(() => {
      // Simular rechazo si la tarjeta empieza con 1 (para demo del widget Culqi)
      const primeraDigito = this.numeroTarjeta.replace(/\s/g, '')[0];
      if (this.metodoPago === 'tarjeta' && primeraDigito === '1') {
        this.modalProcesando = false;
        this.modalError = true;
        this.mensajeError = 'Fondos insuficientes. Verifica el saldo de tu tarjeta.';
        this.cdr.detectChanges();
        return;
      }

      this._registrarRecargaBackend();
    }, delay);
  }

  // ── Registro real de la recarga en el backend ──────────────────
  private _registrarRecargaBackend(): void {
    const idTarjetaUsuario = this.tarjetaSeleccionada?.idTarjetaUsuario;
    const idMetodoPago = this._getIdMetodoPago(this.metodoPago);
    const monto = this.montoActual;

    if (!idTarjetaUsuario || !idMetodoPago) {
      this.modalProcesando = false;
      this.modalError = true;
      this.mensajeError = 'No se pudo identificar la tarjeta o el método de pago.';
      this.cdr.detectChanges();
      return;
    }

    this.recargaSvc.registrarRecarga({
      idTarjetaUsuario,
      idMetodoPago,
      monto,
      canal: 'web'
    }).subscribe({
      next: (resp) => {
        this.modalProcesando = false;

        // Actualiza saldo local de la tarjeta seleccionada
        if (this.tarjetaSeleccionada) {
          this.tarjetaSeleccionada.saldo = resp.saldoNuevo;
        }

        this.referenciaExito = 'TXN-' + resp.idRecarga;
        this.modalExito = true;
        this._cargarHistorial();
        this._limpiarFormulario();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.modalProcesando = false;
        this.modalError = true;
        this.mensajeError = err?.error?.message || err?.error?.mensaje
          || 'No se pudo registrar la recarga. Intenta de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }

  // ── Mapea el método de pago seleccionado en UI → idMetodoPago ──
  private _getIdMetodoPago(metodo: string | null): number | null {
    if (!metodo) return null;

    const claves: Record<string, string[]> = {
      yape:         ['yape'],
      plin:         ['plin'],
      pagoefectivo: ['pagoefectivo', 'pago efectivo'],
      tarjeta:      ['tarjeta', 'credito', 'crédito', 'debito', 'débito']
    };

    const posibles = claves[metodo] ?? [];
    const encontrado = this.metodosPago.find(mp =>
      posibles.some(clave => mp.nombre.toLowerCase().includes(clave))
    );
    return encontrado?.idMetodoPago ?? null;
  }

  // ── Carga el historial de recargas de la tarjeta seleccionada ──
  private _cargarHistorial(): void {
    if (!this.tarjetaSeleccionada) {
      this.ultimasRecargas = [];
      return;
    }

    this.cargandoHistorial = true;
    this.recargaSvc.obtenerHistorial(this.tarjetaSeleccionada.idTarjetaUsuario).subscribe({
      next: (historial) => {
        this.ultimasRecargas = historial.map(h => this._mapearHistorial(h));
        this.cargandoHistorial = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.ultimasRecargas = [];
        this.cargandoHistorial = false;
        this.cdr.detectChanges();
      }
    });
  }

  private _mapearHistorial(h: HistorialRecargaResponse): Recarga {
    return {
      metodo: h.metodoPago,
      fecha:  this._formatearFecha(h.fechaRecarga),
      monto:  h.monto
    };
  }

  private _formatearFecha(fechaIso: string): string {
    const fecha = new Date(fechaIso);
    if (isNaN(fecha.getTime())) return fechaIso;

    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    const hora = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });

    const esMismoDia = (a: Date, b: Date) =>
      a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

    if (esMismoDia(fecha, hoy))  return 'Hoy, ' + hora;
    if (esMismoDia(fecha, ayer)) return 'Ayer, ' + hora;

    return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + hora;
  }

  // ── Formateo de tarjeta ────────────────────────────────────────
  formatearNumeroTarjeta(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '').substring(0, 16);
    val = val.replace(/(.{4})(?=.)/g, '$1 ').trim();
    this.numeroTarjeta = val;
    input.value = val;
    this._detectarTipoTarjeta(val.replace(/\s+/g, ''));
  }

  formatearVencimiento(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) val = val.substring(0, 2) + '/' + val.substring(2);
    this.vencimiento = val;
    input.value = val;
  }

  // ── Detección automática de red ────────────────────────────────
  private _detectarTipoTarjeta(numero: string): void {
    if (!numero) { this.tipoTarjetaDetectado = null; return; }
    if (/^4/.test(numero))                  { this.tipoTarjetaDetectado = 'visa';       return; }
    if (/^5[1-5]|^2[2-7]/.test(numero))     { this.tipoTarjetaDetectado = 'mastercard'; return; }
    if (/^3[47]/.test(numero))               { this.tipoTarjetaDetectado = 'amex';       return; }
    if (/^3(?:0[0-5]|[68])/.test(numero))   { this.tipoTarjetaDetectado = 'diners';     return; }
    this.tipoTarjetaDetectado = null;
  }

  // ── Timer Yape ─────────────────────────────────────────────────
  private _iniciarTimerYape(): void {
    this.timerYape = 300;
    this._timerInterval = setInterval(() => {
      this.timerYape--;
      if (this.timerYape <= 0) {
        this._limpiarTimer();
        this.cerrarModal();
      }
    }, 1000);
  }

  private _limpiarTimer(): void {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  }

  // ── Generación de CIP ──────────────────────────────────────────
  private _generarCIP(): void {
    this.cipGenerado = String(Math.floor(10000000 + Math.random() * 90000000));
    const vence = new Date();
    vence.setDate(vence.getDate() + 2);
    this.cipVencimiento = vence.toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  // ── Helpers privados ───────────────────────────────────────────
  private _limpiarCamposTarjeta(): void {
    this.tipoTarjeta = null;
    this.tipoTarjetaDetectado = null;
    this.numeroTarjeta = '';
    this.nombreTitular = '';
    this.vencimiento = '';
    this.cvv = '';
    this.cuotasSeleccionadas = '1';
  }

  private _limpiarFormulario(): void {
    this.montoSeleccionado = null;
    this.montoPersonalizado = null;
    this.metodoPago = null;
    this._limpiarCamposTarjeta();
  }

  // ── Historial modal ────────────────────────────────────────────
  historialAbierto: boolean = false;
  historialFiltro: string | null = null;
  historialBusqueda: string = '';

  abrirHistorial(): void {
    this.historialAbierto = true;
    this.historialFiltro = null;
    this.historialBusqueda = '';
    this.cdr.detectChanges();
  }

  cerrarHistorial(): void {
    this.historialAbierto = false;
    this.cdr.detectChanges();
  }

  cerrarHistorialSiOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cerrarHistorial();
    }
  }

  get recargasFiltradas(): Recarga[] {
    return this.ultimasRecargas.filter(r => {
      const metodoLower = r.metodo.toLowerCase();
      const porMetodo = !this.historialFiltro ||
        (this.historialFiltro === 'pagoefectivo'
          ? (metodoLower.includes('pagoefectivo') || metodoLower.includes('pago efectivo'))
          : metodoLower.includes(this.historialFiltro));
      const busq = this.historialBusqueda.toLowerCase().trim();
      const porBusqueda = !busq ||
        r.metodo.toLowerCase().includes(busq) ||
        r.fecha.toLowerCase().includes(busq);
      return porMetodo && porBusqueda;
    });
  }

  get totalRecargasFiltradas(): number {
    return this.recargasFiltradas.reduce((acc, r) => acc + r.monto, 0);
  }

  get promedioRecargasFiltradas(): number {
    if (!this.recargasFiltradas.length) return 0;
    return this.totalRecargasFiltradas / this.recargasFiltradas.length;
  }

  getMetodoIcono(metodo: string): string | null {
    const m = (metodo || '').toLowerCase();
    if (m.includes('yape'))         return 'Yape-Logo.png';
    if (m.includes('plin'))         return 'Plin-Logo.png';
    if (m.includes('pagoefectivo') || m.includes('pago efectivo'))
                                     return 'Pagoefectivo-Logo.png';
    if (m.includes('tarjeta'))      return 'Tarjetacredito-Logo.png';
    return null;
  }

  getClaseMetodo(metodo: string): string {
    const m = (metodo || '').toLowerCase();
    if (m.includes('yape'))         return 'historial-modal__icon icon--yape';
    if (m.includes('plin'))         return 'historial-modal__icon icon--plin';
    if (m.includes('pagoefectivo') || m.includes('pago efectivo'))
                                     return 'historial-modal__icon icon--pagoefectivo';
    return 'historial-modal__icon icon--tarjeta';
  }

  // ── Navegación ─────────────────────────────────────────────────
  irInicio(): void {
    this.router.navigate(['/inicio']);
  }

  onLogout(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }
}