import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar';

// ── Tipos ──────────────────────────────────────────────────────────────────────

export type EstadoUsuario = 'activo' | 'baja' | 'suspendido';
export type RolUsuario    = 'Pasajero' | 'Operador' | 'Administrador';

export interface Usuario {
  id:              number;
  nombre:          string;
  iniciales:       string;
  avatarUrl?:      string;
  saldo:           number;
  fechaRegistro:   string;
  estado:          EstadoUsuario;
  estadoLabel:     string;
  estadoClass:     string;
  rol:             RolUsuario;
  rolLabel:        string;
  rolClass:        string;
  // Campos extra del schema Oracle
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
  rol:           string;
  estado:        string;
  saldo:         number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function estadoMeta(estado: EstadoUsuario): { estadoLabel: string; estadoClass: string } {
  const map: Record<EstadoUsuario, { estadoLabel: string; estadoClass: string }> = {
    activo:     { estadoLabel: 'Activo',     estadoClass: 'activo'     },
    baja:       { estadoLabel: 'Baja',       estadoClass: 'baja'       },
    suspendido: { estadoLabel: 'Suspendido', estadoClass: 'suspendido' },
  };
  return map[estado];
}

function rolMeta(rol: RolUsuario): { rolLabel: string; rolClass: string } {
  const map: Record<RolUsuario, { rolLabel: string; rolClass: string }> = {
    Pasajero:       { rolLabel: 'Pasajero',      rolClass: 'pasajero'  },
    Operador:       { rolLabel: 'Operador',       rolClass: 'operador'  },
    Administrador:  { rolLabel: 'Administrador',  rolClass: 'admin'     },
  };
  return map[rol];
}

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');
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

  // ── Datos mock (reemplazar con llamada a servicio) ──────────────────────────
  private todosLosUsuarios: Usuario[] = [
    { id: 1,  nombre: 'Jorge Luis Machado Flores',  iniciales: 'JM', saldo: 15.00, fechaRegistro: '12 Ene 2024', estado: 'baja',       ...estadoMeta('baja'),       rol: 'Pasajero',      ...rolMeta('Pasajero'),      correo: 'j.machado@gmail.com',  telefono: '987654321', tipoDocumento: 'DNI', nroDocumento: '45678901' },
    { id: 2,  nombre: 'Yerami Medina Quispe',       iniciales: 'YM', saldo: 15.00, fechaRegistro: '15 Ene 2024', estado: 'baja',       ...estadoMeta('baja'),       rol: 'Pasajero',      ...rolMeta('Pasajero'),      correo: 'yerami.mq@gmail.com',  telefono: '912345678', tipoDocumento: 'DNI', nroDocumento: '46789012' },
    { id: 3,  nombre: 'Carlos Alberto Paredes',     iniciales: 'CP', saldo: 15.00, fechaRegistro: '03 Feb 2024', estado: 'baja',       ...estadoMeta('baja'),       rol: 'Pasajero',      ...rolMeta('Pasajero'),      correo: 'c.paredes@hotmail.com', telefono: '',          tipoDocumento: 'DNI', nroDocumento: '47890123' },
    { id: 4,  nombre: 'Lucía Ríos Torres',          iniciales: 'LR', saldo: 15.00, fechaRegistro: '20 Feb 2024', estado: 'baja',       ...estadoMeta('baja'),       rol: 'Pasajero',      ...rolMeta('Pasajero'),      correo: 'lucia.rt@gmail.com',   telefono: '934567890', tipoDocumento: 'DNI', nroDocumento: '48901234' },
    { id: 5,  nombre: 'Miguel Alonzo Huanca',       iniciales: 'MA', saldo: 15.00, fechaRegistro: '08 Mar 2024', estado: 'activo',     ...estadoMeta('activo'),     rol: 'Operador',      ...rolMeta('Operador'),      correo: 'm.huanca@corredor.pe', telefono: '956789012', tipoDocumento: 'DNI', nroDocumento: '49012345' },
    { id: 6,  nombre: 'Patricia Vega Salcedo',      iniciales: 'PV', saldo: 32.50, fechaRegistro: '22 Mar 2024', estado: 'activo',     ...estadoMeta('activo'),     rol: 'Pasajero',      ...rolMeta('Pasajero'),      correo: 'pvega@gmail.com',      telefono: '978901234', tipoDocumento: 'CE',  nroDocumento: 'CE001122' },
    { id: 7,  nombre: 'Rodrigo Castillo Mendoza',   iniciales: 'RC', saldo: 8.00,  fechaRegistro: '01 Abr 2024', estado: 'activo',     ...estadoMeta('activo'),     rol: 'Operador',      ...rolMeta('Operador'),      correo: 'r.castillo@corredor.pe', telefono: '900123456', tipoDocumento: 'DNI', nroDocumento: '50123456' },
    { id: 8,  nombre: 'Sofía Mamani Apaza',         iniciales: 'SM', saldo: 21.00, fechaRegistro: '14 Abr 2024', estado: 'activo',     ...estadoMeta('activo'),     rol: 'Pasajero',      ...rolMeta('Pasajero'),      correo: 'sofia.ma@gmail.com',   telefono: '921234567', tipoDocumento: 'DNI', nroDocumento: '51234567' },
    { id: 9,  nombre: 'Diego Flores Cárdenas',      iniciales: 'DF', saldo: 5.50,  fechaRegistro: '30 Abr 2024', estado: 'activo',     ...estadoMeta('activo'),     rol: 'Pasajero',      ...rolMeta('Pasajero'),      correo: 'd.flores@gmail.com',   telefono: '',          tipoDocumento: 'DNI', nroDocumento: '52345678' },
    { id: 10, nombre: 'Ana Lucía Herrera Ramos',    iniciales: 'AH', saldo: 15.00, fechaRegistro: '05 May 2024', estado: 'suspendido', ...estadoMeta('suspendido'), rol: 'Pasajero',      ...rolMeta('Pasajero'),      correo: 'ana.hr@gmail.com',     telefono: '943456789', tipoDocumento: 'DNI', nroDocumento: '53456789' },
    { id: 11, nombre: 'Ernesto Tapia Villanueva',   iniciales: 'ET', saldo: 15.00, fechaRegistro: '18 May 2024', estado: 'suspendido', ...estadoMeta('suspendido'), rol: 'Administrador', ...rolMeta('Administrador'), correo: 'e.tapia@corredor.pe',  telefono: '964567890', tipoDocumento: 'DNI', nroDocumento: '54567890' },
    { id: 12, nombre: 'Claudia Soto Quiroz',        iniciales: 'CS', saldo: 15.00, fechaRegistro: '02 Jun 2024', estado: 'suspendido', ...estadoMeta('suspendido'), rol: 'Pasajero',      ...rolMeta('Pasajero'),      correo: 'c.soto@gmail.com',     telefono: '',          tipoDocumento: 'CE',  nroDocumento: 'CE003344' },
    { id: 13, nombre: 'Héctor Quispe Lazo',         iniciales: 'HQ', saldo: 15.00, fechaRegistro: '19 Jun 2024', estado: 'suspendido', ...estadoMeta('suspendido'), rol: 'Operador',      ...rolMeta('Operador'),      correo: 'h.quispe@corredor.pe', telefono: '975678901', tipoDocumento: 'DNI', nroDocumento: '55678901' },
  ];

