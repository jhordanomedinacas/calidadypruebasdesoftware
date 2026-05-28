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
import { TodasComponent } from './Pages/user/noticias/todas/todas';
import { VerNoticiaComponent } from './Pages/user/noticias/ver-noticia/ver-noticia';
import { authGuard } from './guards/auth-guard';
import { ResetPasswordComponent } from './Pages/resetpassword/resetpassword';
import { RutasFavoritasComponent } from './Pages/user/rutas-favoritas/rutas-favoritas';
import { DashboardComponent } from './Pages/admin/dashboard/dashboard';
import { IniciAdminComponent } from './Pages/admin/inicio/inicio';
import { GestionarUsuariosComponent } from './Pages/admin/gestionar-usuarios/gestionar-usuarios';


export const routes: Routes = [

  // ── Públicas ──────────────────────────────
  { path: '',            redirectTo: 'login', pathMatch: 'full' },
  { path: 'login',       component: LoginComponent },
  { path: 'registro',    component: RegistroComponent },
  { path: 'olvidecontra', component: OlvidecontraComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // ── Vista user Privadas (requieren estar autenticado) ─
  { path: 'inicio',               component: InicioComponent,               canActivate: [authGuard] },
  { path: 'user/verbuses',        component: VerBusesComponent,             canActivate: [authGuard] },
  { path: 'user/ubicacion',       component: UbicacionComponent,            canActivate: [authGuard] },
  { path: 'user/recargas',        component: RecargasComponent,             canActivate: [authGuard] },
  { path: 'user/canalatencion',   component: CanalAtencionComponent,        canActivate: [authGuard] },
  { path: 'user/noticias',        component: NoticiasComponent,             canActivate: [authGuard] },
  { path: 'user/faq',             component: PreguntasFrecuentesComponent,  canActivate: [authGuard] },
  { path: 'noticias/todas',       component: TodasComponent,                canActivate: [authGuard] },
  { path: 'user/noticias/ver-noticia', component: VerNoticiaComponent,      canActivate: [authGuard] },
  { path: 'rutas-favoritas', component: RutasFavoritasComponent,      canActivate: [authGuard] },
  
  //Vista Admin Privadas (requieren estar autenticado) ─
  { path: 'dashboarda', component: DashboardComponent,      canActivate: [authGuard] },
  { path: 'inicia', component: IniciAdminComponent,      canActivate: [authGuard] },
  { path: 'gestion-usuarios', component: GestionarUsuariosComponent,      canActivate: [authGuard] }
];