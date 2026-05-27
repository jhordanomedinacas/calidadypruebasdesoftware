# 🚌 Corredor Azul - Frontend

**Aplicación de Transporte Público** con gestión de buses, rutas, recargas y atención al cliente.

- **Versión Angular:** 21.2.0 (Standalone Components)
- **Estilos:** Tailwind CSS
- **Testing:** Vitest
- **Librería reactiva:** RxJS 7.8

---

## 📋 Tabla de Contenidos

1. [Resumen del Proyecto](#resumen-del-proyecto)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Interfaces y Tipos](#interfaces-y-tipos)
4. [Flujos Principales](#flujos-principales)
5. [Servicios](#servicios)
6. [Rutas y Guardias](#rutas-y-guardias)
7. [Componentes](#componentes)
8. [Instalación y Desarrollo](#instalación-y-desarrollo)
9. [Problemas Identificados](#problemas-identificados)

---

## 🎯 Resumen del Proyecto

### ¿Qué es?

Plataforma web para usuarios y administradores del sistema de transporte "Corredor Azul". Permite:

**Para usuarios:**
- ✅ Autenticación con 2FA por correo (OTP)
- ✅ Ver buses disponibles y ubicaciones en tiempo real
- ✅ Consultar rutas y paradas
- ✅ Recargar tarjeta de transporte
- ✅ Acceso a noticias y preguntas frecuentes
- ✅ Crear solicitudes de soporte
- ✅ Guardar rutas favoritas

**Para administradores:**
- ✅ Dashboard con KPIs (usuarios activos, buses, recargas)
- ✅ Monitoreo de eventos e impactos
- ✅ Visualización de líneas y viajes

### Características Técnicas

- ✅ **Standalone Components**: Arquitectura moderna sin NgModules
- ✅ **Reactive Forms**: Formularios validados con reactividad
- ✅ **Routing con Hash**: URLs con `#` para compatibilidad
- ✅ **Inyección de Dependencias**: Servicios providedIn: 'root'
- ✅ **localStorage**: Gestión de tokens y sesión
- ✅ **Animaciones CSS**: Transiciones personalizadas
- ✅ **API REST**: Comunicación con backend en `http://localhost:8080/api/v1`

---

## 🗂️ Estructura de Archivos

```
src/app/
├── app.ts                    # Componente raíz (standalone)
├── app.config.ts             # Providers y configuración
├── app.routes.ts             # Definición de rutas
│
├── services/
│   └── auth.ts              # 🔐 Servicio único de autenticación
│
├── guards/
│   └── auth-guard.ts        # Protección de rutas privadas
│
├── components/              # Componentes reutilizables
│   ├── navbar/              # Barra de navegación
│   └── headbot/             # Chat bot (Web Component)
│
├── Pages/                   # Páginas principales
│   ├── login/               # 🔓 Inicio de sesión
│   ├── registro/            # 📝 Nuevo usuario
│   ├── olvidecontra/        # Recuperación de contraseña
│   ├── resetpassword/       # Resetear contraseña
│   ├── inicio/              # Página principal usuario
│   │
│   ├── user/                # 👤 Sección de usuario autenticado
│   │   ├── verbuses/        # Ver buses disponibles
│   │   ├── ubicacion/       # Ubicación en tiempo real
│   │   ├── recargas/        # Recargar tarjeta
│   │   ├── canalatencion/   # Contacto y soporte
│   │   ├── noticias/        # Noticias del sistema
│   │   │   ├── todas/       # Todas las noticias
│   │   │   └── ver-noticia/ # Detalle de noticia
│   │   ├── preguntasfrecuentes/  # FAQ
│   │   ├── rutas-favoritas/      # Rutas guardadas
│   │   ├── soporte/              # Atención técnica
│   │   └── verestaciones/        # Ver estaciones
│   │
│   └── admin/               # 👨‍💼 Sección administrador
│       ├── dashboard/       # Panel de control
│       └── inicio/          # Página inicio admin
│
└── assets/
    └── liveline-wc/        # Web Component para mapas
```

---

## 📋 Interfaces y Tipos

### Autenticación (auth.ts)

```typescript
// Solicitudes
interface LoginRequest {
  correo: string;
  contrasena: string;
}

interface VerificarRequest {
  correo: string;
  codigo: string;           // OTP de 6 dígitos
}

interface RegistroRequest {
  nombre: string;
  apellido1: string;
  apellido2?: string;
  tipoDocumento: string;
  numDocumento: string;
  telefono: string;
  correo: string;
  contrasena: string;
}

interface ResetPasswordRequest {
  token: string;
  nuevaContrasena: string;
}

// Respuestas
interface MensajeResponse {
  mensaje: string;
}

interface TokenResponse {
  token: string;
  mensaje: string;
}
```

### Dashboard (dashboard.ts)

```typescript
interface KpiDashboard {
  usuariosActivos: number;
  busesEnFlota: number;
  recargasHoy: number;
  montoRecargasHoy: number;
  reportesEnviados: number;
  reportesPendientes: number;
}

interface UsuarioReciente {
  iniciales: string;
  avatarClass: string;
  nombre: string;
  ruta: string;
  hace: string;
  rol: string;
  rolClass: string;
}

interface EtaItem {
  linea: string;
  color: string;
  tiempo: number;
  barPct: number;
  tiempoColor: string;
  tiempoBg: string;
  paradero: string;
}

interface EventoImpacto {
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

---

## 🔄 Flujos Principales

### 1️⃣ Flujo de Autenticación (2FA con OTP)

```
┌─────────────────────────────────────────────────────┐
│                  FLUJO DE AUTENTICACIÓN             │
└─────────────────────────────────────────────────────┘

1. Usuario en /login
   ↓
2. Ingresa correo + contraseña
   ↓
3. POST /auth/login
   ├─ ✅ OK → Mostrar pantalla de verificación
   └─ ❌ Error → Mensaje de error
   ↓
4. Usuario recibe OTP en correo
   ↓
5. Ingresa código (6 dígitos)
   ↓
6. POST /auth/verificar { correo, codigo }
   ├─ ✅ OK → Token generado en respuesta
   │        → localStorage.setItem('token', response.token)
   │        → Redirigir a /inicio
   └─ ❌ Error → Mostrar error, opción de reenviar
   ↓
7. Usuario autenticado
   - Acceso a rutas privadas
   - Token en headers de requests
```

### 2️⃣ Flujo de Acceso a Rutas Privadas

```
┌─────────────────────────────────────────────────────┐
│          PROTECCIÓN DE RUTAS - authGuard             │
└─────────────────────────────────────────────────────┘

Usuario accede a /user/verbuses
   ↓
authGuard valida
   ↓
¿Token en localStorage?
├─ ✅ SÍ → auth.estaAutenticado() return true
│        → Acceso permitido
│        → Cargar componente
│
└─ ❌ NO → auth.estaAutenticado() return false
         → Redirigir a /login
         → Acceso denegado
```

### 3️⃣ Flujo de Recuperación de Contraseña

```
┌──────────────────────────────────────────────┐
│    RECUPERACIÓN DE CONTRASEÑA               │
└──────────────────────────────────────────────┘

/olvidecontra
   ↓
Usuario ingresa correo
   ↓
POST /auth/recuperar { correo }
   ├─ ✅ OK → Mostrar: "Revisa tu correo"
   └─ ❌ Error → Correo no registrado
   ↓
Usuario recibe link en correo (con token)
   ↓
Accede a /reset-password?token=xxx
   ↓
POST /auth/reset-password { token, nuevaContrasena }
   ├─ ✅ OK → Redirigir a /login
   └─ ❌ Error → Token expirado o inválido
```

---

## 🔧 Servicios

### AuthService (`src/app/services/auth.ts`)

**Responsabilidad:** Manejo completo de autenticación y autorización.

**Métodos principales:**

| Método | Parámetros | Retorna | Descripción |
|--------|-----------|---------|-------------|
| `login()` | `LoginRequest` | `Observable<MensajeResponse>` | Inicia sesión (envía OTP) |
| `verificar()` | `VerificarRequest` | `Observable<TokenResponse>` | Verifica código OTP y retorna token |
| `reenviar()` | `correo: string` | `Observable<MensajeResponse>` | Reenvía código OTP |
| `registro()` | `RegistroRequest` | `Observable<any>` | Crea nuevo usuario |
| `recuperar()` | `correo: string` | `Observable<MensajeResponse>` | Inicia recuperación de contraseña |
| `validarToken()` | `token: string` | `Observable<MensajeResponse>` | Valida token (no se usa) |
| `resetPassword()` | `ResetPasswordRequest` | `Observable<MensajeResponse>` | Resetea contraseña |
| `estaAutenticado()` | - | `boolean` | ¿Usuario tiene token? |

**API Base:** `http://localhost:8080/api/v1`

---

## 🛣️ Rutas y Guardias

### Rutas Públicas (sin autenticación)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | - | Redirecciona a `/login` |
| `/login` | LoginComponent | Inicio de sesión |
| `/registro` | RegistroComponent | Crear cuenta nueva |
| `/olvidecontra` | OlvidecontraComponent | Recuperar contraseña |
| `/reset-password` | ResetPasswordComponent | Resetear contraseña |

### Rutas Privadas (requieren `authGuard`)

#### 👤 Sección Usuario

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/inicio` | InicioComponent | Página de bienvenida |
| `/user/verbuses` | VerBusesComponent | Buses disponibles |
| `/user/ubicacion` | UbicacionComponent | Ubicación en tiempo real |
| `/user/recargas` | RecargasComponent | Recargar tarjeta |
| `/user/canalatencion` | CanalAtencionComponent | Contacto y soporte |
| `/user/noticias` | NoticiasComponent | Noticias sistema |
| `/noticias/todas` | TodasComponent | Todas noticias |
| `/user/noticias/ver-noticia` | VerNoticiaComponent | Detalle noticia |
| `/user/faq` | PreguntasFrecuentesComponent | Preguntas frecuentes |
| `/rutas-favoritas` | RutasFavoritasComponent | Rutas guardadas |

#### 👨‍💼 Sección Admin

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/dashboarda` | DashboardComponent | Panel de control admin |
| `/inicia` | IniciAdminComponent | Inicio administrador |

**Nota:** No hay validación de roles. Cualquier usuario autenticado puede acceder a rutas admin.

---

## 🧩 Componentes

### Componentes Públicos

- **LoginComponent** - Formulario de login con email + contraseña
- **RegistroComponent** - Formulario de registro con validación
- **OlvidecontraComponent** - Recuperar contraseña por email
- **ResetPasswordComponent** - Cambiar contraseña con token

### Componentes Reutilizables

- **NavbarComponent** - Navegación con notificaciones
- **HeadBotComponent** - Chat bot asistente

### Componentes Usuario

- **InicioComponent** - Dashboard usuario
- **VerBusesComponent** - Búsqueda y visualización de buses
- **UbicacionComponent** - Mapa con ubicación GPS
- **RecargasComponent** - Gestión de recargas
- **CanalAtencionComponent** - Formulario de contacto
- **NoticiasComponent** - Listado de noticias
- **TodasComponent** - Todas las noticias con filtros
- **VerNoticiaComponent** - Detalle completo de noticia
- **PreguntasFrecuentesComponent** - FAQ
- **RutasFavoritasComponent** - Rutas guardadas del usuario
- **SoporteComponent** - Tickets de soporte
- **VerEstacionesComponent** - Mapa de estaciones

### Componentes Admin

- **DashboardComponent** - KPIs, gráficos, usuarios recientes, eventos
- **IniciAdminComponent** - Página inicio admin

---

## 🚀 Instalación y Desarrollo

### Requisitos

- Node.js 18+
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>

# Navegar a carpeta frontend
cd "d:\Octavo ciclo\Solucionesweb\ProyectoCorredorAzul\Frontend"

# Instalar dependencias
npm install
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run start
# o
ng serve
```

Acceder a: `http://localhost:4200/`

La aplicación se recarga automáticamente al modificar archivos.

### Compilación

```bash
# Build para producción
npm run build
# o
ng build --configuration production
```

Artifacts en: `dist/`

### Testing

```bash
# Ejecutar tests con Vitest
npm run test
# o
ng test
```

### Generar Componentes

```bash
ng generate component Pages/mi-pagina
ng generate service services/mi-servicio
ng generate guard guards/mi-guard
```

---

## ⚠️ Problemas Identificados

### 🔴 Críticos

1. **Sin validación de token en backend**
   - El cliente solo valida localStorage
   - Backend podría no verificar token en requests
   - Impacto: Inseguridad grave

2. **Sin validación de roles**
   - Guard solo verifica existencia de token
   - Cualquier usuario autenticado accede a admin
   - Impacto: Acceso no autorizado

3. **Token sin expiración**
   - Token guardado indefinidamente en localStorage
   - Sin tiempo de sesión
   - Impacto: Sesión perpetua, riesgo si dispositivo es robado

4. **Sin HTTP Interceptor**
   - Cada request debe incluir token manualmente
   - No centralizado
   - Impacto: Tedioso y error-prone

5. **Un único servicio (auth.ts)**
   - Sin servicio para datos de usuario, buses, rutas, etc.
   - Impacto: Falta arquitectura escalable

### 🟡 Importantes

6. **localStorage para tokens**
   - Vulnerable a XSS
   - Mejor: HttpOnly cookies

7. **Sin manejo de errores centralizado**
   - Cada componente maneja errores por su cuenta
   - Impacto: Inconsistencia en UX

8. **Sin caché de datos**
   - Cada navegación recarga datos
   - Impacto: Performance lenta

9. **Sin lazy loading en rutas**
   - Todos componentes cargados en bundle
   - Impacto: Aplicación pesada al inicio

10. **Sin logging o analytics**
    - Sin rastreo de errores en producción
    - Impacto: Difícil debuggear en vivo

---

## 📦 Dependencias

```json
{
  "dependencies": {
    "@angular/animations": "^21.2.0",
    "@angular/common": "^21.2.0",
    "@angular/compiler": "^21.2.0",
    "@angular/core": "^21.2.0",
    "@angular/forms": "^21.2.0",
    "@angular/platform-browser": "^21.2.0",
    "@angular/platform-browser-dynamic": "^21.2.0",
    "@angular/router": "^21.2.0",
    "rxjs": "^7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.15.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^21.2.5",
    "@angular/cli": "^21.2.5",
    "@angular/compiler-cli": "^21.2.0",
    "tailwindcss": "^3.x",
    "typescript": "~5.6.0",
    "vitest": "^latest"
  }
}
```

---

## 📝 Notas

- **Env:** Cambiar `API` en `auth.ts` según ambiente (dev/prod)
- **CORS:** Backend debe permitir requests desde `localhost:4200`
- **Proxy:** `proxy.conf.json` para desarrollo

---

## 🔗 Enlaces Útiles

- [Angular 21 Docs](https://angular.dev)
- [RxJS Docs](https://rxjs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Vitest](https://vitest.dev)

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
