# 📊 Análisis Completo - Frontend Corredor Azul

**Proyecto:** ProyectoCorredorAzul - Frontend  
**Versión Angular:** 21.2.0  
**Tecnología:** Angular Standalone Components + RxJS  
**Ubicación:** `d:\Octavo ciclo\Solucionesweb\ProyectoCorredorAzul\Frontend`

---

## 🏗️ 1. ESTRUCTURA GENERAL

### Organización del Proyecto

```
src/app/
├── app.ts                    # Componente raíz (standalone)
├── app.config.ts             # Configuración de providers
├── app.routes.ts             # Definición de rutas
│
├── services/
│   ├── auth.ts              # Servicio de autenticación
│   └── perfil.ts            # Servicio de perfil de usuario ← NUEVO
│
├── guards/
│   └── auth-guard.ts        # Guard de protección de rutas
│
├── interceptors/
│   └── auth-interceptor.ts  # Inyecta Bearer token en cabeceras HTTP
│
├── components/              # Componentes reutilizables
│   ├── navbar/
│   └── headbot/
│
├── Pages/                   # Páginas/Vistas principales
│   ├── login/
│   ├── registro/
│   ├── olvidecontra/
│   ├── resetpassword/
│   └── user/                # Sección usuario autenticado
│       ├── inicio/
│       ├── verbuses/
│       ├── ubicacion/
│       ├── recargas/
│       ├── canalatencion/
│       ├── noticias/
│       │   └── ver-noticia/
│       ├── preguntasfrecuentes/
│       ├── rutas-favoritas/
│       └── dashboard/
│   └── admin/               # Sección administrador
│       ├── dashboard/
│       ├── inicio/
│       ├── gestionar-usuarios/
│       └── gestionar-lineas/
│
└── assets/
    └── liveline-wc/         # Web Component para liveline
```

### Características de Implementación

- ✅ **Standalone Components**: No usa NgModules, componentes independientes
- ✅ **Routing con Hash Location**: Rutas con `#` para compatibilidad
- ✅ **Reactive Forms**: Validación de formularios con ReactiveFormsModule
- ✅ **Inyección de dependencias**: Servicios providedIn: 'root'
- ✅ **localStorage**: Manejo de tokens y sesión en cliente
- ✅ **Animaciones**: Transiciones personalizadas con `@angular/animations`
- ✅ **HTTP Interceptor**: Inyecta token JWT automáticamente en todas las peticiones
- ⚠️ **Sin Zone.js**: No se importa `zone.js` → change detection manual obligatorio (ver sección 10)

---

## 📋 2. INTERFACES Y TIPOS DEFINIDOS

### 2.1 Interfaces de Autenticación (auth.ts)

```typescript
export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface VerificarRequest {
  correo: string;
  codigo: string;  // Código OTP de 6 dígitos
}

export interface RegistroRequest {
  nombre: string;
  apellido1: string;
  apellido2?: string;
  tipoDocumento: string;
  numDocumento: string;
  telefono: string;
  correo: string;
  contrasena: string;
}

export interface ResetPasswordRequest {
  token: string;
  nuevaContrasena: string;
}

export interface MensajeResponse { mensaje: string; }
export interface TokenResponse   { token: string; mensaje: string; }
```

### 2.2 Interfaces de Perfil (perfil.ts) ← NUEVO

```typescript
export interface PerfilResponse {
  nombres:       string;
  apellidos:     string;
  tipoDocumento: string;
  nroDocumento:  string;
  correo:        string;
  telefono:      string;
  tipoTarjeta:   string;
}

export interface EditarPerfilRequest {
  nombres:       string;
  apellidos:     string;
  tipoDocumento: string;
  nroDocumento:  string;
  telefono:      string;
}

export interface CambiarContrasenaRequest {
  contrasenaActual: string;
  contrasenaNueva:  string;
}

export interface MensajeResponse { mensaje: string; }
```

### 2.3 Interfaces del Dashboard (dashboard.ts)

