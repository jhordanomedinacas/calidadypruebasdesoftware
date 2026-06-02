import {
  Component, OnInit, OnDestroy, ElementRef,
  ViewChild, AfterViewInit, ChangeDetectorRef,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth';

// ── Modelos ────────────────────────────────────────────────────────────────────

export interface KpiDashboard {
  usuariosActivos:    number;
  busesEnFlota:       number;
  recargasHoy:        number;
  montoRecargasHoy:   number;
  reportesEnviados:   number;
  reportesPendientes: number;
}

export interface UsuarioReciente {
  iniciales:   string;
  avatarClass: string;
  nombre:      string;
  ruta:        string;
  hace:        string;
  rol:         string;
  rolClass:    string;
}

export interface EtaItem {
  linea:       string;
  color:       string;
  tiempo:      number;
  barPct:      number;
  tiempoColor: string;
  tiempoBg:    string;
  paradero:    string;
}

export interface NoticiaVisita {
  titulo:   string;
  fecha:    string;
  autor:    string;
  vistas:   number;
  dotColor: string;
}

export interface LineaViaje {
  nombre: string;
  viajes: number;
  pct:    number;
}

export interface EventoImpacto {
  nombre:       string;
  fecha:        string;
  lugar:        string;
  semana:       string;
  tipo:         'alto' | 'medio' | 'festivo';
  impactoLabel: string;
  emoji:        string;
  rutas:        string[];
}

// ── Componente ─────────────────────────────────────────────────────────────────

@Component({
  selector:    'app-dashboard',
  standalone:  true,
  imports:     [CommonModule, NavbarComponent],
  schemas:     [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './dashboard.html',
  styleUrl:    './dashboard.css',
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('liveWc',    { static: false }) liveWcRef!:  ElementRef;
  @ViewChild('regCanvas', { static: false }) regCanvasRef!: ElementRef<HTMLCanvasElement>;

  constructor(private router: Router, private cdr: ChangeDetectorRef, private auth: AuthService) {}

  // ── KPIs ───────────────────────────────────────────────────────────────────
  kpis: KpiDashboard = {
    usuariosActivos:    3241,
    busesEnFlota:       38,
    recargasHoy:        412,
    montoRecargasHoy:   6180,
    reportesEnviados:   14,
    reportesPendientes: 3,
  };

  // ── Eventos de alto impacto ────────────────────────────────────────────────
  eventosImpacto: EventoImpacto[] = [
    {
      nombre:       'Concierto Bad Bunny — Estadio Nacional',
      fecha:        'Sáb 31 May',
      lugar:        'Estadio Nacional · Cercado de Lima',
      semana:       'S9',
      tipo:         'alto',
      impactoLabel: '🔴 Alto impacto',
      emoji:        '🎵',
      rutas:        ['L201', 'L202', 'L203'],
    },
    {
      nombre:       'Fiestas Patrias — Desfile Militar',
      fecha:        'Jue 28 Jul',
      lugar:        'Av. Brasil · Jesús María',
      semana:       'S12',
      tipo:         'festivo',
      impactoLabel: '🟣 Festivo nacional',
      emoji:        '🇵🇪',
      rutas:        ['L201', 'L204'],
    },
    {
      nombre:       'Partido Universitario vs Alianza — Liga 1',
      fecha:        'Dom 8 Jun',
      lugar:        'Estadio Monumental · Ate',
      semana:       'S10',
      tipo:         'alto',
      impactoLabel: '🔴 Alto impacto',
      emoji:        '⚽',
      rutas:        ['L202', 'L203'],
    },
    {
      nombre:       'Feria Gastronómica Mistura',
      fecha:        'Vie–Dom 13–15 Jun',
      lugar:        'Parque de la Exposición · Lima',
      semana:       'S10–S11',
      tipo:         'medio',
      impactoLabel: '🟡 Impacto medio',
      emoji:        '🍽️',
      rutas:        ['L201', 'L202'],
    },
  ];

  // ── Usuarios recientes ─────────────────────────────────────────────────────
  usuariosRecientes: UsuarioReciente[] = [
    { iniciales: 'JM', avatarClass: 'avatar-jm', nombre: 'Jorge Machado Flores', ruta: 'L201 · Chorrillos → SJL', hace: 'Hace 2 min',  rol: 'General',    rolClass: 'chip-general'    },
    { iniciales: 'YM', avatarClass: 'avatar-ym', nombre: 'Yerami Medina',        ruta: 'L204 · Barranco → Comas', hace: 'Hace 5 min',  rol: 'Operador',   rolClass: 'chip-operador'   },
    { iniciales: 'CP', avatarClass: 'avatar-cp', nombre: 'Carlos Paredes',       ruta: 'L202 · Chorrillos → SJL', hace: 'Hace 9 min',  rol: 'General',    rolClass: 'chip-general'    },
    { iniciales: 'LR', avatarClass: 'avatar-lr', nombre: 'Lucía Ríos Torres',    ruta: 'L203 · Chorrillos → SJL', hace: 'Hace 12 min', rol: 'Estudiante', rolClass: 'chip-estudiante' },
    { iniciales: 'MA', avatarClass: 'avatar-ma', nombre: 'Miguel Alonzo',        ruta: 'L201 · Chorrillos → SJL', hace: 'Hace 15 min', rol: 'Sin saldo',  rolClass: 'chip-sin-saldo'  },
  ];

  // ── ETA items ──────────────────────────────────────────────────────────────
  etaItems: EtaItem[] = [
    { linea: 'L201 · Ud.47', color: '#2366CE', tiempo: 1,  barPct: 95, tiempoColor: '#22c55e', tiempoBg: 'rgba(34,197,94,0.12)',   paradero: 'Est. Central'    },
    { linea: 'L202 · Ud.12', color: '#2366CE', tiempo: 3,  barPct: 75, tiempoColor: '#22c55e', tiempoBg: 'rgba(34,197,94,0.12)',   paradero: 'Av. Huaylas'     },
    { linea: 'L204 · Ud.33', color: '#2366CE', tiempo: 6,  barPct: 55, tiempoColor: '#f59e0b', tiempoBg: 'rgba(245,158,11,0.12)',  paradero: 'Óvalo Gutiérrez' },
    { linea: 'L203 · Ud.08', color: '#f59e0b', tiempo: 12, barPct: 30, tiempoColor: '#ef4444', tiempoBg: 'rgba(239,68,68,0.12)',   paradero: 'Av. San Martín'  },
    { linea: 'L201 · Ud.19', color: '#2366CE', tiempo: 9,  barPct: 42, tiempoColor: '#f59e0b', tiempoBg: 'rgba(245,158,11,0.12)', paradero: 'Av. Barranco'    },
  ];

  // ── Noticias visitas ───────────────────────────────────────────────────────
  noticiasVisitas: NoticiaVisita[] = [
    { titulo: 'Nuevos horarios Línea 201 desde el lunes',   fecha: '19 May', autor: 'Admin', vistas: 2104, dotColor: '#2366CE' },
    { titulo: 'Mantenimiento paradero Barranco — sábado',   fecha: '18 May', autor: 'Admin', vistas: 1389, dotColor: '#22c55e' },
    { titulo: 'Desvío temporal en Av. San Martín',          fecha: '17 May', autor: 'Admin', vistas: 987,  dotColor: '#f59e0b' },
    { titulo: 'Integración con Lima Pass ahora disponible', fecha: '15 May', autor: 'Admin', vistas: 3561, dotColor: '#8b5cf6' },
  ];

  // ── Líneas viajes ──────────────────────────────────────────────────────────
  lineasViajes: LineaViaje[] = [
    { nombre: 'Línea 201', viajes: 547, pct: 100 },
    { nombre: 'Línea 202', viajes: 412, pct: 75  },
    { nombre: 'Línea 204', viajes: 298, pct: 54  },
    { nombre: 'Línea 203', viajes: 190, pct: 35  },
  ];

  get totalViajes(): number {
    return this.lineasViajes.reduce((acc, l) => acc + l.viajes, 0);
  }

  // ══════════════════════════════════════════════════════════════════
  //  LIVELINE — buffer + intervalo
  // ══════════════════════════════════════════════════════════════════

  private liveAgents   = 847;
  liveCurrentValue     = 847;
  liveBuffer: { time: number; value: number }[] = [];

  private liveInterval: any;
  private kpiInterval:  any;

  ngOnInit(): void {
    this.kpiInterval = setInterval(() => this.actualizarKpis(), 30_000);
    this.initLiveBuffer();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const el = this.liveWcRef?.nativeElement as any;
      if (el) {
        this.liveBuffer.forEach(p => el.pushPoint(p));
      }
      this.drawRegressionChart();
    }, 150);
  }

  ngOnDestroy(): void {
    if (this.liveInterval) clearInterval(this.liveInterval);
    if (this.kpiInterval)  clearInterval(this.kpiInterval);
  }

  irA(seccion: string): void { this.router.navigate([`/${seccion}`]); }
  onLogout(): void            { 
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);      }

  private actualizarKpis(): void {
    this.kpis = {
      ...this.kpis,
      busesEnFlota: Math.max(20, Math.min(45, this.kpis.busesEnFlota + Math.floor(Math.random() * 3) - 1)),
    };
    this.etaItems = this.etaItems.map(e => ({
      ...e,
      tiempo: e.tiempo <= 1 ? 15 : e.tiempo - 1,
      barPct: e.tiempo <= 1 ? 100 : Math.max(10, e.barPct - 5),
    }));
  }

  private initLiveBuffer(): void {
    const now          = () => Date.now() / 1000;
    const HISTORY_SECS = 900;
    const STEP         = 3;
    let a              = this.liveAgents;

    this.liveBuffer = Array.from({ length: HISTORY_SECS / STEP }, (_, i) => {
      a = Math.max(200, Math.min(1400, a + Math.floor(Math.random() * 14) - 7));
      return { time: now() - (HISTORY_SECS - i * STEP), value: a };
    });

    this.liveAgents       = a;
    this.liveCurrentValue = a;
    this.liveInterval = setInterval(() => this.pushLivePoint(), 3_000);
  }

  private pushLivePoint(): void {
    this.liveAgents = Math.max(200, Math.min(1400,
      this.liveAgents + Math.floor(Math.random() * 14) - 7,
    ));
    this.liveCurrentValue = this.liveAgents;

    const point = { time: Date.now() / 1000, value: this.liveAgents };
    this.liveBuffer = [...this.liveBuffer.slice(-599), point];

    const el = this.liveWcRef?.nativeElement as any;
    el?.pushPoint?.(point);
    this.cdr.markForCheck();
  }

  // ══════════════════════════════════════════════════════════════════
  //  REGRESIÓN LINEAL — % viajes con demora (una sola serie)
  // ══════════════════════════════════════════════════════════════════

  // Semanas observadas
  regressionLabels: string[] = ['S1','S2','S3','S4','S5','S6','S7','S8'];
  // Semanas proyectadas
  regressionProjectLabels: string[] = ['S9','S10','S11'];

  // % de viajes que llegaron con >5 min de demora, por semana
  demoraDatos: number[] = [12.4, 13.1, 14.8, 14.2, 16.0, 17.3, 18.1, 19.4];
  demoraColor           = '#1565c0';
  demoraLabel           = '% viajes con demora';

  regTooltip: {
    visible: boolean;
    x: number; y: number;
    label: string;
    values: {
      nombre: string; color: string;
      y: number; fitted: number;
      residual: number | null; isProjected: boolean;
    }[];
  } = { visible: false, x: 0, y: 0, label: '', values: [] };

  // ── OLS helpers ────────────────────────────────────────────────────────────

  private linReg(d: number[]): { slope: number; intercept: number } {
    const n     = d.length;
    const xMean = (n - 1) / 2;
    const yMean = d.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    d.forEach((y, x) => { num += (x - xMean) * (y - yMean); den += (x - xMean) ** 2; });
    const slope = den ? num / den : 0;
    return { slope, intercept: yMean - slope * xMean };
  }

  private regY(slope: number, intercept: number, x: number): number {
    return slope * x + intercept;
  }

  private computeStats(d: number[]) {
    const n                    = d.length;
    const { slope, intercept } = this.linReg(d);
    const yMean  = d.reduce((a, b) => a + b, 0) / n;
    const ssTot  = d.reduce((acc, y) => acc + (y - yMean) ** 2, 0);
    const ssRes  = d.reduce((acc, y, x) => acc + (y - this.regY(slope, intercept, x)) ** 2, 0);
    const r2     = ssTot ? 1 - ssRes / ssTot : 1;
    const r2adj  = n > 2 ? 1 - (1 - r2) * (n - 1) / (n - 2) : r2;
    const rmse   = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0;
    const xMean  = (n - 1) / 2;
    const ssx    = d.reduce((acc, _, x) => acc + (x - xMean) ** 2, 0);
    const slopeSE = ssx > 0 ? rmse / Math.sqrt(ssx) : 0;
    const tStat   = slopeSE > 0 ? slope / slopeSE : 0;
    const pVal    = this.approxPValue(tStat, n - 2);
    const ci95    = rmse * 1.96;
    const slopeLabel = (slope >= 0 ? '+' : '') + slope.toFixed(2) + ' pp/sem';
    const pLabel     = pVal < 0.001 ? 'p<0.001' : pVal < 0.01 ? 'p<0.01' : pVal < 0.05 ? `p=${pVal.toFixed(3)}` : `p=${pVal.toFixed(2)}`;
    const significativo = pVal < 0.05;
    return { slope, intercept, r2, r2adj, rmse, ci95, slopeLabel, pLabel, significativo };
  }

  private approxPValue(t: number, df: number): number {
    // Approximación normal para p-value de dos colas (suficiente para n >= 5)
    const x = df / (df + t * t);
    let p = 0, term = 1;
    for (let i = 1; i <= 50; i++) {
      term *= (i - 0.5) / i * x;
      p += term;
    }
    return Math.min(1, Math.max(0, Math.sqrt(x) * (1 + p)));
  }

  private hexAlpha(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  private rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(x, y, w, h, r);
    } else {
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  }

  // ── Render principal ───────────────────────────────────────────────────────

  drawRegressionChart(): void {
    const canvas = this.regCanvasRef?.nativeElement;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.clientWidth  || 700;
    const H   = canvas.clientHeight || 300;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const datos     = this.demoraDatos;
    const color     = this.demoraColor;
    const realN     = datos.length;
    const projCount = this.regressionProjectLabels.length;
    const TOTAL     = realN + projCount;
    const projStart = realN - 1;

    const { slope, intercept, r2, r2adj, rmse, ci95, slopeLabel, pLabel, significativo } = this.computeStats(datos);

    const PAD_L = 52, PAD_R = 24, PAD_T = 36, PAD_B = 44;
    const chartW = W - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;
    const stepX  = chartW / (TOTAL - 1);

    const allFitted  = Array.from({ length: TOTAL }, (_, i) => this.regY(slope, intercept, i));
    const projVals   = Array.from({ length: projCount }, (_, i) => this.regY(slope, intercept, realN + i));
    const maxVal     = Math.min(100, Math.max(...datos, ...projVals.map(v => v + ci95 * 1.5)) * 1.12);
    const minVal     = Math.max(0,   Math.min(...datos, ...allFitted) * 0.88);
    const range      = maxVal - minVal || 1;

    const xOf = (i: number) => PAD_L + i * stepX;
    const yOf = (v: number) => PAD_T + chartH - ((v - minVal) / range) * chartH;

    const allLabels = [...this.regressionLabels, ...this.regressionProjectLabels];

    // ── Fondo del área ────────────────────────────────────────────────────────
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(PAD_L, PAD_T, chartW, chartH);

    // ── Zona de proyección ────────────────────────────────────────────────────
    const projZoneX = xOf(projStart);
    const projZoneW = xOf(TOTAL - 1) - projZoneX;
    ctx.fillStyle = 'rgba(148,163,184,0.07)';
    ctx.fillRect(projZoneX, PAD_T, projZoneW, chartH);

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(projZoneX, PAD_T);
    ctx.lineTo(projZoneX, PAD_T + chartH);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#90a4ae';
    ctx.font = '500 10px "Inter",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▶ PROYECCIÓN', projZoneX + projZoneW / 2, PAD_T - 10);

    // ── Grid horizontal ───────────────────────────────────────────────────────
    for (let g = 0; g <= 5; g++) {
      const y   = PAD_T + (g / 5) * chartH;
      const val = maxVal - (g / 5) * (maxVal - minVal);
      ctx.strokeStyle = g === 5 ? '#90a4ae' : '#e8ecf0';
      ctx.lineWidth   = g === 5 ? 1.5 : 1;
      ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(PAD_L + chartW, y); ctx.stroke();
      ctx.fillStyle = '#90a4ae';
      ctx.font      = '500 10px "Inter",sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(1) + '%', PAD_L - 6, y + 3.5);
    }

    // ── Etiquetas X ───────────────────────────────────────────────────────────
    allLabels.forEach((lbl, i) => {
      const x = xOf(i);
      ctx.strokeStyle = '#e8ecf0'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, PAD_T + chartH); ctx.lineTo(x, PAD_T + chartH + 5); ctx.stroke();
      ctx.fillStyle  = i >= realN ? '#90a4ae' : '#90a4ae';
      ctx.font       = i >= realN ? 'italic 500 10px "Inter",sans-serif' : '500 10.5px "Inter",sans-serif';
      ctx.textAlign  = 'center';
      ctx.fillText(lbl, x, PAD_T + chartH + 18);
    });

    ctx.fillStyle = '#90a4ae'; ctx.font = '500 10px "Inter",sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Semana', PAD_L + chartW / 2, PAD_T + chartH + 34);

    ctx.save();
    ctx.translate(13, PAD_T + chartH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#90a4ae'; ctx.font = '500 10px "Inter",sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('% viajes con demora', 0, 0);
    ctx.restore();

    ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 1.5;
    ctx.strokeRect(PAD_L, PAD_T, chartW, chartH);

    // ── 1. Banda IC 95% — histórico (sutil, relleno suave) ───────────────────
    ctx.beginPath();
    for (let i = 0; i <= projStart; i++) {
      const ry = this.regY(slope, intercept, i);
      i === 0 ? ctx.moveTo(xOf(i), yOf(ry + ci95)) : ctx.lineTo(xOf(i), yOf(ry + ci95));
    }
    for (let i = projStart; i >= 0; i--) ctx.lineTo(xOf(i), yOf(this.regY(slope, intercept, i) - ci95));
    ctx.closePath();
    ctx.fillStyle = 'rgba(100,181,246,0.35)'; ctx.fill();

    // ── 2. Banda IC — proyección (más transparente y que crece) ──────────────
    ctx.beginPath();
    for (let i = projStart; i < TOTAL; i++) {
      const grow = ci95 * (1 + (i - projStart) * 0.5);
      const ry   = this.regY(slope, intercept, i);
      i === projStart ? ctx.moveTo(xOf(i), yOf(ry + grow)) : ctx.lineTo(xOf(i), yOf(ry + grow));
    }
    for (let i = TOTAL - 1; i >= projStart; i--) {
      const grow = ci95 * (1 + (i - projStart) * 0.5);
      ctx.lineTo(xOf(i), yOf(this.regY(slope, intercept, i) - grow));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(100,181,246,0.18)'; ctx.fill();

    // ── 3. Línea OLS continua — histórico (gruesa, protagonista) ─────────────
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(this.regY(slope, intercept, 0)));
    for (let i = 1; i <= projStart; i++) ctx.lineTo(xOf(i), yOf(this.regY(slope, intercept, i)));
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash([]); ctx.stroke();

    // ── 4. Línea OLS proyectada (punteada, mismo grosor) ─────────────────────
    ctx.beginPath();
    ctx.moveTo(xOf(projStart), yOf(this.regY(slope, intercept, projStart)));
    for (let i = projStart + 1; i < TOTAL; i++) ctx.lineTo(xOf(i), yOf(this.regY(slope, intercept, i)));
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]); ctx.stroke();
    ctx.setLineDash([]);

    // ── 5. Scatter — puntos observados (sueltos, sin línea que los conecte) ──
    datos.forEach((v, i) => {
      // Punto negro sólido — sin sombra exterior ni punto blanco interior
      ctx.beginPath(); ctx.arc(xOf(i), yOf(v), 5, 0, Math.PI*2);
      ctx.fillStyle = '#111827'; ctx.fill();
    });

    // ── 6. Ecuación + métricas centradas (estilo imagen de referencia) ────────
    const ecuacion = `ŷ = ${intercept.toFixed(1)} + ${slope.toFixed(2)}x`;
    const r2txt    = `R² = ${r2.toFixed(4)}`;
    const rmsetxt  = `RMSE = ${rmse.toFixed(2)} pp`;
    const tendtxt  = `Tendencia: ${slopeLabel}`;
    const ptxt     = `${pLabel}  ${significativo ? '(sig.)' : '(n.s.)'}`;

    // Posición: centro-izquierda del área del chart, bien separado de los puntos
    const ex = PAD_L + 14;
    const ey = PAD_T + 22;
    const lineH = 18;

    // Fondo del bloque de ecuación
    const textLines = [ecuacion, r2txt, rmsetxt, tendtxt, ptxt];
    ctx.font = '500 11px "Inter",monospace';
    const maxTW = Math.max(...textLines.map(t => ctx.measureText(t).width));
    const bkgW = maxTW + 24, bkgH = textLines.length * lineH + 16;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.strokeStyle = 'rgba(21,101,192,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath(); this.rrect(ctx, ex - 10, ey - 14, bkgW, bkgH, 8); ctx.fill(); ctx.stroke();

    // Acento de color izquierdo
    ctx.fillStyle = color;
    ctx.beginPath(); this.rrect(ctx, ex - 10, ey - 14, 3, bkgH, 2); ctx.fill();

    // Línea 1: ecuación (prominente, color)
    ctx.font = '700 12px "Inter",monospace';
    ctx.fillStyle = color; ctx.textAlign = 'left';
    ctx.fillText(ecuacion, ex, ey);

    // Líneas 2-5: métricas (más pequeñas, gris oscuro)
    ctx.font = '500 10px "Inter",monospace';
    [r2txt, rmsetxt, tendtxt, ptxt].forEach((txt, li) => {
      const isP = li === 3;
      ctx.fillStyle = isP
        ? (significativo ? '#16a34a' : '#dc2626')
        : '#475569';
      ctx.fillText(txt, ex, ey + (li + 1) * lineH);
    });

    // ── Crosshair ─────────────────────────────────────────────────────────────
    if (this.regTooltip.visible) {
      const hovIdx = allLabels.indexOf(this.regTooltip.label);
      if (hovIdx >= 0) {
        const hx = xOf(hovIdx);
        ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(100,116,139,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(hx, PAD_T); ctx.lineTo(hx, PAD_T + chartH); ctx.stroke();
        ctx.restore();
      }
    }
  }

  // ── Mouse handlers ────────────────────────────────────────────────────────

  onRegMouseMove(evt: MouseEvent): void {
    const canvas = this.regCanvasRef?.nativeElement;
    if (!canvas) return;
    const rect    = canvas.getBoundingClientRect();
    const PAD_L   = 52, PAD_R = 24;
    const realN   = this.demoraDatos.length;
    const TOTAL   = realN + this.regressionProjectLabels.length;
    const chartW  = canvas.clientWidth - PAD_L - PAD_R;
    const stepX   = chartW / (TOTAL - 1);
    const mx      = evt.clientX - rect.left - PAD_L;
    const idx     = Math.max(0, Math.min(TOTAL - 1, Math.round(mx / stepX)));
    const labels  = [...this.regressionLabels, ...this.regressionProjectLabels];
    const isProjd = idx >= realN;

    const { slope, intercept } = this.linReg(this.demoraDatos);
    const observed = isProjd ? null : this.demoraDatos[idx];
    const fitted   = +this.regY(slope, intercept, idx).toFixed(2);
    const y        = +(observed ?? fitted);
    const residual = observed !== null ? +(observed - fitted).toFixed(2) : null;

    this.regTooltip = {
      visible: true,
      x:       evt.clientX - rect.left + 14,
      y:       evt.clientY - rect.top  - 20,
      label:   labels[idx],
      values:  [{ nombre: this.demoraLabel, color: this.demoraColor, y, fitted, residual, isProjected: isProjd }],
    };
    this.drawRegressionChart();
  }

  onRegMouseLeave(): void {
    this.regTooltip = { ...this.regTooltip, visible: false };
    this.drawRegressionChart();
  }
}