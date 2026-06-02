import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth';

interface Paradero {
  nombre: string;
  km: number;
}

interface RutaFavorita {
  id: string;
  nombre: string;
  origen: string;
  destino: string;
  linea: string;
  estado: 'En servicio' | 'Limitado' | 'Fuera de servicio';
  duracion: string;
  recorrido: string;
  tipoBus: string;
  frecuencia: string;
  ultimoViaje: string;
  paraderos: Paradero[];
  esFavorita: boolean;
}

interface FormRuta {
  nombre: string;
  origen: string;
  destino: string;
  linea: string;
  estado: 'En servicio' | 'Limitado' | 'Fuera de servicio';
  duracion: string;
  recorrido: string;
  tipoBus: string;
  frecuencia: string;
}

@Component({
  selector: 'app-rutas-favoritas',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './rutas-favoritas.html',
  styleUrl: './rutas-favoritas.css'
})
export class RutasFavoritasComponent implements OnInit {

  busqueda = '';
  tabActivo: 'ida' | 'vuelta' = 'ida';
  filtroActivo: 'todas' | 'activas' | 'inactivas' = 'todas';
  rutaSeleccionada: RutaFavorita | null = null;

  /* ── Modales ── */
  modalAgregarAbierto  = false;
  modalEditarAbierto   = false;
  modalEliminarAbierto = false;
  rutaParaEliminar: RutaFavorita | null = null;
  formRuta: FormRuta = this.formVacio();

  rutas: RutaFavorita[] = [
    {
      id: '1', nombre: 'Casa → Trabajo',
      origen: 'Chorrillos (Terminal)', destino: 'Av. Javier Prado',
      linea: 'Línea 201', estado: 'En servicio',
      duracion: '38 min', recorrido: '18 KM', tipoBus: 'Articulado',
      frecuencia: 'Cada 8 min', ultimoViaje: 'Hoy, 7:45 am', esFavorita: true,
      paraderos: [
        { nombre: 'Chorrillos (Terminal)', km: 0 },
        { nombre: 'Av. Huaylas', km: 1.2 },
        { nombre: 'Av. San Martin', km: 2.5 },
        { nombre: 'Av. Barranco Centro', km: 4.1 },
        { nombre: 'Miraflores – Óvalo Gutiérrez', km: 6.3 },
        { nombre: 'Av. Arequipa', km: 8.0 },
        { nombre: 'Lince – Av. Petit Thouars', km: 9.8 },
        { nombre: 'Av. Javier Prado', km: 11.4 },
      ]
    },
    {
      id: '2', nombre: 'Trabajo → Mercado',
      origen: 'San Isidro – Camino Real', destino: 'La Victoria – Av. México',
      linea: 'Línea 202', estado: 'En servicio',
      duracion: '22 min', recorrido: '9 KM', tipoBus: 'Padrón',
      frecuencia: 'Cada 12 min', ultimoViaje: 'Ayer, 1:15 pm', esFavorita: true,
      paraderos: [
        { nombre: 'San Isidro – Camino Real', km: 0 },
        { nombre: 'Av. Canaval y Moreyra', km: 1.5 },
        { nombre: 'Av. Pershing', km: 3.1 },
        { nombre: 'Av. Tomás Marsano', km: 4.8 },
        { nombre: 'La Victoria – Av. México', km: 6.2 },
      ]
    },
    {
      id: '3', nombre: 'Casa → Universidad',
      origen: 'Chorrillos (Terminal)', destino: 'SJL – Av. Próceres',
      linea: 'Línea 203', estado: 'Limitado',
      duracion: '55 min', recorrido: '26 KM', tipoBus: 'Articulado',
      frecuencia: 'Cada 20 min', ultimoViaje: 'Lun, 8:00 am', esFavorita: true,
      paraderos: [
        { nombre: 'Chorrillos (Terminal)', km: 0 },
        { nombre: 'Av. Huaylas', km: 1.2 },
        { nombre: 'Av. Barranco Centro', km: 4.1 },
        { nombre: 'Miraflores – Óvalo Gutiérrez', km: 6.3 },
        { nombre: 'Av. Arequipa', km: 8.0 },
        { nombre: 'Av. Javier Prado', km: 11.4 },
        { nombre: 'El Agustino – Av. Riva Agüero', km: 20.1 },
        { nombre: 'SJL – Av. Próceres', km: 23.4 },
      ]
    },
    {
      id: '4', nombre: 'Gimnasio → Casa',
      origen: 'Lince – Av. Petit Thouars', destino: 'Chorrillos (Terminal)',
      linea: 'Línea 204', estado: 'En servicio',
      duracion: '30 min', recorrido: '14 KM', tipoBus: 'Padrón',
      frecuencia: 'Cada 10 min', ultimoViaje: 'Mar, 6:30 pm', esFavorita: true,
      paraderos: [
        { nombre: 'Lince – Av. Petit Thouars', km: 0 },
        { nombre: 'Av. Arequipa', km: 1.8 },
        { nombre: 'Miraflores – Óvalo Gutiérrez', km: 3.6 },
        { nombre: 'Av. Barranco Centro', km: 5.2 },
        { nombre: 'Av. San Martin', km: 7.0 },
        { nombre: 'Av. Huaylas', km: 8.3 },
        { nombre: 'Chorrillos (Terminal)', km: 9.5 },
      ]
    }
  ];