```typescript
export interface KpiDashboard {
  usuariosActivos: number;
  busesEnFlota: number;
  recargasHoy: number;
  montoRecargasHoy: number;
  reportesEnviados: number;
  reportesPendientes: number;
}

export interface UsuarioReciente {
  iniciales: string;
  avatarClass: string;
  nombre: string;
  ruta: string;
  hace: string;
  rol: string;
  rolClass: string;
}

export interface EtaItem {
  linea: string;
  color: string;
  tiempo: number;
  barPct: number;
  tiempoColor: string;
  tiempoBg: string;
  paradero: string;
}

export interface NoticiaVisita {
  titulo: string;
  fecha: string;
  autor: string;
  vistas: number;
  dotColor: string;
}

export interface LineaViaje {
  nombre: string;
  viajes: number;
  pct: number;
}

export interface EventoImpacto {
  nombre: string;
  fecha: string;
  lugar: string;
  semana: string;
  tipo: 'alto' | 'medio' | 'festivo';
  impactoLabel: string;
  emoji: string;
  rutas: string[];
}
```

### 2.4 Interfaces Locales de Componentes

#### Navbar (navbar.ts)
```typescript
interface Notificacion {
  id: number;
  tipo: 'operativa' | 'saldo';
  titulo: string;
  descripcion: string;
  hora: string;
  leida: boolean;
}
```

#### Ubicacion (ubicacion.ts)
```typescript
export interface Bus {
  id: number; linea: string; origen: string; destino: string;
  unidad: number; tiempoLlegada: number; distancia: number;
  duracionTotal: number; estado: string; estadoColor: string;
  estadoDot: string; siguiendo: boolean;
}

export interface Paradero {
  id: string; nombre: string; lat: number; lng: number; lineas: string[];
}

type PasoViaje = 'acercando' | 'abordo' | 'fin';
type EstadoGps  = 'inactivo' | 'cargando' | 'activo' | 'error';
type EstadoIA   = 'idle' | 'pensando' | 'respondido';
```

#### Inicio Usuario (inicio.ts)
```typescript
interface Tarjeta {
  id: string; alias: string; empresa: string; codigo: string; imagen: string;
}
```

---

## 🔐 3. FLUJO DE AUTENTICACIÓN Y AUTORIZACIÓN

### 3.1 Flujo Completo

```
1. Usuario accede a ruta privada
   ↓
2. authGuard verifica localStorage.auth_token
   ├── NO → redirige a /login
   └── SÍ → permite acceso
        ↓
3. auth-interceptor inyecta Bearer token en todas las peticiones HTTP

Login (2 pasos):
Paso 1: POST /api/v1/auth/login { correo, contrasena }
   → success: mostrar formulario de código OTP (5 min de validez)
   → error 401: "Correo o contraseña incorrectos"

Paso 2: POST /api/v1/auth/verificar { correo, codigo }
   → success: recibe { token } → guardarToken → redirige según rol
   → error: "Código incorrecto o expirado"

Roles detectados en JWT (getRol()):
  rol 2 ó 3 → redirige a /inicia  (admin)
  otro       → redirige a /inicio  (usuario)
```

### 3.2 AuthService — Métodos

```typescript
login(body: LoginRequest)          → POST /api/v1/auth/login
verificar(body: VerificarRequest)  → POST /api/v1/auth/verificar
reenviar(correo: string)           → POST /api/v1/auth/reenviar
recuperar(correo: string)          → POST /api/v1/auth/recuperar
validarToken(token: string)        → GET  /api/v1/auth/validar-token?token=
resetPassword(body)                → POST /api/v1/auth/reset-password
registro(body: RegistroRequest)    → POST /api/v1/auth/registro

guardarToken(token)   → localStorage.setItem('auth_token', token)
obtenerToken()        → localStorage.getItem('auth_token')
cerrarSesion()        → localStorage.removeItem('auth_token')
estaAutenticado()     → !!obtenerToken()
obtenerDatosUsuario() → decodifica JWT y retorna payload
getRol()              → retorna rol numérico del token
```

### 3.3 PerfilService — Métodos ← NUEVO

