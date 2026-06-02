import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth';

/* ─────────────── Interfaces ─────────────── */

export interface Paradero {
  nombre: string;
  km: number;
}

export interface Horario {
  dias: string;   // e.g. 'Lunes - Viernes'
  hora: string;   // e.g. '6:00 am - 11:00 pm'
}

export interface Ruta {
  titulo: string;       // e.g. 'Chorrillos (terminal) - San Juan de Lurigancho'
  tipo: string;         // 'Ida' | 'Vuelta'
  horaTipo: string;     // 'Hora punta' | 'Normal' | 'Nocturno'
  horarios: Horario[];
}

export interface Linea {
  id: string;
  nombre: string;
  ruta: string;
  listaParaderos: Paradero[];
  horarios: Horario[];
  rutas: Ruta[];
}

/* ─────────────── Componente ─────────────── */

@Component({
  selector: 'app-gestionar-lineas',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './gestionar-lineas.html',
  styleUrl: './gestionar-lineas.css'
})
export class GestionarLineasComponent implements OnInit {

  constructor(private router: Router, private auth: AuthService) {}

  /* ── Estado de búsqueda y selección ── */
  busqueda = '';
  lineaSeleccionada: Linea | null = null;
  lineasFiltradas: Linea[] = [];
  paraderoSeleccionadoIdx: number | null = null;

  /* ── Selects de tipo de ruta ── */
  tipoRuta: 'ida' | 'vuelta' = 'ida';
  horaTipo: 'hora_punta' | 'normal' | 'nocturno' = 'hora_punta';

  /* ── Datos de líneas ── */
  lineas: Linea[] = [
    {
      id: '201',
      nombre: 'Línea 201',
      ruta: 'Chorrillos - San Juan de Lurigancho',
      listaParaderos: [
        { nombre: 'Chorrillos (Terminal)', km: 0 },
        { nombre: 'Av. Huaylas',           km: 1.2 },
        { nombre: 'Av. San Martin',        km: 2.5 },
        { nombre: 'Av. Barranco Centro',   km: 4.1 },
        { nombre: 'Óvalo Gutiérrez',       km: 6.3 },
        { nombre: 'Av. Arequipa',          km: 8.0 },
        { nombre: 'Av. Javier Prado',      km: 11.4 },
        { nombre: 'San Isidro',            km: 13.0 },
        { nombre: 'SJL – Canto Grande',    km: 29.0 },
      ],
      horarios: [
        { dias: 'Lunes - Viernes', hora: '6:00 am - 11:00 pm' },
        { dias: 'Sábado - Domingo', hora: '6:00 am - 11:00 pm' },
      ],
      rutas: [
        {
          titulo: 'Chorrillos (terminal) - San Juan de Lurigancho',
          tipo: 'Ida',
          horaTipo: 'Hora punta',
          horarios: [
            { dias: 'Lunes - Viernes', hora: '6:00 am - 11:00 pm' },
            { dias: 'Sábado - Domingo', hora: '8:00 am - 11:00 pm' },
          ]
        },
        {
          titulo: 'Chorrillos (terminal) - San Juan de Lurigancho',
          tipo: 'Ida',
          horaTipo: 'Hora punta',
          horarios: [
            { dias: 'Lunes - Viernes', hora: '6:00 am - 11:00 pm' },
            { dias: 'Sábado - Domingo', hora: '8:00 am - 11:00 pm' },
          ]
        }
      ]
    },
    {
      id: '202',
      nombre: 'Línea 202',
      ruta: 'Chorrillos - San Juan de Lurigancho',
      listaParaderos: [
        { nombre: 'Chorrillos (Terminal)', km: 0 },
        { nombre: 'Av. Huaylas',           km: 1.2 },
        { nombre: 'Av. San Martin',        km: 2.5 },
        { nombre: 'Av. Barranco Centro',   km: 4.1 },
        { nombre: 'Óvalo Gutiérrez',       km: 6.3 },
        { nombre: 'Av. Arequipa',          km: 8.0 },
        { nombre: 'Av. Javier Prado',      km: 11.4 },
        { nombre: 'El Agustino',           km: 23.1 },
      ],
      horarios: [
        { dias: 'Lunes - Viernes', hora: '6:00 am - 10:00 pm' },
        { dias: 'Sábado - Domingo', hora: '7:00 am - 10:00 pm' },
      ],
      rutas: []
    },
    {
      id: '203',
      nombre: 'Línea 203',
      ruta: 'Chorrillos - San Juan de Lurigancho',
      listaParaderos: [
        { nombre: 'Chorrillos (Terminal)', km: 0 },
        { nombre: 'Av. Huaylas',           km: 1.2 },
        { nombre: 'Av. Arequipa',          km: 8.0 },
        { nombre: 'Av. Javier Prado',      km: 11.4 },
        { nombre: 'El Agustino',           km: 23.1 },
      ],
      horarios: [
        { dias: 'Lunes - Viernes', hora: '7:00 am - 9:00 pm' },
      ],
      rutas: []
    },
    {
      id: '204',
      nombre: 'Línea 204',
      ruta: 'Chorrillos - San Juan de Lurigancho',
      listaParaderos: [
        { nombre: 'Chorrillos (Terminal)', km: 0 },
        { nombre: 'Av. Huaylas',           km: 1.2 },
        { nombre: 'Av. San Martin',        km: 2.5 },
        { nombre: 'Av. Javier Prado',      km: 11.4 },
        { nombre: 'San Isidro',            km: 13.0 },
        { nombre: 'El Agustino',           km: 23.1 },
      ],
      horarios: [
        { dias: 'Lunes - Viernes', hora: '6:30 am - 10:30 pm' },
        { dias: 'Sábado - Domingo', hora: '7:00 am - 10:00 pm' },
      ],
      rutas: []
    }
  ];

