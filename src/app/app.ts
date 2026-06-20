import { Component, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { HeadbotComponent } from './components/headbot/headbot';

const RUTAS_SIN_BOT = ['/login', '/registro', '/olvidecontra', '/reset-password'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HeadbotComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class App {
  protected readonly title = signal('Frontend');
  mostrarBot = false;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.mostrarBot = !RUTAS_SIN_BOT.includes(e.urlAfterRedirects);

      // Cerrar paneles del widget de accesibilidad al navegar
      // El #caAccOutlineOverlay es un div transparente con z-index:10069 que
      // bloquea todos los clicks cuando queda abierto tras la navegación.
      const outlineOverlay = document.getElementById('caAccOutlineOverlay');
      const outlinePanel   = document.getElementById('caAccOutlinePanel');
      const panelOverlay   = document.getElementById('caAccPanelOverlay');
      const panel          = document.getElementById('caAccPanel');
      outlineOverlay?.classList.remove('open');
      outlinePanel?.classList.remove('open');
      panelOverlay?.classList.remove('open');
      panel?.classList.remove('open');
    });
  }
}