```typescript
// Base: http://localhost:8080/api/v1/perfil
obtener()                                → GET    /api/v1/perfil
editar(body: EditarPerfilRequest)        → PUT    /api/v1/perfil
cambiarContrasena(body: CambiarContras.) → PATCH  /api/v1/perfil/contrasena
```

### 3.4 AuthInterceptor

```typescript
// Inyecta automáticamente el token en TODAS las peticiones HTTP
Authorization: Bearer <token>

// Manejo de errores:
// 401 → cerrarSesion() + redirige a /login
```

### 3.5 AuthGuard

```typescript
export const authGuard: CanActivateFn = () => {
  if (auth.estaAutenticado()) return true;
  router.navigate(['/login']);
  return false;
};
```

**Nivel de seguridad:** ⚠️ Básico — no valida token con backend ni expiración.

---

## 🛣️ 4. RUTAS DEFINIDAS (app.routes.ts)

### Rutas Públicas

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | — | Redirecciona a `/login` |
| `/login` | `LoginComponent` | Inicio de sesión (2FA OTP) |
| `/registro` | `RegistroComponent` | Registro de usuario |
| `/olvidecontra` | `OlvidecontraComponent` | Recuperación de contraseña |
| `/reset-password` | `ResetPasswordComponent` | Resetear contraseña con token |

### Rutas Privadas — Usuario

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/inicio` | `InicioComponent` | Dashboard del usuario |
| `/user/verbuses` | `VerBusesComponent` | Ver buses disponibles |
| `/user/ubicacion` | `UbicacionComponent` | Mapa en tiempo real + GPS |
| `/user/recargas` | `RecargasComponent` | Recargar tarjeta |
| `/user/canalatencion` | `CanalAtencionComponent` | Atención al cliente |
| `/user/noticias` | `NoticiasComponent` | Noticias del sistema |
| `/user/faq` | `PreguntasFrecuentesComponent` | Preguntas frecuentes |
| `/user/noticias/ver-noticia` | `VerNoticiaComponent` | Detalle de noticia |
| `/rutas-favoritas` | `RutasFavoritasComponent` | Rutas favoritas |

### Rutas Privadas — Admin

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/dashboarda` | `DashboardComponent` | Dashboard administrativo |
| `/inicia` | `IniciAdminComponent` | Home admin |
| *(admin extra)* | `GestionarUsuariosComponent` | Gestión de usuarios |
| *(admin extra)* | `GestionarLineasComponent` | Gestión de líneas |

⚠️ Las rutas admin no implementan validación de rol — cualquier usuario autenticado puede acceder.

---

## 🧩 5. SERVICIOS Y RESPONSABILIDADES

### AuthService (`services/auth.ts`)
- Comunicación con backend de autenticación
- Gestión de tokens en localStorage
- Decodificación de JWT para datos de sesión
- Endpoints: login, verificar, reenviar, recuperar, resetPassword, registro

### PerfilService (`services/perfil.ts`) ← NUEVO
- Gestión del perfil del usuario autenticado
- `obtener()` → carga datos completos del perfil desde API
- `editar()` → actualiza nombres, documento y teléfono
- `cambiarContrasena()` → cambia contraseña con verificación de la actual
- El token se inyecta automáticamente via `auth-interceptor`

---

## 📱 6. COMPONENTES — DETALLE

### 6.1 Componentes Públicos

#### LoginComponent (`Pages/login/login.ts`)
```
Autenticación en 2 pasos (credenciales + OTP).

Estado:
- paso: 1 | 2
- loginForm: { email, password, remember }
- codigoForm: { codigo (6 dígitos) }
- tiempoRestante: número (countdown 5 min, usa Date.now() para precisión entre pestañas)
- loading, errorMessage, showPassword

Change detection: ChangeDetectorRef + NgZone.run() en todos los callbacks HTTP y setInterval.
El countdown corre fuera de NgZone (runOutsideAngular) para no impactar performance,
pero cada tick entra con ngZone.run() + cdr.detectChanges().
```

