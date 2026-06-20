import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth';
import {
  UsuarioAdminService,
  UsuarioAdminListado,
  RolOption,
} from '../../../services/usuario-admin';

// ── Tipos ──────────────────────────────────────────────────────────────────────

export type EstadoUsuario = 'activo' | 'baja' | 'suspendido';

// Vista local de un usuario, ya con los campos calculados (badge, iniciales, etc.)
// que el HTML espera. Se construye a partir de UsuarioAdminListado (el DTO real
// que devuelve el backend).
export interface UsuarioVM {
  id:              number;
  nombre:          string;
  iniciales:       string;
  saldo:           number;
  fechaRegistro:   string;
  estado:          EstadoUsuario;
  estadoLabel:     string;
  estadoClass:     string;
  idRol:           number;
  rolLabel:        string;
  rolClass:        string;
  correo?:         string;
  telefono?:       string;
  tipoDocumento?:  string;
  nroDocumento?:   string;
}

// Formulario de edición (campos editables)
export interface FormEditar {
  nombres:       string;
  apellidos:     string;
  correo:        string;
  telefono:      string;
  tipoDocumento: string;
  nroDocumento:  string;
  idRol:         number | null;
  estado:        string;
  saldo:         number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

// Convención de Usuario.estado en BD: 1=Activo, 0=Baja, 2=Suspendido
function estadoNumeroATexto(estado: number): EstadoUsuario {
  if (estado === 1) return 'activo';
  if (estado === 2) return 'suspendido';
  return 'baja';
}

function estadoTextoANumero(estado: EstadoUsuario): number {
  if (estado === 'activo') return 1;
  if (estado === 'suspendido') return 2;
  return 0;
}

function estadoMeta(estado: EstadoUsuario): { estadoLabel: string; estadoClass: string } {
  const map: Record<EstadoUsuario, { estadoLabel: string; estadoClass: string }> = {
    activo:     { estadoLabel: 'Activo',     estadoClass: 'activo'     },
    baja:       { estadoLabel: 'Baja',       estadoClass: 'baja'       },
    suspendido: { estadoLabel: 'Suspendido', estadoClass: 'suspendido' },
  };
  return map[estado];
}

// La clase CSS del badge de rol se calcula a partir del nombre real que
// devuelve la BD (Rol.nombre_rol), no de un enum fijo, para no romper si
// agregan/renombran roles. Si no reconoce el rol, cae a una clase neutra.
function rolClassDesdeNombre(nombreRol: string): string {
  const n = (nombreRol || '').toLowerCase();
  if (n.includes('admin'))      return 'admin';
  if (n.includes('operario'))   return 'operario';
  if (n.includes('conductor'))  return 'conductor';
  return 'usuario';
}

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');
}

function aVM(u: UsuarioAdminListado): UsuarioVM {
  const estado = estadoNumeroATexto(u.estado);
  return {
    id:             u.id,
    nombre:         u.nombreCompleto,
    iniciales:      iniciales(u.nombreCompleto),
    saldo:          u.saldo,
    fechaRegistro:  u.fechaRegistro,
    estado,
    estadoLabel:    u.estadoLabel,
    estadoClass:    estadoMeta(estado).estadoClass,
    idRol:          u.idRol,
    rolLabel:       u.nombreRol,
    rolClass:       rolClassDesdeNombre(u.nombreRol),
    correo:         u.correo,
    telefono:       u.telefono,
    tipoDocumento:  u.tipoDocumento,
    nroDocumento:   u.nroDocumento,
  };
}

// ── Componente ─────────────────────────────────────────────────────────────────

