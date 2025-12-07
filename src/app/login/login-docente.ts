import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-docente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-docente.html',
  styleUrls: ['./login-docente.css']
})
export class LoginDocenteComponent implements OnInit, OnDestroy {
  correo = '';
  contrasena = '';
  nombre = '';
  mensaje = '';
  tipoMensaje: 'success' | 'error' | 'info' = 'info';
  mostrarRegistro = false;
  cargando = false;
  private focusTimeout: any;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Establecer foco inicial en el primer campo
    setTimeout(() => {
      this.setFocusOnFirstField();
    }, 100);
  }

  ngOnDestroy() {
    if (this.focusTimeout) {
      clearTimeout(this.focusTimeout);
    }
  }

  private setFocusOnFirstField() {
    if (!this.mostrarRegistro) {
      const firstInput = document.getElementById('correo-login');
      if (firstInput) {
        firstInput.focus();
      }
    } else {
      const firstInput = document.getElementById('nombre-registro');
      if (firstInput) {
        firstInput.focus();
      }
    }
  }

  private anunciarLectoresPantalla(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info') {
    // Actualizar región viva para lectores de pantalla
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      liveRegion.textContent = mensaje;
      
      // Limpiar después de un tiempo para anuncios futuros
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 3000);
    }
    
    // También establecemos el mensaje visual
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;
  }

  // LOGIN
  async login() {
    this.mensaje = '';
    this.cargando = true;
    
    // ✅ Validar correo educativo
    if (!this.correo.endsWith('.edu')) {
      this.anunciarLectoresPantalla('Debes usar un correo educativo válido que termine en .edu', 'error');
      this.cargando = false;
      return;
    }

    // Validar que no estén vacíos
    if (!this.correo || !this.contrasena) {
      this.anunciarLectoresPantalla('Por favor completa todos los campos requeridos', 'error');
      this.cargando = false;
      return;
    }

    try {
      const ok = await this.authService.loginDocente(this.correo, this.contrasena);

      if (ok) {
        this.anunciarLectoresPantalla('Inicio de sesión exitoso. Redirigiendo al formulario de reservación.', 'success');
        this.focusTimeout = setTimeout(() => {
          this.router.navigate(['/formulario-reservacion-docente']);
        }, 1500);
      } else {
        this.anunciarLectoresPantalla('Usuario no registrado. Por favor regístrate primero.', 'error');
        this.mostrarRegistro = true;
        
        // Enfocar el primer campo del formulario de registro
        this.focusTimeout = setTimeout(() => {
          const nombreInput = document.getElementById('nombre-registro');
          if (nombreInput) {
            nombreInput.focus();
          }
        }, 100);
      }
    } catch (error: any) {
      this.anunciarLectoresPantalla('Error al iniciar sesión: ' + error.message, 'error');
    } finally {
      this.cargando = false;
    }
  }

  // REGISTRO
  async registrar() {
    this.mensaje = '';
    this.cargando = true;

    // ✅ Validar correo educativo
    if (!this.correo.endsWith('.edu')) {
      this.anunciarLectoresPantalla('Solo se permiten correos educativos que terminen en .edu', 'error');
      this.cargando = false;
      return;
    }

    // Validaciones de campos
    if (!this.nombre || !this.correo || !this.contrasena) {
      this.anunciarLectoresPantalla('Por favor completa todos los campos requeridos', 'error');
      this.cargando = false;
      return;
    }

    if (this.contrasena.length < 6) {
      this.anunciarLectoresPantalla('La contraseña debe tener al menos 6 caracteres', 'error');
      this.cargando = false;
      return;
    }

    try {
      await this.authService.registrarDocente(this.nombre, this.correo, this.contrasena);
      this.anunciarLectoresPantalla('Registro exitoso. Ahora puedes iniciar sesión con tus credenciales.', 'success');
      this.mostrarRegistro = false;
      this.nombre = '';
      this.correo = '';
      this.contrasena = '';
      
      // Enfocar el primer campo del formulario de login
      this.focusTimeout = setTimeout(() => {
        const correoInput = document.getElementById('correo-login');
        if (correoInput) {
          correoInput.focus();
        }
      }, 100);
    } catch (error: any) {
      this.anunciarLectoresPantalla('Error al registrarse: ' + error.message, 'error');
    } finally {
      this.cargando = false;
    }
  }

  // Muestra el formulario de registro desde el enlace
  mostrarFormularioRegistro(event: Event) {
    event.preventDefault();
    this.mostrarRegistro = true;
    this.mensaje = '';
    
    // Enfocar el primer campo del formulario de registro
    this.focusTimeout = setTimeout(() => {
      const nombreInput = document.getElementById('nombre-registro');
      if (nombreInput) {
        nombreInput.focus();
      }
    }, 100);
  }
}