  /* ─────────────── Lifecycle ─────────────── */

  ngOnInit(): void {
    this.lineasFiltradas = [...this.lineas];
    this.lineaSeleccionada = this.lineas[0];
  }

  /* ─────────────── Búsqueda ─────────────── */

  filtrarLineas(): void {
    const termino = this.busqueda.toLowerCase().trim();
    if (!termino) {
      this.lineasFiltradas = [...this.lineas];
      return;
    }
    this.lineasFiltradas = this.lineas.filter(l =>
      l.nombre.toLowerCase().includes(termino) ||
      l.ruta.toLowerCase().includes(termino) ||
      l.listaParaderos.some(p => p.nombre.toLowerCase().includes(termino))
    );
  }

  /* ─────────────── Selección de línea ─────────────── */

  seleccionarLinea(linea: Linea): void {
    this.lineaSeleccionada = linea;
    this.paraderoSeleccionadoIdx = null;
  }

  /* ─────────────── Agregar línea ─────────────── */

  agregarLinea(): void {
    const nuevaId = String(205 + this.lineas.length - 4);
    const nueva: Linea = {
      id: nuevaId,
      nombre: `Línea ${nuevaId}`,
      ruta: 'Nueva ruta',
      listaParaderos: [],
      horarios: [],
      rutas: []
    };
    this.lineas.push(nueva);
    this.lineasFiltradas = [...this.lineas];
    this.lineaSeleccionada = nueva;
  }

  /* ─────────────── Eliminar línea ─────────────── */

  eliminarLinea(): void {
    if (!this.lineaSeleccionada) return;
    const confirmar = confirm(`¿Eliminar definitivamente la ${this.lineaSeleccionada.nombre}?`);
    if (!confirmar) return;
    this.lineas = this.lineas.filter(l => l.id !== this.lineaSeleccionada!.id);
    this.lineasFiltradas = [...this.lineas];
    this.lineaSeleccionada = this.lineas[0] ?? null;
  }

  /* ─────────────── Paraderos ─────────────── */

  seleccionarParadero(idx: number): void {
    this.paraderoSeleccionadoIdx = this.paraderoSeleccionadoIdx === idx ? null : idx;
  }

  agregarParadero(): void {
    if (!this.lineaSeleccionada) return;
    const nombre = prompt('Nombre del paradero:');
    if (!nombre) return;
    const kmStr = prompt('Kilómetro:');
    const km = parseFloat(kmStr ?? '0') || 0;
    this.lineaSeleccionada.listaParaderos.push({ nombre: nombre.trim(), km });
  }