#### OlvidecontraComponent (`Pages/olvidecontra/olvidecontra.ts`)
```
Recuperación de contraseña en 2 pasos.

Paso 1: ingresa correo → POST /api/v1/auth/recuperar
Paso 2: confirma recepción → puede reenviar

Countdown: 15 minutos (900s) → setInterval con cdr.detectChanges() en cada tick.
Change detection: ChangeDetectorRef inyectado, detectChanges() en callbacks HTTP y setInterval.
```

#### RegistroComponent (`Pages/registro/registro.ts`)
```
Registro de nuevo usuario con modal de políticas de datos
y modal de éxito al finalizar.
```

#### ResetPasswordComponent (`Pages/resetpassword/resetpassword.ts`)
```
Resetear contraseña con token de recuperación.
```

### 6.2 Componentes Usuario Autenticado

#### InicioComponent (`Pages/user/inicio/inicio.ts`)
```
Dashboard/home del usuario.

- Carrusel de tarjetas (drag/swipe con mouse y touch)
- Modales: agregar tarjeta, editar tarjeta, eliminar tarjeta
- nombreUsuario: leído del JWT en constructor

Escucha (perfilActualizado) del navbar para actualizar el saludo
"Hola, {nombre}" en tiempo real cuando el usuario edita su perfil.
Change detection: ChangeDetectorRef + detectChanges() en el handler del evento.
```

#### UbicacionComponent (`Pages/user/ubicacion/ubicacion.ts`)
```
Mapa interactivo con Leaflet + GPS + buses simulados + IA.

Características:
- Carga Leaflet dinámicamente (no bundleado)
- GPS via navigator.geolocation
- Paraderos del Corredor Azul (10 paraderos reales de Lima)
- 3 buses simulados con rutas OSRM reales
- Animación de buses: avanza 1 waypoint cada 1.8s, parada en paraderos (~60s)
- Seguir bus: zoom + oculta otros buses + ETA dinámico
- Ver ruta: overlay de paraderos de la línea
- IA: consulta a /api/claude para responder sobre destinos
- ETA predictivo: POST http://localhost:8001/predecir-eta (FastAPI ML)

Change detection (5 puntos con cdr.detectChanges()):
1. procesarUbicacion() — GPS callback
2. consultarETA() — fetch FastAPI
3. consultarIA() — fetch Claude API
4. cargarLeaflet() script.onload
5. iniciarSimulacion() setInterval cada 1.8s

ngZone.run() usado en todos los callbacks async para evitar problemas de contexto.
```

#### RecargasComponent (`Pages/user/recargas/recargas.ts`)
```
Recarga de tarjeta/saldo. Integra NavbarComponent.
```

#### CanalAtencionComponent (`Pages/user/canalatencion/canalatencion.ts`)
```
Soporte y atención al cliente. Integra NavbarComponent.
```

#### NoticiasComponent (`Pages/user/noticias/noticias.ts`)
```
Listado de noticias del sistema. Integra NavbarComponent.
```

#### VerNoticiaComponent (`Pages/user/noticias/ver-noticia/ver-noticia.ts`)
```
Detalle completo de una noticia.
```

#### PreguntasFrecuentesComponent (`Pages/user/preguntasfrecuentes/preguntasfrecuentes.ts`)
```
FAQ del sistema. Integra NavbarComponent.
```

#### RutasFavoritasComponent (`Pages/user/rutas-favoritas/rutas-favoritas.ts`)
```
Gestionar rutas favoritas del usuario. Integra NavbarComponent.
```

### 6.3 Componentes Admin

#### IniciAdminComponent (`Pages/admin/inicio/inicio.ts`)
```
Home del administrador.

nombreAdmin: leído del JWT en constructor.
Escucha (perfilActualizado) del navbar para actualizar el saludo en tiempo real.
Change detection: ChangeDetectorRef + detectChanges() en handler del evento.
```

#### DashboardComponent (`Pages/admin/dashboard/dashboard.ts`)
```
Dashboard administrativo con KPIs, gráficos (ng2-charts),
usuarios recientes, ETA de buses, noticias más vistas,
líneas con más viajes, eventos de alto impacto.
```