@Component({
  selector:    'app-gestionar-usuarios',
  standalone:  true,
  imports:     [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './gestionar-usuarios.html',
  styleUrl:    './gestionar-usuarios.css',
})
export class GestionarUsuariosComponent implements OnInit {

  busqueda: string = '';

  usuariosFiltrados: UsuarioVM[] = [];
  roles: RolOption[] = [];

  totalUsuarios = 0;
  pagina = 1;
  tamPagina = 10;
  cargando = false;
  error: string | null = null;

  // ── Estados de modales ──────────────────────────────────────────────────────
  modalEliminarAbierto = false;
  modalEditarAbierto   = false;
  modalVerAbierto      = false;
  guardandoEdicion     = false;

  usuarioSeleccionado: UsuarioVM | null = null;
  formEditar: FormEditar | null = null;

  // ── Paginación ───────────────────────────────────────────────────────────────
  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.totalUsuarios / this.tamPagina));
  }

  constructor(
    private usuarioAdminService: UsuarioAdminService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarRoles();
    this.cargarUsuarios();
  }

  // ── Carga de datos ───────────────────────────────────────────────────────────

  private cargarRoles(): void {
    this.usuarioAdminService.listarRoles().subscribe({
      next: roles => this.roles = roles,
      error: () => { /* el select de rol simplemente quedará vacío */ },
    });
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.error = null;

    this.usuarioAdminService.listar(this.busqueda, this.pagina, this.tamPagina).subscribe({
      next: res => {
        this.usuariosFiltrados = res.usuarios.map(aVM);
        this.totalUsuarios = res.total;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la lista de usuarios.';
        this.cargando = false;
      },
    });
  }

  // ── Filtrado (vía backend, con debounce simple desde el input) ──────────────

  filtrar(): void {
    this.pagina = 1;
    this.cargarUsuarios();
  }

  // ── Paginación ───────────────────────────────────────────────────────────────

  paginaAnterior(): void {
    if (this.pagina <= 1) return;
    this.pagina--;
    this.cargarUsuarios();
  }

  paginaSiguiente(): void {
    if (this.pagina >= this.totalPaginas) return;
    this.pagina++;
    this.cargarUsuarios();
  }

  irAPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas || n === this.pagina) return;
    this.pagina = n;
    this.cargarUsuarios();
  }

  // ── Modal ELIMINAR ──────────────────────────────────────────────────────────

  abrirModalEliminar(usuario: UsuarioVM): void {
    this.usuarioSeleccionado = usuario;
    this.modalEliminarAbierto = true;
  }

  cerrarModalEliminar(): void {
    this.modalEliminarAbierto = false;
    this.usuarioSeleccionado = null;
  }

  cerrarModalEliminarSiOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('gu-modal-overlay')) {
      this.cerrarModalEliminar();
    }
  }

  confirmarEliminar(): void {
    if (!this.usuarioSeleccionado) return;
    const id = this.usuarioSeleccionado.id;

    this.usuarioAdminService.eliminar(id).subscribe({
      next: () => {
        this.cerrarModalEliminar();
        this.cargarUsuarios();
      },
      error: () => {
        this.error = 'No se pudo eliminar el usuario.';
        this.cerrarModalEliminar();
      },
    });
  }

  // ── Modal EDITAR ────────────────────────────────────────────────────────────

  abrirModalEditar(usuario: UsuarioVM): void {
    this.usuarioSeleccionado = usuario;

    // Pedimos el detalle completo al backend (trae nombres/apellidos por
    // separado, en vez de tener que partir el "nombre" combinado del listado).
    this.usuarioAdminService.obtener(usuario.id).subscribe({
      next: detalle => {
        this.formEditar = {
          nombres:       detalle.nombres,
          apellidos:     detalle.apellidos,
          correo:        detalle.correo,
          telefono:      detalle.telefono ?? '',
          tipoDocumento: detalle.tipoDocumento ?? '',
          nroDocumento:  detalle.nroDocumento ?? '',
          idRol:         detalle.idRol,
          estado:        estadoNumeroATexto(detalle.estado),
          saldo:         detalle.saldo,
        };
        this.modalEditarAbierto = true;
      },
      error: () => {
        this.error = 'No se pudo cargar el detalle del usuario.';
      },
    });
  }

  cerrarModalEditar(): void {
    this.modalEditarAbierto = false;
    this.formEditar = null;
    this.usuarioSeleccionado = null;
  }

  cerrarModalEditarSiOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('gu-modal-overlay')) {
      this.cerrarModalEditar();
    }
  }

  guardarEdicion(): void {
    if (!this.formEditar || !this.usuarioSeleccionado) return;
    if (!this.formEditar.nombres || !this.formEditar.apellidos
        || !this.formEditar.correo || !this.formEditar.idRol) {
      this.error = 'Completa todos los campos obligatorios.';
      return;
    }

    const id = this.usuarioSeleccionado.id;
    this.guardandoEdicion = true;

    this.usuarioAdminService.editar(id, {
      nombres:       this.formEditar.nombres,
      apellidos:     this.formEditar.apellidos,
      correo:        this.formEditar.correo,
      telefono:      this.formEditar.telefono,
      tipoDocumento: this.formEditar.tipoDocumento,
      nroDocumento:  this.formEditar.nroDocumento,
      idRol:         this.formEditar.idRol,
      estado:        estadoTextoANumero(this.formEditar.estado as EstadoUsuario),
    }).subscribe({
      next: () => {
        this.guardandoEdicion = false;
        this.cerrarModalEditar();
        this.cargarUsuarios();
      },
      error: (err) => {
        this.guardandoEdicion = false;
        this.error = err?.error?.message || 'No se pudo guardar la edición.';
      },
    });
  }

  // ── Modal VER DETALLE ───────────────────────────────────────────────────────

  abrirModalVer(usuario: UsuarioVM): void {
    this.usuarioSeleccionado = usuario;
    this.modalVerAbierto = true;
  }

  cerrarModalVer(): void {
    this.modalVerAbierto = false;
    this.usuarioSeleccionado = null;
  }

  cerrarModalVerSiOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('gu-modal-overlay')) {
      this.cerrarModalVer();
    }
  }

  // Abrir editar desde el modal de ver
  editarDesdeVer(): void {
    const usuario = this.usuarioSeleccionado!;  // guardar ref antes de cerrar
    this.modalVerAbierto = false;               // cerrar Ver sin nullear el usuario
    this.usuarioSeleccionado = null;
    this.cdr.detectChanges();                   // forzar que Angular quite el modal Ver del DOM
    this.abrirModalEditar(usuario);             // abrir Editar con el usuario correcto
  }

  // ── Navegación ──────────────────────────────────────────────────────────────

  irA(seccion: string): void {
    this.router.navigate([`/${seccion}`]);
  }

  onLogout(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }
}