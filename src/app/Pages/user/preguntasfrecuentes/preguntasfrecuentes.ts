import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth';

export interface Pregunta {
  id: number;
  pregunta: string;
  respuesta: string;
  categoria: 'servicio' | 'prediccion' | 'pagos' | 'denuncias' | 'chatbot' | 'plataforma';
  iconPath: string;
  iconColor?: string;
  abierto: boolean;
}

@Component({
  selector: 'app-preguntasfrecuentes',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './preguntasfrecuentes.html',
  styleUrl: './preguntasfrecuentes.css'
})
export class PreguntasFrecuentesComponent implements OnInit {

  busqueda: string = '';
  categoriaActiva: string = 'todos';

  private todasLasPreguntas: Pregunta[] = [
    // ── SERVICIO ─────────────────────────────────────────────────
    {
      id: 1,
      pregunta: '¿Cuáles son las rutas disponibles del Corredor Azul?',
      respuesta: 'El Corredor Azul opera en Lima Norte, Lima Centro y Lima Sur bajo los estándares de la ATU. Consulta todas las rutas desde la sección "Ubicación" con datos GTFS actualizados en el mapa interactivo.',
      categoria: 'servicio',
      iconPath: 'M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497z',
      iconColor: '#16a34a',
      abierto: true
    },
    {
      id: 2,
      pregunta: '¿En qué horarios opera el servicio?',
      respuesta: 'El Corredor Azul opera de lunes a domingo de 5:00 am a 11:00 pm. Los horarios pueden variar en feriados nacionales. Consulta la sección de Noticias para ver alertas de cambios de horario.',
      categoria: 'servicio',
      iconPath: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
      iconColor: '#16a34a',
      abierto: false
    },
    {
      id: 3,
      pregunta: '¿Cuánto cuesta el pasaje?',
      respuesta: 'El pasaje estándar del Corredor Azul cuesta S/ 2.50. Estudiantes con carné vigente pagan S/ 1.25. El pago se realiza con la tarjeta Lima Pass, que puedes recargar desde la plataforma.',
      categoria: 'servicio',
      iconPath: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      iconColor: '#16a34a',
      abierto: false
    },

    // ── PREDICCIÓN IA ─────────────────────────────────────────────
    {
      id: 4,
      pregunta: '¿Cómo calcula la plataforma el tiempo de llegada del bus?',
      respuesta: 'Usamos un modelo de inteligencia artificial (LSTM) entrenado con datos históricos de la flota, tráfico y hora del día. El tiempo mostrado es predictivo, no GPS en tiempo real. Siempre verás un indicador de confianza: alto, medio o bajo.',
      categoria: 'prediccion',
      iconPath: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5',
      iconColor: '#7c3aed',
      abierto: false
    },
    {
      id: 5,
      pregunta: '¿Qué tan precisa es la predicción de llegada?',
      respuesta: 'En condiciones normales de tráfico, el modelo tiene una precisión de ±2 minutos en el 85% de los casos. En horas punta o condiciones de tráfico inusuales, el margen puede ser mayor y el indicador mostrará confianza baja.',
      categoria: 'prediccion',
      iconPath: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
      iconColor: '#7c3aed',
      abierto: false
    },
    {
      id: 6,
      pregunta: '¿Puedo ver cuándo llegan el segundo y tercer bus?',
      respuesta: 'Sí. En la sección "Ubicación" cada tarjeta de bus muestra el tiempo estimado de llegada individualmente. Puedes ver varios buses de la misma línea simultáneamente para planificar mejor tu viaje.',
      categoria: 'prediccion',
      iconPath: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
      iconColor: '#7c3aed',
      abierto: false
    },

    // ── PAGOS ─────────────────────────────────────────────────────
    {
      id: 7,
      pregunta: '¿Cómo recargo mi saldo desde la plataforma?',
      respuesta: 'Ve a la sección "Recargar saldo" desde el menú principal o desde tu tarjeta Lima Pass en el inicio. Puedes recargar con Yape, Plin, PagoEfectivo o tarjeta de crédito/débito. El saldo se acredita de forma inmediata.',
      categoria: 'pagos',
      iconPath: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
      iconColor: '#b45309',
      abierto: false
    },
    {
      id: 8,
      pregunta: '¿La plataforma me avisa cuando mi saldo está por acabarse?',
      respuesta: 'Sí. Cuando tu saldo llegue a S/ 5.00 o menos, recibirás una notificación en la campana del navbar y también mediante correo electrónico, para que puedas recargar antes de quedarte sin saldo.',
      categoria: 'pagos',
      iconPath: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
      iconColor: '#b45309',
      abierto: false
    },

    // ── DENUNCIAS ─────────────────────────────────────────────────
    {
      id: 9,
      pregunta: '¿Cómo registro una denuncia?',
      respuesta: 'Puedes registrar una denuncia desde la sección "Denuncias" en el menú lateral. Selecciona el tipo de incidencia (conducta del conductor, mal estado del bus, cobro indebido, etc.), adjunta evidencia si tienes y envía el reporte. Recibirás un número de seguimiento.',
      categoria: 'denuncias',
      iconPath: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
      iconColor: '#dc2626',
      abierto: false
    },
    {
      id: 10,
      pregunta: '¿En cuánto tiempo responden mi denuncia?',
      respuesta: 'Las denuncias son revisadas por el equipo de Corredor Azul en un plazo de 3 a 5 días hábiles. Recibirás actualizaciones del estado de tu denuncia directamente en la plataforma y por correo electrónico.',
      categoria: 'denuncias',
      iconPath: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
      iconColor: '#dc2626',
      abierto: false
    },

    // ── CHATBOT ───────────────────────────────────────────────────
    {
      id: 11,
      pregunta: '¿Qué puede hacer el chatbot de Corredor Azul?',
      respuesta: 'El chatbot puede responder preguntas frecuentes sobre rutas, horarios, tarifas y el estado del servicio. También puede guiarte paso a paso para recargar tu saldo o registrar una denuncia. Para problemas técnicos complejos, te redirigirá a Soporte.',
      categoria: 'chatbot',
      iconPath: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
      iconColor: '#0369a1',
      abierto: false
    },

    // ── PLATAFORMA ────────────────────────────────────────────────
    {
      id: 12,
      pregunta: '¿La plataforma funciona en dispositivos móviles?',
      respuesta: 'Sí, la plataforma web de Corredor Azul está optimizada para móviles y tablets. Próximamente estará disponible como aplicación nativa en Android e iOS con funcionalidades adicionales como seguimiento GPS en segundo plano.',
      categoria: 'plataforma',
      iconPath: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3H9m1.5-12H9',
      iconColor: '#1d4ed8',
      abierto: false
    },
    {
      id: 13,
      pregunta: '¿Cómo cambio mis datos de perfil?',
      respuesta: 'Haz clic en tu avatar en la esquina superior derecha y selecciona "Mi cuenta". Desde allí puedes actualizar tu nombre, correo, contraseña y preferencias de notificación.',
      categoria: 'plataforma',
      iconPath: 'M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z',
      iconColor: '#1d4ed8',
      abierto: false
    }
  ];

