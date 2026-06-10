import { Routes } from '@angular/router';
import { LoginComponent } from './Pages/login/login';
import { OlvidecontraComponent } from './Pages/olvidecontra/olvidecontra';
import { InicioComponent } from './Pages/user/inicio/inicio';
import { RegistroComponent } from './Pages/registro/registro';
import { VerBusesComponent } from './Pages/user/verbuses/verbuses';
import { UbicacionComponent } from './Pages/user/ubicacion/ubicacion';
import { RecargasComponent } from './Pages/user/recargas/recargas';
import { CanalAtencionComponent } from './Pages/user/canalatencion/canalatencion';
import { NoticiasComponent } from './Pages/user/noticias/noticias';
import { PreguntasFrecuentesComponent } from './Pages/user/preguntasfrecuentes/preguntasfrecuentes';
import { VerNoticiaComponent } from './Pages/user/noticias/ver-noticia/ver-noticia';
import { authGuard, adminGuard, userGuard  } from './guards/auth-guard';
import { ResetPasswordComponent } from './Pages/resetpassword/resetpassword';
import { RutasFavoritasComponent } from './Pages/user/rutas-favoritas/rutas-favoritas';
import { DashboardComponent } from './Pages/admin/dashboard/dashboard';
import { IniciAdminComponent } from './Pages/admin/inicio/inicio';
import { GestionarUsuariosComponent } from './Pages/admin/gestionar-usuarios/gestionar-usuarios';
import { GestionarLineasComponent } from './Pages/admin/gestionar-lineas/gestionar-lineas';
import { DashboardUsuarioComponent } from './Pages/user/dashboard/dashboard';


export const routes: Routes = [

   // ── Públicas ──────────────────────────────
  { path: '',               redirectTo: 'login', pathMatch: 'full' },
  { path: 'login',          component: LoginComponent },
  { path: 'registro',       component: RegistroComponent },
  { path: 'olvidecontra',   component: OlvidecontraComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // ── Rutas Usuario (rol 1) ─────────────────
  { path: 'inicio',                    component: InicioComponent,              canActivate: [authGuard, userGuard] },
  { path: 'dashboardu',                component: DashboardUsuarioComponent,    canActivate: [authGuard, userGuard] },
  { path: 'user/verbuses',             component: VerBusesComponent,            canActivate: [authGuard, userGuard] },
  { path: 'user/ubicacion',            component: UbicacionComponent,           canActivate: [authGuard, userGuard] },
  { path: 'user/recargas',             component: RecargasComponent,            canActivate: [authGuard, userGuard] },
  { path: 'user/canalatencion',        component: CanalAtencionComponent,       canActivate: [authGuard, userGuard] },
  { path: 'user/noticias',             component: NoticiasComponent,            canActivate: [authGuard, userGuard] },
  { path: 'user/faq',                  component: PreguntasFrecuentesComponent, canActivate: [authGuard, userGuard] },
  { path: 'user/noticias/ver-noticia', component: VerNoticiaComponent,          canActivate: [authGuard, userGuard] },
  { path: 'rutas-favoritas',           component: RutasFavoritasComponent,      canActivate: [authGuard, userGuard] },

  // ── Rutas Admin (rol 2 y 3) ───────────────
  { path: 'dashboarda',       component: DashboardComponent,         canActivate: [authGuard, adminGuard] },
  { path: 'inicia',           component: IniciAdminComponent,        canActivate: [authGuard, adminGuard] },
  { path: 'gestion-usuarios', component: GestionarUsuariosComponent, canActivate: [authGuard, adminGuard] },
  { path: 'gestion-lineas',   component: GestionarLineasComponent,   canActivate: [authGuard, adminGuard] },
];