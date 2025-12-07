import { Routes } from '@angular/router';
import { PaginaBienvenidaComponent } from './components/pagina-bienvenida/pagina-bienvenida';
import { LoginEstudianteComponent } from './login/login-estudiante';
import { RegistroEstudianteComponent } from './components/registro/registro-estudiante';
import { FormularioReservacionEstudianteComponent } from './components/formulario-reservacion-estudiante/formulario-reservacion-estudiante';
import { FormularioReservacionDocente } from './components/formulario-reservacion-docente/formulario-reservacion-docente';
import { RegistroDocenteComponent } from './components/registro/registro-docente';
import { LoginDocenteComponent } from './login/login-docente';
import { QrreservaComponent } from './components/qrreserva/qrreserva';

export const routes: Routes = [
  { path: '', component: PaginaBienvenidaComponent },  // AHORA ES LA PÁGINA PRINCIPAL
  { path: 'login-estudiante', component: LoginEstudianteComponent },
  { path: 'login-docente', component: LoginDocenteComponent },
  { path: 'registro-estudiante', component: RegistroEstudianteComponent },
  { path: 'registro-docente', component: RegistroDocenteComponent },
  { path: 'formulario-reservacion-estudiante', component: FormularioReservacionEstudianteComponent },
  { path: 'formulario-reservacion-docente', component: FormularioReservacionDocente },
  { path: 'qrreserva', component: QrreservaComponent },
  { path: '**', redirectTo: '' }
];
