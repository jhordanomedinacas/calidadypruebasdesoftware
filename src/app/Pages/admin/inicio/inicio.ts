import { Component, AfterViewInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { NavbarComponent } from '../../../components/navbar/navbar';

const fadeSlideIn = trigger('fadeSlideIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(24px)' }),
    animate('420ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

@Component({
  selector: 'app-inicio-admin',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
  animations: [fadeSlideIn],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class IniciAdminComponent implements AfterViewInit, OnDestroy {

  private observers: ResizeObserver[] = [];

  /* ── Datos del admin ── */
  nombreAdmin = 'JHORDAN';

  /* ── KPIs del hero (conectar con servicio real) ── */
  kpiBusesEnRuta     = 12;
  kpiUsuariosActivos = 3000;
  kpiAlertasActivas  = 7;

  constructor(private router: Router) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.initBorderTraces(), 50);
  }

  ngOnDestroy(): void {
    this.observers.forEach(o => o.disconnect());
  }

  /* ── Efecto trazo animado en service-cards ── */
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

  /* ── Navegación ── */
  irA(seccion: string): void {
    this.router.navigate([`/${seccion}`]);
  }

  onLogout(): void {
    this.router.navigate(['/login']);
  }
}