  editarParadero(idx: number): void {
    if (!this.lineaSeleccionada) return;
    const p = this.lineaSeleccionada.listaParaderos[idx];
    const nombre = prompt('Nuevo nombre:', p.nombre);
    if (nombre !== null) p.nombre = nombre.trim();
    const kmStr = prompt('Nuevo km:', String(p.km));
    if (kmStr !== null) p.km = parseFloat(kmStr) || p.km;
  }

  eliminarParadero(idx: number): void {
    if (!this.lineaSeleccionada) return;
    this.lineaSeleccionada.listaParaderos.splice(idx, 1);
    if (this.paraderoSeleccionadoIdx === idx) this.paraderoSeleccionadoIdx = null;
  }

  /* ─────────────── Horarios ─────────────── */

  asignarHorario(): void {
    if (!this.lineaSeleccionada) return;
    const dias = prompt('Días (ej. Lunes - Viernes):');
    if (!dias) return;
    const hora = prompt('Horario (ej. 6:00 am - 11:00 pm):');
    if (!hora) return;
    this.lineaSeleccionada.horarios.push({ dias: dias.trim(), hora: hora.trim() });
  }

  editarHorario(idx: number): void {
    if (!this.lineaSeleccionada) return;
    const h = this.lineaSeleccionada.horarios[idx];
    const dias = prompt('Días:', h.dias);
    if (dias !== null) h.dias = dias.trim();
    const hora = prompt('Horario:', h.hora);
    if (hora !== null) h.hora = hora.trim();
  }

  eliminarHorario(idx: number): void {
    if (!this.lineaSeleccionada) return;
    this.lineaSeleccionada.horarios.splice(idx, 1);
  }

  /* ─────────────── Rutas ─────────────── */
  
  guardarRuta(): void {
    if (!this.lineaSeleccionada) return;
    const nuevaRuta: Ruta = {
      titulo: this.lineaSeleccionada.ruta,
      tipo: this.tipoRuta === 'ida' ? 'Ida' : 'Vuelta',
      horaTipo: this.horaTipo === 'hora_punta' ? 'Hora punta' : this.horaTipo === 'nocturno' ? 'Nocturno' : 'Normal',
      horarios: [...this.lineaSeleccionada.horarios]
    };
    this.lineaSeleccionada.rutas.push(nuevaRuta);
  }

  eliminarRuta(): void {
    // Elimina la última ruta en edición (o se puede adaptar a un índice específico)
    if (!this.lineaSeleccionada) return;
    const confirmar = confirm('¿Eliminar esta ruta?');
    if (confirmar) this.lineaSeleccionada.rutas.pop();
  }

  cancelarRuta(): void {
    this.tipoRuta = 'ida';
    this.horaTipo = 'hora_punta';
  }

  duplicarRuta(idx: number): void {
    if (!this.lineaSeleccionada) return;
    const original = this.lineaSeleccionada.rutas[idx];
    const copia: Ruta = {
      ...original,
      horarios: original.horarios.map(h => ({ ...h }))
    };
    this.lineaSeleccionada.rutas.splice(idx + 1, 0, copia);
  }

  editarRuta(idx: number): void {
    if (!this.lineaSeleccionada) return;
    const ruta = this.lineaSeleccionada.rutas[idx];
    this.tipoRuta = ruta.tipo === 'Ida' ? 'ida' : 'vuelta';
    this.horaTipo = ruta.horaTipo === 'Hora punta' ? 'hora_punta' : ruta.horaTipo === 'Nocturno' ? 'nocturno' : 'normal';
    this.lineaSeleccionada.rutas.splice(idx, 1);
  }

  /* ─────────────── Guardar / Cancelar línea ─────────────── */

  guardarLinea(): void {
    // TODO: conectar con servicio/API
    alert(`Línea "${this.lineaSeleccionada?.nombre}" guardada correctamente.`);
  }

  cancelarLinea(): void {
    this.lineaSeleccionada = this.lineas[0] ?? null;
    this.busqueda = '';
    this.filtrarLineas();
  }

  /* ─────────────── Navegación ─────────────── */

  irInicio(): void {
    this.router.navigate(['/inicio']);
  }

  onLogout(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }
}