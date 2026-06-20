import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NavbarComponent } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth';

// ── Modelos usados por el template ─────────────────────────────────────────────

export type TipoComunicado = 'texto' | 'imagen' | 'imagen_texto';

/** Comunicado programado (próxima publicación), agrupado por tipo en la parte superior. */
export interface ComunicadoProgramado {
  id: number;
  tipo: TipoComunicado;
  titulo: string;
  descripcion: string;
  imagen: string | null;
  publicacionLabel: string; // ej: "Se publicará el Lunes 7:00 am"
}

/** Fila del historial de comunicados ya publicados/programados. */
export interface ComunicadoHistorial {
  id: number;
  tipo: TipoComunicado;
  titulo: string | null;
  descripcion: string | null;
  tieneImagen: boolean;
  fechaPublicacion: string;
}

const TIPO_LABEL: Record<TipoComunicado, string> = {
  texto: 'De texto',
  imagen: 'De imagen',
  imagen_texto: 'De imagen y texto'
};

type FiltroTipo = 'Todos' | TipoComunicado;

// ── Componente ──────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-gestionar-comunicados',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './gestionar-comunicados.html',
  styleUrl: './gestionar-comunicados.css'
})
export class GestionarComunicadosComponent implements OnInit, OnDestroy {

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  // ── Etiquetas de tipo (para el template) ────────────────────────────────────
  readonly tipoLabel = TIPO_LABEL;

  // ── Comunicados programados (parte superior, agrupados por tipo) ───────────
  comunicadosTexto: ComunicadoProgramado[] = [];
  comunicadosImagen: ComunicadoProgramado[] = [];
  comunicadosImagenTexto: ComunicadoProgramado[] = [];

  cargando = false;
  error = '';

  // ── Búsqueda de comunicados programados ─────────────────────────────────────
  busqueda = '';

  // ── Historial ────────────────────────────────────────────────────────────────
  historialCompleto: ComunicadoHistorial[] = [];
  historialFiltrado: ComunicadoHistorial[] = [];
  historialPagina: ComunicadoHistorial[] = [];

  busquedaHistorial = '';
  desde = '';
  hasta = '';
  filtroTipo: FiltroTipo = 'Todos';
  dropdownTipoAbierto = false;
  readonly opcionesTipo: FiltroTipo[] = ['Todos', 'texto', 'imagen', 'imagen_texto'];

  readonly itemsPorPagina = 8;
  paginaActual = 1;
  totalPaginas = 1;
  paginasVisibles: (number | '...')[] = [];

  private busquedaSubject = new Subject<void>();

  // ── Modal cancelar publicación (para los comunicados programados) ──────────
  modalCancelarAbierto = false;
  comunicadoACancelar: ComunicadoProgramado | null = null;
  cancelando = false;

  // ── Modal ver detalle (desde el historial) ──────────────────────────────────
  modalVerAbierto = false;
  comunicadoVer: ComunicadoHistorial | null = null;

  // ── Modal reprogramar publicación ────────────────────────────────────────────
  modalReprogramarAbierto = false;
  comunicadoAReprogramar: ComunicadoProgramado | null = null;
  reprogramando = false;
  nuevaFecha = '';
  nuevaHora = '';

