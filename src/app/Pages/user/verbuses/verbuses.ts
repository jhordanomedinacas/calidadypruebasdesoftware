import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar';

interface Paradero {
  nombre: string;
  km: number;
}

interface ProximoBus {
  minutos: number;
  capacidad: number;
  placa: string;
}

interface Linea {
  id: string;
  nombre: string;
  ruta: string;
  estado: 'En servicio' | 'Limitado' | 'Fuera de servicio';
  paraderos: number;
  recorrido: string;
  duracion: string;
  tipoBus: string;
  pasajeros: number;
  listaParaderos: Paradero[];
}

@Component({
  selector: 'app-verbuses',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './verbuses.html',
  styleUrl: './verbuses.css'
})
export class VerBusesComponent implements OnInit {

  busquedaOrigen = '';
  busquedaDestino = '';
  tabActivo: 'ida' | 'vuelta' = 'ida';

  lineaSeleccionada: Linea | null = null;

  proximosBuses: ProximoBus[] = [
    { minutos: 3,  capacidad: 42, placa: 'ABC-123' },
    { minutos: 11, capacidad: 75, placa: 'DEF-456' },
    { minutos: 19, capacidad: 20, placa: 'GHI-789' },
  ];

  lineas: Linea[] = [
    {
      id: '201',
      nombre: 'Línea 201',
      ruta: 'Chorrillos - San Juan de Lurigancho',
      estado: 'En servicio',
      paraderos: 28,
      recorrido: '34 KM',
      duracion: '65 min',
      tipoBus: 'Articulado',
      pasajeros: 160,
      listaParaderos: [
        { nombre: 'Chorrillos (Terminal)', km: 0 },
        { nombre: 'Av. Huaylas', km: 1.2 },
        { nombre: 'Av. San Martin', km: 2.5 },
        { nombre: 'Av. Barranco Centro', km: 4.1 },
        { nombre: 'Miraflores – Óvalo Gutiérrez', km: 6.3 },
        { nombre: 'Av. Arequipa', km: 8.0 },
        { nombre: 'Lince – Av. Petit Thouars', km: 9.8 },
        { nombre: 'Av. Javier Prado', km: 11.4 },
        { nombre: 'San Isidro – Camino Real', km: 13.0 },
        { nombre: 'Av. Canaval y Moreyra', km: 14.5 },
        { nombre: 'Av. Pershing', km: 16.1 },
        { nombre: 'Av. Tomás Marsano', km: 17.8 },
        { nombre: 'La Victoria – Av. México', km: 19.2 },
        { nombre: 'El Agustino – Av. Riva Agüero', km: 23.1 },
        { nombre: 'SJL – Av. Próceres', km: 26.4 },
        { nombre: 'SJL – Canto Grande (Terminal)', km: 29.0 },
      ]
    },
    {
      id: '202',
      nombre: 'Línea 202',
      ruta: 'Chorrillos - San Juan de Lurigancho',
      estado: 'En servicio',
      paraderos: 24,
      recorrido: '30 KM',
      duracion: '55 min',
      tipoBus: 'Padrón',
      pasajeros: 80,
      listaParaderos: [
        { nombre: 'Chorrillos (Terminal)', km: 0 },
        { nombre: 'Av. Huaylas', km: 1.2 },
        { nombre: 'Av. San Martin', km: 2.5 },
        { nombre: 'Av. Barranco Centro', km: 4.1 },
        { nombre: 'Miraflores – Óvalo Gutiérrez', km: 6.3 },
        { nombre: 'Av. Arequipa', km: 8.0 },
        { nombre: 'Lince – Av. Petit Thouars', km: 9.8 },
        { nombre: 'Av. Javier Prado', km: 11.4 },
        { nombre: 'San Isidro – Camino Real', km: 13.0 },
        { nombre: 'Av. Pershing', km: 16.1 },
        { nombre: 'La Victoria – Av. México', km: 19.2 },
        { nombre: 'El Agustino – Av. Riva Agüero', km: 23.1 },
      ]
    },
    {
      id: '203',
      nombre: 'Línea 203',
      ruta: 'Chorrillos - San Juan de Lurigancho',
      estado: 'Limitado',
      paraderos: 20,
      recorrido: '26 KM',
      duracion: '50 min',
      tipoBus: 'Articulado',
      pasajeros: 160,
      listaParaderos: [
        { nombre: 'Chorrillos (Terminal)', km: 0 },
        { nombre: 'Av. Huaylas', km: 1.2 },
        { nombre: 'Av. San Martin', km: 2.5 },
        { nombre: 'Av. Barranco Centro', km: 4.1 },
        { nombre: 'Miraflores – Óvalo Gutiérrez', km: 6.3 },
        { nombre: 'Av. Arequipa', km: 8.0 },
        { nombre: 'Av. Javier Prado', km: 11.4 },
        { nombre: 'El Agustino – Av. Riva Agüero', km: 23.1 },
      ]
    },
    {
      id: '204',
      nombre: 'Línea 204',
      ruta: 'Chorrillos - San Juan de Lurigancho',
      estado: 'En servicio',
      paraderos: 22,
      recorrido: '28 KM',
      duracion: '58 min',
      tipoBus: 'Padrón',
      pasajeros: 80,
      listaParaderos: [
        { nombre: 'Chorrillos (Terminal)', km: 0 },
        { nombre: 'Av. Huaylas', km: 1.2 },
        { nombre: 'Av. San Martin', km: 2.5 },
        { nombre: 'Av. Barranco Centro', km: 4.1 },
        { nombre: 'Miraflores – Óvalo Gutiérrez', km: 6.3 },
        { nombre: 'Lince – Av. Petit Thouars', km: 9.8 },
        { nombre: 'Av. Javier Prado', km: 11.4 },
        { nombre: 'San Isidro – Camino Real', km: 13.0 },
        { nombre: 'La Victoria – Av. México', km: 19.2 },
        { nombre: 'El Agustino – Av. Riva Agüero', km: 23.1 },
      ]
    }
  ];

  lineasFiltradas: Linea[] = [];

  ngOnInit(): void {
    this.lineasFiltradas = [...this.lineas];
    this.lineaSeleccionada = this.lineas[0];
  }

  filtrarLineas(): void {
    const termino = this.busquedaOrigen.toLowerCase().trim();
    if (!termino) {
      this.lineasFiltradas = [...this.lineas];
      return;
    }
    this.lineasFiltradas = this.lineas.filter(l =>
      l.nombre.toLowerCase().includes(termino) ||
      l.ruta.toLowerCase().includes(termino)
    );
  }

  seleccionarLinea(linea: Linea): void {
    this.lineaSeleccionada = linea;
    this.tabActivo = 'ida';
  }

  /**
   * Divide los paraderos en dos columnas iguales.
   * columna 0 = izquierda, columna 1 = derecha
   */
  getParaderosColumna(col: 0 | 1): Paradero[] {
    if (!this.lineaSeleccionada) return [];
    const lista = this.tabActivo === 'vuelta'
      ? [...this.lineaSeleccionada.listaParaderos].reverse()
      : this.lineaSeleccionada.listaParaderos;
    const mitad = Math.ceil(lista.length / 2);
    return col === 0 ? lista.slice(0, mitad) : lista.slice(mitad);
  }

  irInicio(): void {
    this.router.navigate(['/inicio']);
  }
  constructor(private router: Router) {}
  onLogout(): void {
    this.router.navigate(['/login']);
  }
}