  rutasFiltradas: RutaFavorita[] = [];

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    this.rutasFiltradas = [...this.rutas];
    this.rutaSeleccionada = this.rutas[0];
  }

  /* ── Filtros ── */
  filtrar(): void {
    const t = this.busqueda.toLowerCase().trim();
    let base = [...this.rutas];
    if (this.filtroActivo === 'activas')   base = base.filter(r => r.estado === 'En servicio');
    if (this.filtroActivo === 'inactivas') base = base.filter(r => r.estado !== 'En servicio');
    this.rutasFiltradas = t
      ? base.filter(r =>
          r.nombre.toLowerCase().includes(t) ||
          r.origen.toLowerCase().includes(t) ||
          r.destino.toLowerCase().includes(t) ||
          r.linea.toLowerCase().includes(t))
      : base;
  }

  setFiltro(f: 'todas' | 'activas' | 'inactivas'): void { this.filtroActivo = f; this.filtrar(); }

  seleccionarRuta(ruta: RutaFavorita): void { this.rutaSeleccionada = ruta; this.tabActivo = 'ida'; }

  getParaderosColumna(col: 0 | 1): Paradero[] {
    if (!this.rutaSeleccionada) return [];
    const lista = this.tabActivo === 'vuelta'
      ? [...this.rutaSeleccionada.paraderos].reverse()
      : this.rutaSeleccionada.paraderos;
    const mitad = Math.ceil(lista.length / 2);
    return col === 0 ? lista.slice(0, mitad) : lista.slice(mitad);
  }

  /* ── Modal Agregar ── */
  abrirModalAgregar(): void { this.formRuta = this.formVacio(); this.modalAgregarAbierto = true; }
  cerrarModalAgregar(): void { this.modalAgregarAbierto = false; }
  confirmarAgregar(): void {
    if (!this.formValido()) return;
    const nueva: RutaFavorita = {
      id: Date.now().toString(), ...this.formRuta,
      ultimoViaje: 'Nunca', esFavorita: true,
      paraderos: [
        { nombre: this.formRuta.origen, km: 0 },
        { nombre: this.formRuta.destino, km: 0 },
      ]
    };
    this.rutas.unshift(nueva);
    this.filtrar();
    this.rutaSeleccionada = nueva;
    this.modalAgregarAbierto = false;
  }

  /* ── Modal Editar ── */
  abrirModalEditar(ruta: RutaFavorita, event: Event): void {
    event.stopPropagation();
    this.rutaSeleccionada = ruta;
    this.formRuta = {
      nombre: ruta.nombre, origen: ruta.origen, destino: ruta.destino,
      linea: ruta.linea, estado: ruta.estado, duracion: ruta.duracion,
      recorrido: ruta.recorrido, tipoBus: ruta.tipoBus, frecuencia: ruta.frecuencia,
    };
    this.modalEditarAbierto = true;
  }
  cerrarModalEditar(): void { this.modalEditarAbierto = false; }
  confirmarEditar(): void {
    if (!this.rutaSeleccionada || !this.formValido()) return;
    const idx = this.rutas.findIndex(r => r.id === this.rutaSeleccionada!.id);
    if (idx > -1) { this.rutas[idx] = { ...this.rutas[idx], ...this.formRuta }; this.rutaSeleccionada = this.rutas[idx]; }
    this.filtrar();
    this.modalEditarAbierto = false;
  }

  /* ── Modal Eliminar ── */
  abrirModalEliminar(ruta: RutaFavorita, event: Event): void {
    event.stopPropagation();
    this.rutaParaEliminar = ruta;
    this.modalEliminarAbierto = true;
  }
  cerrarModalEliminar(): void { this.modalEliminarAbierto = false; this.rutaParaEliminar = null; }
  confirmarEliminar(): void {
    if (!this.rutaParaEliminar) return;
    const idx = this.rutas.findIndex(r => r.id === this.rutaParaEliminar!.id);
    if (idx > -1) this.rutas.splice(idx, 1);
    if (this.rutaSeleccionada?.id === this.rutaParaEliminar.id) this.rutaSeleccionada = this.rutas[0] ?? null;
    this.filtrar();
    this.cerrarModalEliminar();
  }

  /* ── Helpers ── */
  private formVacio(): FormRuta {
    return { nombre: '', origen: '', destino: '', linea: '', estado: 'En servicio', duracion: '', recorrido: '', tipoBus: 'Padrón', frecuencia: '' };
  }
  formValido(): boolean {
    return !!(this.formRuta.nombre.trim() && this.formRuta.origen.trim() && this.formRuta.destino.trim() && this.formRuta.linea.trim());
  }
  cerrarOverlay(event: MouseEvent, modal: 'agregar' | 'editar' | 'eliminar'): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      if (modal === 'agregar')  this.cerrarModalAgregar();
      if (modal === 'editar')   this.cerrarModalEditar();
      if (modal === 'eliminar') this.cerrarModalEliminar();
    }
  }

  irInicio(): void { this.router.navigate(['/inicio']); }
  onLogout(): void { 
    this.auth.cerrarSesion();
    this.router.navigate(['/login']); }
}