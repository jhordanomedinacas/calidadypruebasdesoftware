import {
  Component, OnInit, OnDestroy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';
import { NavbarComponent } from '../../../components/navbar/navbar';

// ── Modelos ─────────────────────────────────────────────────────────────────

export interface KpiUsuario {
  viajesMes:          number;
  viajesMesDelta:     number;
  gastoMes:           number;
  gastoDelta:         number;
  demoraPromedio:     number;
  demoraDelta:        number;
  busesEnHorarioPct:  number;
  busesEnHorario:     number;
  busesTotales:       number;
}

export interface TopLinea {
  codigo:            string;
  nombre:            string;
  paraderoOrigen:    string;
  paraderoDestino:   string;
  etaMin:            number;
  etaClass:          string;
  horarioSalida:     string;
  cumplimientoLabel: string;
  cumplimientoClass: string;
}

export interface MetodoPago {
  tipoClass:      string;
  icono:          string;
  nombre:         string;
  meta:           string;
  gastoMes:       number;
  predeterminado: boolean;
}

// ── Tipo para el mapa de demoras ─────────────────────────────────────────────
type LineaCodigo = 'L201' | 'L202' | 'L203' | 'L204';

// ── Componente ──────────────────────────────────────────────────────────────

@Component({
  selector:    'app-dashboard-usuario',
  standalone:  true,
  imports:     [CommonModule, NgxEchartsDirective, NavbarComponent],
  providers:   [provideEchartsCore({ echarts })],
  templateUrl: './dashboard.html',
  styleUrl:    './dashboard.css',
})
export class DashboardUsuarioComponent implements OnInit, OnDestroy {

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  // ── Datos básicos ──────────────────────────────────────────────────────────
  nombreUsuario = 'Jorge Machado';

  // ── KPIs ───────────────────────────────────────────────────────────────────
  kpis: KpiUsuario = {
    viajesMes:         48,
    viajesMesDelta:    12,
    gastoMes:          57.60,
    gastoDelta:        8,
    demoraPromedio:    4,
    demoraDelta:       2,
    busesEnHorarioPct: 82,
    busesEnHorario:    31,
    busesTotales:      38,
  };

  // ── Top líneas que cumplen horario ─────────────────────────────────────────
  topLineas: TopLinea[] = [
    {
      codigo:            'L201',
      nombre:            'Línea 201 — Chorrillos › San Juan de Lurigancho',
      paraderoOrigen:    'Est. Central',
      paraderoDestino:   'SJL Terminal',
      etaMin:            2,
      etaClass:          'eta-verde',
      horarioSalida:     '07:12',
      cumplimientoLabel: '94% puntual',
      cumplimientoClass: 'cumpl-alto',
    },
    {
      codigo:            'L202',
      nombre:            'Línea 202 — Chorrillos › SJL (expreso)',
      paraderoOrigen:    'Av. Huaylas',
      paraderoDestino:   'SJL Terminal',
      etaMin:            5,
      etaClass:          'eta-verde',
      horarioSalida:     '07:18',
      cumplimientoLabel: '87% puntual',
      cumplimientoClass: 'cumpl-alto',
    },
    {
      codigo:            'L204',
      nombre:            'Línea 204 — Barranco › Comas',
      paraderoOrigen:    'Óvalo Gutiérrez',
      paraderoDestino:   'Comas Norte',
      etaMin:            8,
      etaClass:          'eta-amber',
      horarioSalida:     '07:25',
      cumplimientoLabel: '71% puntual',
      cumplimientoClass: 'cumpl-medio',
    },
    {
      codigo:            'L203',
      nombre:            'Línea 203 — Chorrillos › SJL (local)',
      paraderoOrigen:    'Av. San Martín',
      paraderoDestino:   'SJL Terminal',
      etaMin:            14,
      etaClass:          'eta-rojo',
      horarioSalida:     '07:35',
      cumplimientoLabel: '58% puntual',
      cumplimientoClass: 'cumpl-bajo',
    },
  ];

  // ── Métodos de pago ────────────────────────────────────────────────────────
  metodosPago: MetodoPago[] = [
    { tipoClass: 'tarjeta',  icono: '💳', nombre: 'Tarjeta Lima Pass',    meta: '**** 4821 · Débito',         gastoMes: 38.40, predeterminado: true  },
    { tipoClass: 'efectivo', icono: '💵', nombre: 'Efectivo / Ventanilla', meta: 'Recarga manual en agencia', gastoMes: 15.00, predeterminado: false },
    { tipoClass: 'digital',  icono: '📱', nombre: 'App Corredor Azul',     meta: 'Pago QR in-app',            gastoMes: 4.20,  predeterminado: false },
  ];

  get gastoTotalMes(): number {
    return this.metodosPago.reduce((acc, p) => acc + p.gastoMes, 0);
  }

  get totalGastoHistorico(): number {
    return [48.50, 52.10, 44.80, 61.20, 55.90, 57.60].reduce((a, b) => a + b, 0);
  }

  // ══════════════════════════════════════════════════════════════════
  //  GRÁFICO 1 — Horario preferido de viaje (barras por hora)
  // ══════════════════════════════════════════════════════════════════

  franjaActiva: string = 'todas';
  franjasHorario = [
    { key: 'todas',  label: 'Todo el día' },
    { key: 'manana', label: 'Mañana' },
    { key: 'tarde',  label: 'Tarde' },
    { key: 'noche',  label: 'Noche' },
  ];

  private viajesPorHora: number[] = [
    0, 0, 0, 0, 1, 3, 8, 14, 9, 5, 3, 2,
    4, 6, 4, 3, 5, 11, 8, 5, 3, 2, 1, 0,
  ];

  private horasLabels: string[] = Array.from({ length: 24 }, (_, i) =>
    `${String(i).padStart(2, '0')}:00`
  );

  graficoHorario: any = {};

  seleccionarFranja(key: string): void {
    this.franjaActiva = key;
    this.buildGraficoHorario();
  }

  private buildGraficoHorario(): void {
    let inicio: number, fin: number;
    switch (this.franjaActiva) {
      case 'manana': inicio = 5;  fin = 11; break;
      case 'tarde':  inicio = 12; fin = 19; break;
      case 'noche':  inicio = 20; fin = 23; break;
      default:       inicio = 0;  fin = 23; break;
    }

    const labels  = this.horasLabels.slice(inicio, fin + 1);
    const valores = this.viajesPorHora.slice(inicio, fin + 1);
    const maxVal  = Math.max(...valores);
    const colores = valores.map(v =>
      v === maxVal ? '#1a3a8f' : v >= 6 ? '#2366CE' : 'rgba(35,102,206,0.45)'
    );

    this.graficoHorario = {
      tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].axisValue}<br/><b>${p[0].value} viajes</b>` },
      grid: { left: 40, right: 16, top: 16, bottom: 28 },
      xAxis: {
        type: 'category', data: labels,
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#9ca3af', fontSize: 10 },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
      },
      series: [{
        type: 'bar',
        data: valores.map((v, i) => ({
          value: v,
          itemStyle: { color: colores[i], borderRadius: [4, 4, 0, 0] },
        })),
        barMaxWidth: 36,
      }],
    };
  }

  onHorarioClick(event: any): void {
    console.log('Hora seleccionada:', event?.name);
  }

  // ══════════════════════════════════════════════════════════════════
  //  GRÁFICO 2 — Frecuencia de uso
  // ══════════════════════════════════════════════════════════════════

  freqVista: string = 'semanal';
  graficoFrecuencia: any = {};

  cambiarFreqVista(vista: string): void {
    this.freqVista = vista;
    this.buildGraficoFrecuencia();
  }

  private buildGraficoFrecuencia(): void {
    if (this.freqVista === 'semanal') {
      const semanas = ['S1','S2','S3','S4','S5','S6','S7','S8'];
      const valores = [9, 11, 8, 12, 10, 13, 7, 11];
      this.graficoFrecuencia = {
        tooltip: { trigger: 'axis' },
        grid: { left: 36, right: 16, top: 16, bottom: 28 },
        xAxis: {
          type: 'category', data: semanas,
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#9ca3af', fontSize: 11 },
          splitLine: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#9ca3af', fontSize: 10 },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        series: [{
          type: 'bar',
          data: valores.map(v => ({ value: v, itemStyle: { color: '#2366CE', borderRadius: [4, 4, 0, 0] } })),
          barMaxWidth: 32,
        }],
      };
    } else {
      const dias    = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
      const valores = [8, 9, 7, 8, 10, 3, 1];
      this.graficoFrecuencia = {
        tooltip: { trigger: 'axis' },
        grid: { left: 36, right: 16, top: 16, bottom: 28 },
        xAxis: {
          type: 'category', data: dias,
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#9ca3af', fontSize: 11 },
          splitLine: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#9ca3af', fontSize: 10 },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        series: [{
          type: 'bar',
          data: valores.map((v, i) => ({
            value: v,
            itemStyle: { color: i < 5 ? '#2366CE' : 'rgba(35,102,206,0.35)', borderRadius: [4, 4, 0, 0] },
          })),
          barMaxWidth: 32,
        }],
      };
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  GRÁFICO 3 — Gasto mensual histórico (línea)
  // ══════════════════════════════════════════════════════════════════

  graficoGasto: any = {};

  private buildGraficoGasto(): void {
    const meses   = ['Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May'];
    const valores = [48.50, 52.10, 44.80, 61.20, 55.90, 57.60];

    this.graficoGasto = {
      tooltip: {
        trigger: 'axis',
        formatter: (p: any) => `${p[0].axisValue}<br/><b>S/ ${p[0].value.toFixed(2)}</b>`,
      },
      grid: { left: 48, right: 16, top: 16, bottom: 28 },
      xAxis: {
        type: 'category', data: meses,
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#9ca3af', fontSize: 10, formatter: (v: number) => `S/ ${v}` },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
      },
      series: [{
        type: 'line',
        data: valores,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: '#2366CE', width: 2.5 },
        itemStyle: { color: '#2366CE', borderWidth: 2, borderColor: '#fff' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(35,102,206,0.18)' },
              { offset: 1, color: 'rgba(35,102,206,0.02)' },
            ],
          },
        },
      }],
    };
  }

  // ══════════════════════════════════════════════════════════════════
  //  GRÁFICO 4 — Demora por línea (barras horizontales)
  // ══════════════════════════════════════════════════════════════════

  lineaSeleccionada: string = '';
  demoraDetalle: number[] = [];
  graficoDemora: any = {};
  graficoDemoraDetalle: any = {};

  // FIX 3: tipo explícito para evitar el error keyof typeof this.*
  private demoraPorLinea: Record<LineaCodigo, number[]> = {
    'L201': [18, 22, 16, 20],
    'L202': [12, 15, 10, 13],
    'L203': [35, 40, 38, 42],
    'L204': [25, 28, 22, 30],
  };

  private buildGraficoDemora(): void {
    const lineas: LineaCodigo[] = ['L201', 'L202', 'L203', 'L204'];
    const promedios = lineas.map(l => {
      const d = this.demoraPorLinea[l];
      return +(d.reduce((a, b) => a + b, 0) / d.length).toFixed(1);
    });
    const colores = promedios.map(v =>
      v < 20 ? '#22c55e' : v < 30 ? '#f59e0b' : '#ef4444'
    );

    this.graficoDemora = {
      tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/><b>${p[0].value}%</b> viajes con demora >5 min` },
      grid: { left: 52, right: 24, top: 12, bottom: 24 },
      xAxis: {
        type: 'value', max: 50,
        axisLabel: { color: '#9ca3af', fontSize: 10, formatter: (v: number) => `${v}%` },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
      },
      yAxis: {
        type: 'category', data: lineas,
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
      },
      series: [{
        type: 'bar',
        data: promedios.map((v, i) => ({
          value: v,
          itemStyle: { color: colores[i], borderRadius: [0, 4, 4, 0] },
        })),
        barMaxWidth: 28,
        label: { show: true, position: 'right', formatter: '{c}%', color: '#6b7280', fontSize: 11 },
      }],
    };
  }

  onDemoraClick(event: any): void {
    if (!event?.name) return;
    const codigo = event.name as LineaCodigo;
    const datos  = this.demoraPorLinea[codigo];
    if (!datos) return;

    this.lineaSeleccionada = codigo;
    this.demoraDetalle     = datos;

    this.graficoDemoraDetalle = {
      tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/><b>${p[0].value}%</b>` },
      grid: { left: 40, right: 16, top: 12, bottom: 24 },
      xAxis: {
        type: 'category',
        data: ['S1', 'S2', 'S3', 'S4'],
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#9ca3af', fontSize: 11 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#9ca3af', fontSize: 10, formatter: (v: number) => `${v}%` },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
      },
      series: [{
        type: 'line',
        data: datos,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#2366CE', width: 2 },
        itemStyle: { color: '#2366CE' },
        areaStyle: { color: 'rgba(35,102,206,0.08)' },
      }],
    };
    this.cdr.detectChanges();
  }

  // ══════════════════════════════════════════════════════════════════
  //  GRÁFICO 5 — Gasto por franja horaria (donut)
  // ══════════════════════════════════════════════════════════════════

  graficoGastoFranja: any = {};

  private buildGraficoGastoFranja(): void {
    this.graficoGastoFranja = {
      tooltip: { trigger: 'item', formatter: '{b}: S/ {c} ({d}%)' },
      legend: {
        bottom: 0, left: 'center',
        itemWidth: 10, itemHeight: 10,
        textStyle: { color: '#6b7280', fontSize: 11 },
      },
      series: [{
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: false,
        label: { show: false },
        labelLine: { show: false },
        data: [
          { value: 18.20, name: 'Mañana',   itemStyle: { color: '#2366CE' } },
          { value: 12.40, name: 'Mediodía', itemStyle: { color: '#22c55e' } },
          { value: 22.80, name: 'Tarde',    itemStyle: { color: '#f59e0b' } },
          { value: 4.20,  name: 'Noche',    itemStyle: { color: '#8b5cf6' } },
        ],
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.15)' },
        },
      }],
    };
  }

  // ══════════════════════════════════════════════════════════════════
  //  Lifecycle
  // ══════════════════════════════════════════════════════════════════

  private kpiInterval: any;

  ngOnInit(): void {
    this.buildGraficoHorario();
    this.buildGraficoFrecuencia();
    this.buildGraficoGasto();
    this.buildGraficoDemora();
    this.buildGraficoGastoFranja();

    this.kpiInterval = setInterval(() => this.actualizarKpis(), 30_000);
  }

  ngOnDestroy(): void {
    clearInterval(this.kpiInterval);
  }

  private actualizarKpis(): void {
    this.kpis = {
      ...this.kpis,
      busesEnHorarioPct: Math.min(100, this.kpis.busesEnHorarioPct + (Math.random() > 0.5 ? 1 : -1)),
      demoraPromedio:    Math.max(1,   this.kpis.demoraPromedio    + (Math.random() > 0.5 ? 0.5 : -0.5)),
    };
    this.cdr.detectChanges();
  }

  // ── Navegación ─────────────────────────────────────────────────────────────
  irA(ruta: string): void {
    this.router.navigate([`/${ruta}`]);
  }

  onLogout(): void {
    this.router.navigate(['/login']);
  }
}