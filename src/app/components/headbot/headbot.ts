import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';

declare global {
  interface Window {
    initHeadBot:  () => void;
    destroyHeadBot: () => void;
    navegarA: (ruta: string) => void;
  }
}

@Component({
  selector: 'app-headbot',
  templateUrl: './headbot.html',
  styleUrls: ['./headbot.css'],
  standalone: true,
  imports: [],
})
export class HeadbotComponent implements OnInit, OnDestroy {

  constructor(private router: Router, private ngZone: NgZone) {}

  ngOnInit(): void {
    // Exponer función de navegación para que headBot.js pueda redirigir
    window.navegarA = (ruta: string) => {
      this.ngZone.run(() => this.router.navigate([ruta]));
    };

    const existing = document.querySelector('script[data-headbot]');
    if (existing) {
      window.initHeadBot();
      return;
    }
    const script = document.createElement('script');
    script.src = 'headBot.js';
    script.setAttribute('data-headbot', '');
    script.onload = () => window.initHeadBot();
    document.body.appendChild(script);
  }

  ngOnDestroy(): void {
    window.destroyHeadBot();
    // Limpiar la función al destruir el componente
    delete (window as any).navegarA;
  }
}