### 6.4 Componentes Reutilizables

#### NavbarComponent (`components/navbar/navbar.ts`) ← ACTUALIZADO

```
Barra de navegación presente en todas las páginas autenticadas.

Datos de usuario:
- primerNombre, inicial: del JWT (constructor), actualizables al editar perfil
- nombreCompleto, tipoDocumento, nroDocumento, correo, telefono, tipoTarjeta:
  cargados desde PerfilService.obtener() en ngOnInit y cada vez que se abre el modal

Modales disponibles:
1. Mi perfil         — visualización de datos del usuario
2. Editar perfil     — formulario de edición (nombres, apellidos, tipoDoc, nroDoc, teléfono)
3. Cambiar contraseña — 3 campos con toggle show/hide + validación de coincidencia
4. Éxito editar perfil    — modal de confirmación verde con chip del nombre actualizado
5. Éxito cambiar contraseña — modal de confirmación verde con chip "Cuenta segura"
6. Notificaciones    — dropdown con badge de no leídas
7. Reporte de problema — 16 categorías, descripción, imagen opcional
8. Éxito reporte     — confirmación de envío
9. Cerrar sesión     — confirmación antes de logout

Cierre de modales:
- Todos los nuevos modales usan (click)="$event.target === $event.currentTarget && closeMethod()"
  en el overlay (más robusto que classList.contains, no depende de stopPropagation).

Outputs:
- logout: EventEmitter<void>           → emite al confirmar cierre de sesión
- perfilActualizado: EventEmitter<string> → emite el nuevo primerNombre al guardar el perfil

Actualización de perfil (guardarPerfil()):
- Llama PUT /api/v1/perfil
- Al éxito: actualiza TODAS las propiedades de display inmediatamente (sin segunda llamada HTTP)
- Emite perfilActualizado con el nuevo primerNombre
- Llama cdr.detectChanges() para forzar re-render (sin zone.js)

Change detection: ChangeDetectorRef.detectChanges() en todos los callbacks HTTP:
- cargarPerfil() next/error
- guardarPerfil() next/error
- guardarContrasena() next/error

Notificaciones: mock data (4 notificaciones), pendiente conectar con backend.
Reporte: actualmente solo console.log, pendiente endpoint de envío.
```

#### HeadbotComponent (`components/headbot/headbot.ts`)
```
Chat bot integrado como Web Component.
Visible en todas las rutas EXCEPTO: /login, /registro, /olvidecontra, /reset-password.
```

---

## 📦 7. DEPENDENCIAS PRINCIPALES

```json
{
  "@angular/core": "^21.2.0",
  "@angular/forms": "^21.2.0",
  "@angular/animations": "^21.2.10",
  "@angular/router": "^21.2.0",
  "rxjs": "~7.8.0",
  "chart.js": "^4.5.1",
  "ng2-charts": "^10.0.0",
  "liveline": "^0.0.7",
  "react": "^19.2.6",
  "react-dom": "^19.2.6",
  "tailwindcss": "^4.1.12",
  "typescript": "~5.9.2",
  "vitest": "^4.0.8"
}
```

**Backend API base:** `http://localhost:8080/api/v1`  
**ML FastAPI (ETA):** `http://localhost:8001`  
**Claude API proxy:** `/api/claude`

---

## 🔄 8. FLUJOS PRINCIPALES

### Flujo 1: Login 2FA

```
Login Form → POST /auth/login
  ↓ success
Formulario OTP (countdown 5 min, preciso con Date.now())
  ↓ código válido
POST /auth/verificar → recibe JWT
  ↓
guardarToken → localStorage
  ↓
Redirige: rol 2/3 → /inicia  |  otro → /inicio
```

### Flujo 2: Editar Perfil (desde Navbar)