  preguntasFiltradas: Pregunta[] = [];

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    this.preguntasFiltradas = [...this.todasLasPreguntas];
  }

  // ── Filtrar por búsqueda y categoría ────────────────────────────
  filtrar(): void {
    const busq = this.busqueda.toLowerCase().trim();
    this.preguntasFiltradas = this.todasLasPreguntas.filter(p => {
      const matchCategoria = this.categoriaActiva === 'todos' || p.categoria === this.categoriaActiva;
      const matchBusqueda  = !busq ||
        p.pregunta.toLowerCase().includes(busq) ||
        p.respuesta.toLowerCase().includes(busq);
      return matchCategoria && matchBusqueda;
    });
  }

  setCategoria(cat: string): void {
    this.categoriaActiva = cat;
    this.filtrar();
  }

  // ── Accordion ───────────────────────────────────────────────────
  toggle(p: Pregunta): void {
    p.abierto = !p.abierto;
  }

  // ── Helpers de grupos ────────────────────────────────────────────
  getGrupo(cat: string): Pregunta[] {
    return this.preguntasFiltradas.filter(p => p.categoria === cat);
  }

  grupoVisible(cat: string): boolean {
    return this.getGrupo(cat).length > 0;
  }

  // ── Navegación ───────────────────────────────────────────────────
  irA(seccion: string): void {
    this.router.navigate([`/${seccion}`]);
  }

  onLogout(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }
}