  usuariosFiltrados: Usuario[] = [];

  get totalUsuarios(): number {
    return this.todosLosUsuarios.length;
  }

  // ── Estados de modales ──────────────────────────────────────────────────────
  modalEliminarAbierto = false;
  modalEditarAbierto   = false;
  modalVerAbierto      = false;

  usuarioSeleccionado: Usuario | null = null;
  formEditar: FormEditar | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.usuariosFiltrados = [...this.todosLosUsuarios];
  }

  // ── Filtrado ────────────────────────────────────────────────────────────────

  filtrar(): void {
    const busq = this.busqueda.toLowerCase().trim();
    this.usuariosFiltrados = busq
      ? this.todosLosUsuarios.filter(u => u.nombre.toLowerCase().includes(busq))
      : [...this.todosLosUsuarios];
  }

  // ── Modal ELIMINAR ──────────────────────────────────────────────────────────

  abrirModalEliminar(usuario: Usuario): void {
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
    // TODO: llamar al servicio DELETE /usuarios/:id
    console.log('Eliminar usuario:', this.usuarioSeleccionado.id, this.usuarioSeleccionado.nombre);
    this.todosLosUsuarios = this.todosLosUsuarios.filter(u => u.id !== this.usuarioSeleccionado!.id);
    this.filtrar();
    this.cerrarModalEliminar();
  }

  // ── Modal EDITAR ────────────────────────────────────────────────────────────

  abrirModalEditar(usuario: Usuario): void {
    this.usuarioSeleccionado = usuario;
    // Separar nombre completo en nombres / apellidos (split por primer espacio de la segunda palabra)
    const partes = usuario.nombre.trim().split(' ');
    const nombres   = partes.slice(0, 2).join(' ');
    const apellidos = partes.slice(2).join(' ');
    this.formEditar = {
      nombres,
      apellidos,
      correo:        usuario.correo        ?? '',
      telefono:      usuario.telefono      ?? '',
      tipoDocumento: usuario.tipoDocumento ?? '',
      nroDocumento:  usuario.nroDocumento  ?? '',
      rol:           usuario.rol,
      estado:        usuario.estado,
      saldo:         usuario.saldo,
    };
    this.modalEditarAbierto = true;
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
    if (!this.formEditar.nombres || !this.formEditar.apellidos || !this.formEditar.correo || !this.formEditar.rol) {
      // TODO: mostrar validación
      return;
    }

    // Construir nombre completo
    const nombreCompleto = `${this.formEditar.nombres} ${this.formEditar.apellidos}`.trim();
    const estado = this.formEditar.estado as EstadoUsuario;
    const rol    = this.formEditar.rol    as RolUsuario;

    // Actualizar en el array local
    const idx = this.todosLosUsuarios.findIndex(u => u.id === this.usuarioSeleccionado!.id);
    if (idx !== -1) {
      this.todosLosUsuarios[idx] = {
        ...this.todosLosUsuarios[idx],
        nombre:        nombreCompleto,
        iniciales:     iniciales(nombreCompleto),
        correo:        this.formEditar.correo,
        telefono:      this.formEditar.telefono,
        tipoDocumento: this.formEditar.tipoDocumento,
        nroDocumento:  this.formEditar.nroDocumento,
        rol,
        estado,
        ...estadoMeta(estado),
        ...rolMeta(rol),
      };
    }

    // TODO: llamar al servicio PUT /usuarios/:id
    console.log('Guardar edición:', this.usuarioSeleccionado.id, this.formEditar);
    this.filtrar();
    this.cerrarModalEditar();
  }

  // ── Modal VER DETALLE ───────────────────────────────────────────────────────

  abrirModalVer(usuario: Usuario): void {
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
    const usuario = this.usuarioSeleccionado;
    this.cerrarModalVer();
    if (usuario) {
      setTimeout(() => this.abrirModalEditar(usuario), 50);
    }
  }

  // ── Navegación ──────────────────────────────────────────────────────────────

  irA(seccion: string): void {
    this.router.navigate([`/${seccion}`]);
  }

  onLogout(): void {
    this.router.navigate(['/login']);
  }
}