```
Click "Editar perfil" en modal Mi Perfil
  ↓
Abre modal con campos pre-rellenos desde datos cargados
  ↓
Usuario modifica → click "Guardar cambios"
  ↓
PUT /api/v1/perfil { nombres, apellidos, tipoDocumento, nroDocumento, telefono }
  ↓ success (sin esperar nueva llamada GET)
Actualiza: nombreCompleto, primerNombre, inicial, tipoDocumento, nroDocumento, telefono
Emite: perfilActualizado(primerNombre) → página padre actualiza "Hola, {nombre}"
Abre: modal de éxito con chip del nombre actualizado
cdr.detectChanges() → UI se actualiza inmediatamente
  ↓ error
Muestra mensaje de error inline en el formulario
```

### Flujo 3: Cambiar Contraseña (desde Navbar)

```
Click "Contraseña" en modal Mi Perfil
  ↓
Abre modal con 3 campos (contraseña actual, nueva, confirmar)
Toggle show/hide en cada campo
  ↓
Validación local: nueva === confirmar
  ↓
PATCH /api/v1/perfil/contrasena { contrasenaActual, contrasenaNueva }
  ↓ success
Abre modal de éxito "Cuenta segura"
  ↓ error (401 = contraseña actual incorrecta)
Muestra mensaje de error inline
```

### Flujo 4: GPS y Mapa (Ubicacion)

```
ngAfterViewInit → cargarLeaflet()
ngOnInit → activarGPS() (con 300ms delay)
  ↓
navigator.geolocation.getCurrentPosition()
  → error: usa coordenadas por defecto (-12.0564, -77.0428 = Lima Centro)
  ↓
procesarUbicacion(lat, lng)
  → calcula paraderoMasCercano (Haversine)
  → consultarETA() → POST localhost:8001/predecir-eta
  → renderizarMapaUnificado() (si Leaflet ya cargó)
  ↓
Mapa muestra:
  - Mi ubicación (burbuja azul animada)
  - 10 paraderos del Corredor Azul
  - Ruta peatonal al paradero más cercano (OSRM foot)
  - 3 buses simulados con rutas reales (OSRM driving multi-waypoint)
  ↓
Simulación: setInterval 1.8s
  → avanza 1 waypoint por tick
  → detecta paraderos (radio 80m) → pausa ~60s
  → actualiza estado en card (En movimiento / Detenido / En paradero)
  → cdr.detectChanges() en cada tick
```

### Flujo 5: Recuperación de Contraseña

```
/olvidecontra → ingresa correo
POST /auth/recuperar → paso 2 (countdown 15 min)
  ↓
Backend envía link al correo → /reset-password?token=...
POST /auth/reset-password { token, nuevaContrasena }
  ↓ success → /login
```

---

## ⚠️ 9. PROBLEMAS CONOCIDOS Y ESTADO

### Resueltos en esta sesión ✅

| Problema | Solución aplicada |
|----------|-------------------|
| Navbar sin funcionalidad de editar perfil | Implementados modales de editar perfil y cambiar contraseña con PerfilService |
| Modales cerraban al hacer clic en campos | Cambiado a `event.target === event.currentTarget` en overlay — no depende de stopPropagation |
| UI no se actualizaba sin Zone.js | `ChangeDetectorRef.detectChanges()` en todos los callbacks HTTP y setInterval |
| Login necesitaba clic para actualizar | Ya tenía NgZone + CDR correctamente implementado |
| OlvidecontraComponent sin CDR | Añadido detectChanges() en HTTP callbacks y setInterval del countdown |
| UbicacionComponent sin CDR | Añadido detectChanges() en 5 puntos asincrónicos |
| "Hola, {nombre}" no se actualizaba en inicio/inicia | `@Output() perfilActualizado` en navbar + handler en ambas páginas |
| primerNombre/inicial readonly (no actualizables) | Eliminado `readonly`, se actualizan al guardar perfil exitosamente |

### Pendientes ⚠️

| # | Problema | Impacto |
|---|----------|---------|
| 1 | Token JWT no se refresca tras editar perfil | El nombre en JWT difiere del nombre real si se editó |
| 2 | Sin validación de rol en rutas admin | Cualquier usuario autenticado accede a `/inicia` y `/dashboarda` |
| 3 | Sin validación de expiración de JWT en cliente | Token expirado sigue pasando authGuard |
| 4 | Notificaciones del navbar son mock data | Pendiente endpoint real |
| 5 | Reporte de problema solo hace console.log | Pendiente endpoint de envío |
| 6 | Sin refresh token | Sesión no se renueva automáticamente |
| 7 | Token en localStorage | Vulnerable a XSS |