  // ── Modal agregar / editar comunicado ────────────────────────────────────────
  modalFormAbierto = false;
  modoFormulario: 'crear' | 'editar' = 'crear';
  comunicadoAEditar: ComunicadoProgramado | null = null;
  guardando = false;
  formComunicado = { tipo: 'texto' as TipoComunicado, titulo: '', descripcion: '', fecha: '', hora: '' };
  readonly tiposComunicado: TipoComunicado[] = ['texto', 'imagen', 'imagen_texto'];

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.busquedaSubject.pipe(debounceTime(300)).subscribe(() => {
      this.paginaActual = 1;
      this.aplicarFiltrosHistorial();
    });

    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.busquedaSubject.complete();
  }

  // ── Carga de datos ───────────────────────────────────────────────────────────
  // NOTA: por ahora se usan datos de ejemplo (mock) replicando el diseño de Figma.
  // Cuando exista el backend (ComunicadoAdminService), basta reemplazar este
  // método por las llamadas HTTP correspondientes, siguiendo el mismo patrón
  // que NoticiaAdminService (listar / crear / cancelar / eliminar).
  private cargarDatos(): void {
    this.cargando = true;
    this.error = '';

    const descripcionBase =
      'Después de varios días fuera de operación, las líneas 301, 302, 303, 304 y 305 del Corredor Azul vuelven a estar disponibles. Agradecemos la comprensión de todos los usuarios.';
    const tituloBase = 'Comunicado General sobre el Servicio del Corredor Azul';
    const imagenYapa = 'viaja-con-yapa.png';

    this.comunicadosTexto = [
      { id: 1, tipo: 'texto', titulo: tituloBase, descripcion: descripcionBase, imagen: null, publicacionLabel: 'Se publicará el Lunes 7:00 am' },
      { id: 2, tipo: 'texto', titulo: tituloBase, descripcion: descripcionBase, imagen: null, publicacionLabel: 'Se publicará el Lunes 7:00 am' },
      { id: 3, tipo: 'texto', titulo: tituloBase, descripcion: descripcionBase, imagen: null, publicacionLabel: 'Se publicará el Lunes 7:00 am' },
    ];

    this.comunicadosImagen = [
      { id: 4, tipo: 'imagen', titulo: '', descripcion: '', imagen: imagenYapa, publicacionLabel: 'Se publicará el Lunes 7:00 am' },
      { id: 5, tipo: 'imagen', titulo: '', descripcion: '', imagen: imagenYapa, publicacionLabel: 'Se publicará el Lunes 7:00 am' },
      { id: 6, tipo: 'imagen', titulo: '', descripcion: '', imagen: imagenYapa, publicacionLabel: 'Se publicará el Lunes 7:00 am' },
    ];

    this.comunicadosImagenTexto = [
      { id: 7, tipo: 'imagen_texto', titulo: tituloBase, descripcion: descripcionBase, imagen: imagenYapa, publicacionLabel: 'Se publicará el Lunes 7:00 am' },
      { id: 8, tipo: 'imagen_texto', titulo: tituloBase, descripcion: descripcionBase, imagen: imagenYapa, publicacionLabel: 'Se publicará el Lunes 7:00 am' },
      { id: 9, tipo: 'imagen_texto', titulo: tituloBase, descripcion: descripcionBase, imagen: imagenYapa, publicacionLabel: 'Se publicará el Lunes 7:00 am' },
    ];

    // Historial (10 filas de ejemplo replicando la tabla del diseño)
    this.historialCompleto = [
      { id: 101, tipo: 'texto',        titulo: tituloBase, descripcion: descripcionBase, tieneImagen: false, fechaPublicacion: 'Hoy, 08:14 am' },
      { id: 102, tipo: 'imagen',       titulo: null,        descripcion: null,            tieneImagen: true,  fechaPublicacion: 'Hoy, 08:14 am' },
      { id: 103, tipo: 'imagen_texto', titulo: tituloBase, descripcion: null,            tieneImagen: true,  fechaPublicacion: 'Hoy, 08:14 am' },
      { id: 104, tipo: 'imagen_texto', titulo: tituloBase, descripcion: descripcionBase, tieneImagen: true,  fechaPublicacion: 'Hoy, 08:14 am' },
      { id: 105, tipo: 'imagen',       titulo: null,        descripcion: null,            tieneImagen: true,  fechaPublicacion: 'Hoy, 08:14 am' },
      { id: 106, tipo: 'imagen_texto', titulo: tituloBase, descripcion: descripcionBase, tieneImagen: true,  fechaPublicacion: 'Hoy, 08:14 am' },
      { id: 107, tipo: 'texto',        titulo: tituloBase, descripcion: descripcionBase, tieneImagen: false, fechaPublicacion: 'Hoy, 08:14 am' },
      { id: 108, tipo: 'imagen_texto', titulo: null,        descripcion: null,            tieneImagen: true,  fechaPublicacion: 'Hoy, 08:14 am' },
      { id: 109, tipo: 'imagen',       titulo: null,        descripcion: null,            tieneImagen: true,  fechaPublicacion: 'Hoy, 08:14 am' },
      { id: 110, tipo: 'imagen_texto', titulo: tituloBase, descripcion: null,            tieneImagen: true,  fechaPublicacion: 'Hoy, 08:14 am' },
    ];

    this.aplicarFiltrosHistorial();
    this.cargando = false;
  }

  // ── Navegación ────────────────────────────────────────────────────────────────
  irInicio(): void { this.router.navigate(['/inicia']); }

  onLogout(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }

  // ── Modal agregar / editar comunicado ────────────────────────────────────────
  abrirModalCrear(): void {
    this.modoFormulario = 'crear';
    this.comunicadoAEditar = null;
    this.formComunicado = { tipo: 'texto', titulo: '', descripcion: '', fecha: '', hora: '' };
    this.guardando = false;
    this.modalFormAbierto = true;
  }

  abrirModalEditar(c: ComunicadoProgramado): void {
    this.modoFormulario = 'editar';
    this.comunicadoAEditar = c;
    const partes = c.publicacionLabel.match(/(\d{4}-\d{2}-\d{2})|(\d{2}:\d{2})/g);
    this.formComunicado = {
      tipo: c.tipo,
      titulo: c.titulo,
      descripcion: c.descripcion,
      fecha: partes?.[0] ?? '',
      hora: partes?.[1] ?? ''
    };
    this.guardando = false;
    this.modalFormAbierto = true;
  }

  cerrarModalFormSiOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('gc-modal-overlay')) {
      this.cerrarModalForm();
    }
  }

  cerrarModalForm(): void {
    if (this.guardando) return;
    this.modalFormAbierto = false;
    this.comunicadoAEditar = null;
  }

  formValido(): boolean {
    const f = this.formComunicado;
    if (!f.fecha || !f.hora) return false;
    if (f.tipo !== 'imagen' && !f.titulo.trim()) return false;
    return true;
  }

  guardarComunicado(): void {
    if (!this.formValido()) return;
    this.guardando = true;

    const f = this.formComunicado;
    const fechaObj = new Date(`${f.fecha}T${f.hora}`);
    const label = `Se publicará el ${fechaObj.toLocaleString('es-PE', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}`;

    if (this.modoFormulario === 'crear') {
      // TODO: reemplazar por llamada HTTP al backend
      const nuevo: ComunicadoProgramado = {
        id: Date.now(),
        tipo: f.tipo,
        titulo: f.titulo,
        descripcion: f.descripcion,
        imagen: f.tipo !== 'texto' ? 'publicidad.jpeg' : null,
        publicacionLabel: label
      };
      if (f.tipo === 'texto')        this.comunicadosTexto = [...this.comunicadosTexto, nuevo];
      if (f.tipo === 'imagen')       this.comunicadosImagen = [...this.comunicadosImagen, nuevo];
      if (f.tipo === 'imagen_texto') this.comunicadosImagenTexto = [...this.comunicadosImagenTexto, nuevo];
    } else {
      // TODO: reemplazar por llamada HTTP al backend
      const id = this.comunicadoAEditar!.id;
      const actualizar = (lista: ComunicadoProgramado[]) =>
        lista.map(c => c.id === id ? { ...c, ...f, imagen: f.tipo !== 'texto' ? 'publicidad.jpeg' : null, publicacionLabel: label } : c);
      this.comunicadosTexto       = actualizar(this.comunicadosTexto);
      this.comunicadosImagen      = actualizar(this.comunicadosImagen);
      this.comunicadosImagenTexto = actualizar(this.comunicadosImagenTexto);
    }

    this.guardando = false;
    this.modalFormAbierto = false;
    this.comunicadoAEditar = null;
  }

  // ── Modal reprogramar publicación ────────────────────────────────────────────
  abrirModalReprogramar(c: ComunicadoProgramado): void {
    this.comunicadoAReprogramar = c;
    this.nuevaFecha = '';
    this.nuevaHora = '';
    this.reprogramando = false;
    this.modalReprogramarAbierto = true;
  }

  cerrarModalReprogramarSiOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('gc-modal-overlay')) {
      this.cerrarModalReprogramar();
    }
  }

  cerrarModalReprogramar(): void {
    if (this.reprogramando) return;
    this.modalReprogramarAbierto = false;
    this.comunicadoAReprogramar = null;
  }

  ejecutarReprogramar(): void {
    if (!this.comunicadoAReprogramar || !this.nuevaFecha || !this.nuevaHora) return;
    this.reprogramando = true;

    // TODO: reemplazar por this.comunicadoService.reprogramar(id, fecha, hora).subscribe(...)
    const label = `Se publicará el ${new Date(`${this.nuevaFecha}T${this.nuevaHora}`).toLocaleString('es-PE', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}`;
    const id = this.comunicadoAReprogramar.id;
    const actualizar = (lista: ComunicadoProgramado[]) =>
      lista.map(c => c.id === id ? { ...c, publicacionLabel: label } : c);

    this.comunicadosTexto = actualizar(this.comunicadosTexto);
    this.comunicadosImagen = actualizar(this.comunicadosImagen);
    this.comunicadosImagenTexto = actualizar(this.comunicadosImagenTexto);

    this.reprogramando = false;
    this.modalReprogramarAbierto = false;
    this.comunicadoAReprogramar = null;
  }

  /** Botón "Reutilizar" en historial → página de creación con datos pre-cargados. */
  reutilizarComunicado(h: ComunicadoHistorial): void {
    this.router.navigate(['/admin/comunicados/crear'], {
      queryParams: {
        reutilizar: h.id,
        tipo: h.tipo,
        titulo: h.titulo ?? '',
        descripcion: h.descripcion ?? '',
        tieneImagen: h.tieneImagen ? '1' : '0'
      }
    });
  }

  // ── Búsqueda comunicados programados (cliente) ──────────────────────────────
  get comunicadosTextoFiltrados(): ComunicadoProgramado[] {
    return this.filtrarProgramados(this.comunicadosTexto);
  }
  get comunicadosImagenFiltrados(): ComunicadoProgramado[] {
    return this.filtrarProgramados(this.comunicadosImagen);
  }
  get comunicadosImagenTextoFiltrados(): ComunicadoProgramado[] {
    return this.filtrarProgramados(this.comunicadosImagenTexto);
  }

  private filtrarProgramados(lista: ComunicadoProgramado[]): ComunicadoProgramado[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter(c =>
      c.titulo.toLowerCase().includes(q) || c.descripcion.toLowerCase().includes(q)
    );
  }

  // ── Modal cancelar publicación ───────────────────────────────────────────────
  confirmarCancelar(comunicado: ComunicadoProgramado): void {
    this.comunicadoACancelar = comunicado;
    this.modalCancelarAbierto = true;
  }

  cerrarModalCancelarSiOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('gc-modal-overlay')) {
      this.cerrarModalCancelar();
    }
  }

  cerrarModalCancelar(): void {
    if (this.cancelando) return;
    this.modalCancelarAbierto = false;
    this.comunicadoACancelar = null;
  }

  ejecutarCancelar(): void {
    if (!this.comunicadoACancelar) return;
    this.cancelando = true;

    const id = this.comunicadoACancelar.id;
    // TODO: reemplazar por this.comunicadoService.cancelarPublicacion(id).subscribe(...)
    this.comunicadosTexto = this.comunicadosTexto.filter(c => c.id !== id);
    this.comunicadosImagen = this.comunicadosImagen.filter(c => c.id !== id);
    this.comunicadosImagenTexto = this.comunicadosImagenTexto.filter(c => c.id !== id);

    this.cancelando = false;
    this.modalCancelarAbierto = false;
    this.comunicadoACancelar = null;
  }

  // ── Historial: filtros ───────────────────────────────────────────────────────
  onBusquedaHistorial(): void {
    this.busquedaSubject.next();
  }

  onFechaCambio(): void {
    this.paginaActual = 1;
    this.aplicarFiltrosHistorial();
  }

  toggleDropdownTipo(): void {
    this.dropdownTipoAbierto = !this.dropdownTipoAbierto;
  }

  seleccionarTipoFiltro(tipo: FiltroTipo): void {
    this.filtroTipo = tipo;
    this.dropdownTipoAbierto = false;
    this.paginaActual = 1;
    this.aplicarFiltrosHistorial();
  }

  etiquetaFiltroTipo(): string {
    return this.filtroTipo === 'Todos' ? 'Tipo de comunicado' : this.tipoLabel[this.filtroTipo];
  }

  private aplicarFiltrosHistorial(): void {
    const q = this.busquedaHistorial.trim().toLowerCase();
    const desdeTs = this.desde ? new Date(this.desde).getTime() : null;
    const hastaTs = this.hasta ? new Date(this.hasta).getTime() : null;

    this.historialFiltrado = this.historialCompleto.filter(h => {
      if (this.filtroTipo !== 'Todos' && h.tipo !== this.filtroTipo) return false;

      if (q) {
        const enTitulo = (h.titulo ?? '').toLowerCase().includes(q);
        const enDescripcion = (h.descripcion ?? '').toLowerCase().includes(q);
        const enTipo = this.tipoLabel[h.tipo].toLowerCase().includes(q);
        if (!enTitulo && !enDescripcion && !enTipo) return false;
      }

      // El mock no trae fecha real parseable; si se conecta al backend,
      // aquí se compara h.fechaPublicacion (ISO) contra desdeTs / hastaTs.
      if (desdeTs || hastaTs) {
        // placeholder de comparación cuando la fecha venga en formato ISO
      }

      return true;
    });

    this.totalPaginas = Math.max(1, Math.ceil(this.historialFiltrado.length / this.itemsPorPagina));
    if (this.paginaActual > this.totalPaginas) this.paginaActual = this.totalPaginas;

    this.calcularPaginaActual();
    this.calcularPaginasVisibles();
  }

  // ── Historial: paginación (cliente) ──────────────────────────────────────────
  private calcularPaginaActual(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    this.historialPagina = this.historialFiltrado.slice(inicio, inicio + this.itemsPorPagina);
  }

  private calcularPaginasVisibles(): void {
    const total = this.totalPaginas;
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
    this.calcularPaginaActual();
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) this.irAPagina(this.paginaActual - 1);
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) this.irAPagina(this.paginaActual + 1);
  }

  // ── Modal ver detalle (historial) ────────────────────────────────────────────
  verDetalle(item: ComunicadoHistorial): void {
    this.comunicadoVer = item;
    this.modalVerAbierto = true;
  }

  cerrarModalVerSiOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('gc-modal-overlay')) {
      this.cerrarModalVer();
    }
  }

  cerrarModalVer(): void {
    this.modalVerAbierto = false;
    this.comunicadoVer = null;
  }

  // ── Helpers de estilo (cards de texto: rotación de 3 colores como en Figma) ──
  colorCardTexto(index: number): 'rosa' | 'lila' | 'verde' {
    const ciclo: Array<'rosa' | 'lila' | 'verde'> = ['rosa', 'lila', 'verde'];
    return ciclo[index % ciclo.length];
  }
}