import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth';


@Component({
  selector: 'app-canal-atencion',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './canalatencion.html',
  styleUrl: './canalatencion.css'
})
export class CanalAtencionComponent {

  // ── Estado de acordeones ─────────────────────────────────────
  // Guarda el id del acordeón abierto (null = todos cerrados)
  acordeonAbierto: number | null = null;

  constructor(private router: Router, private auth: AuthService) {}

  toggleAcc(id: number): void {
    // Si ya está abierto, lo cierra; si no, abre el clickeado
    this.acordeonAbierto = this.acordeonAbierto === id ? null : id;

    // Aplica la clase 'open' al elemento del DOM
    for (let i = 1; i <= 7; i++) {
      const el = document.getElementById(`acc-${i}`);
      if (!el) continue;
      if (i === id && this.acordeonAbierto === id) {
        el.classList.add('open');
      } else {
        el.classList.remove('open');
      }
    }
  }

  irA(seccion: string): void {
    this.router.navigate([`/${seccion}`]);
  }

  irInicio(): void {
    this.router.navigate(['/inicio']);
  }

  onLogout(): void {
    this.router.navigate(['/login']);
  }
}