---

## 🔧 10. PATRÓN CRÍTICO: CHANGE DETECTION SIN ZONE.JS

> **IMPORTANTE para todo desarrollador en este proyecto.**

### El problema

`zone.js` **no está importado** en este proyecto (ni en `main.ts` ni en `angular.json`). Sin Zone.js, Angular no detecta automáticamente cambios originados en operaciones asíncronas como:
- Callbacks de `HttpClient` (`.subscribe()`)
- `setInterval` / `setTimeout`
- Callbacks de `fetch()`
- Callbacks de `navigator.geolocation`
- Eventos de carga de scripts (`script.onload`)

El efecto visible: el estado cambia internamente pero la UI permanece congelada hasta que el usuario hace clic en algo (que dispara change detection via el event handler de Angular).

### La solución estándar en este proyecto

Inyectar `ChangeDetectorRef` y llamar `detectChanges()` al final de cada callback asíncrono:

```typescript
import { ChangeDetectorRef } from '@angular/core';

constructor(private cdr: ChangeDetectorRef) {}

// En cualquier callback HTTP, setInterval, fetch, etc.:
this.miServicio.llamada().subscribe({
  next: (data) => {
    this.miPropiedad = data;
    this.cdr.detectChanges(); // ← SIEMPRE al final
  },
  error: (err) => {
    this.errorMsg = '...';
    this.cdr.detectChanges(); // ← También en error
  }
});

setInterval(() => {
  this.contador--;
  this.cdr.detectChanges(); // ← En cada tick
}, 1000);
```

### Componentes que ya implementan el patrón ✅

| Componente | Callbacks cubiertos |
|------------|---------------------|
| `login.ts` | HTTP (3 callbacks) + setInterval countdown — también usa NgZone |
| `olvidecontra.ts` | HTTP (4 callbacks) + setInterval countdown |
| `navbar.ts` | HTTP (6 callbacks: cargarPerfil, guardarPerfil, guardarContrasena) |
| `ubicacion.ts` | GPS callback, ETA fetch, IA fetch, Leaflet onload, setInterval simulación |
| `user/inicio/inicio.ts` | Handler de @Output perfilActualizado |
| `admin/inicio/inicio.ts` | Handler de @Output perfilActualizado |

### Regla para nuevos componentes

**Todo componente que realice operaciones asíncronas (HTTP, timers, eventos nativos) debe inyectar `ChangeDetectorRef` y llamar `detectChanges()` en cada callback.**

---

## 📊 11. RESUMEN TÉCNICO

| Aspecto | Detalles |
|--------|----------|
| **Tipo de Aplicación** | SPA con Hash Location |
| **Versión Angular** | 21.2.0 (Standalone) |
| **Zone.js** | ❌ No importado — change detection manual |
| **Componentes** | 20+ standalone components |
| **Servicios** | AuthService, PerfilService |
| **Guards** | authGuard (verifica presencia de token) |
| **Interceptores** | authInterceptor (inyecta Bearer token, maneja 401) |
| **Styling** | Tailwind CSS v4 + CSS custom per componente |
| **Charts** | Chart.js + ng2-charts |
| **Mapa** | Leaflet 1.9.4 (cargado dinámicamente) |
| **Rutas OSRM** | router.project-osrm.org (driving + foot) |
| **ML/ETA** | FastAPI en localhost:8001 |
| **IA Asistente** | Claude API proxy en /api/claude |
| **Testing** | Vitest + JSDOM |
| **Backend API** | http://localhost:8080/api/v1 |
| **Autenticación** | JWT + 2FA OTP por correo |
| **Token Storage** | localStorage (auth_token) |

---

**Última actualización:** 04 Jun 2026  
**Versión:** 2.0
