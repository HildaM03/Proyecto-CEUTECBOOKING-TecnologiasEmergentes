import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-estudiante',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-estudiante.html',
  styleUrls: ['./login-estudiante.css']
})
export class LoginEstudianteComponent implements OnInit, OnDestroy, AfterViewInit {
  correo = '';
  contrasena = '';
  nombre = '';
  mensaje = '';
  tipoMensaje: 'success' | 'error' | 'warning' = 'warning';
  mostrarRegistro = false;
  cargando = false;
  
  private focusTimeout: any;
  private mensajeTimeout: any;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Intentar restaurar datos del formulario si existen
    this.restaurarDatosFormulario();
  }

  ngAfterViewInit() {
    // Establecer foco inicial después de que la vista se renderice
    this.setFocusOnFirstField();
  }

  ngOnDestroy() {
    // Limpiar timeouts
    if (this.focusTimeout) clearTimeout(this.focusTimeout);
    if (this.mensajeTimeout) clearTimeout(this.mensajeTimeout);
  }

  private setFocusOnFirstField() {
    this.focusTimeout = setTimeout(() => {
      if (!this.mostrarRegistro) {
        const correoInput = document.getElementById('correo-login');
        if (correoInput) {
          (correoInput as HTMLInputElement).focus();
        }
      } else {
        const nombreInput = document.getElementById('nombre-registro');
        if (nombreInput) {
          (nombreInput as HTMLInputElement).focus();
        }
      }
    }, 100);
  }

  private anunciarLectoresPantalla(mensaje: string, tipo: 'success' | 'error' | 'warning' = 'warning') {
    // Actualizar región viva para lectores de pantalla
    const liveRegion = document.getElementById('announce-region');
    if (liveRegion) {
      liveRegion.textContent = mensaje;
      
      // Limpiar después de un tiempo para anuncios futuros
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 3000);
    }
    
    // Establecer mensaje visual
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;
    
    // Auto-ocultar mensajes después de 5 segundos (excepto errores críticos)
    if (this.mensajeTimeout) clearTimeout(this.mensajeTimeout);
    
    if (tipo !== 'error' || mensaje.includes('exit')) {
      this.mensajeTimeout = setTimeout(() => {
        this.mensaje = '';
      }, 5000);
    }
  }

  private guardarDatosFormulario() {
    // Guardar datos temporalmente en sessionStorage
    const formData = {
      correo: this.correo,
      mostrarRegistro: this.mostrarRegistro
    };
    sessionStorage.setItem('loginEstudianteTemp', JSON.stringify(formData));
  }

  private restaurarDatosFormulario() {
    // Restaurar datos temporalmente guardados
    const savedData = sessionStorage.getItem('loginEstudianteTemp');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        this.correo = data.correo || '';
        this.mostrarRegistro = data.mostrarRegistro || false;
        sessionStorage.removeItem('loginEstudianteTemp');
      } catch (e) {
        console.warn('No se pudieron restaurar los datos del formulario');
      }
    }
  }

  // LOGIN
  async login() {
    this.mensaje = '';
    this.cargando = true;
    
    // Guardar datos del formulario
    this.guardarDatosFormulario();

    // ✅ Validar correo educativo
    if (!this.correo.endsWith('.edu')) {
      this.anunciarLectoresPantalla('Debes usar un correo educativo válido que termine en .edu', 'error');
      this.cargando = false;
      
      // Enfocar el campo de correo
      const correoInput = document.getElementById('correo-login');
      if (correoInput) {
        (correoInput as HTMLInputElement).focus();
        (correoInput as HTMLInputElement).select();
      }
      return;
    }

    // Validar que no estén vacíos
    if (!this.correo || !this.contrasena) {
      this.anunciarLectoresPantalla('Por favor completa todos los campos requeridos', 'error');
      this.cargando = false;
      return;
    }

    try {
      const ok = await this.authService.loginEstudiante(this.correo, this.contrasena);

      if (ok) {
        this.anunciarLectoresPantalla('Inicio de sesión exitoso. Redirigiendo al formulario de reservación.', 'success');
        this.focusTimeout = setTimeout(() => {
          this.router.navigate(['/formulario-reservacion-estudiante']);
        }, 1500);
      } else {
        this.anunciarLectoresPantalla('Usuario no registrado. Por favor regístrate primero.', 'error');
        this.mostrarRegistro = true;
        
        // Enfocar el primer campo del formulario de registro
        this.focusTimeout = setTimeout(() => {
          const nombreInput = document.getElementById('nombre-registro');
          if (nombreInput) {
            (nombreInput as HTMLInputElement).focus();
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
      
      // Enfocar el campo de correo
      const correoInput = document.getElementById('correo-registro');
      if (correoInput) {
        (correoInput as HTMLInputElement).focus();
        (correoInput as HTMLInputElement).select();
      }
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
      
      // Enfocar el campo de contraseña
      const passInput = document.getElementById('contrasena-registro');
      if (passInput) {
        (passInput as HTMLInputElement).focus();
        (passInput as HTMLInputElement).select();
      }
      return;
    }

    try {
      await this.authService.registrarEstudiante(this.nombre, this.correo, this.contrasena);
      this.anunciarLectoresPantalla('Registro exitoso. Ahora puedes iniciar sesión con tus credenciales.', 'success');
      this.mostrarRegistro = false;
      this.nombre = '';
      this.contrasena = '';
      
      // Enfocar el primer campo del formulario de login
      this.focusTimeout = setTimeout(() => {
        const correoInput = document.getElementById('correo-login');
        if (correoInput) {
          (correoInput as HTMLInputElement).focus();
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
    event.stopPropagation();
    
    this.mostrarRegistro = true;
    this.mensaje = '';
    this.guardarDatosFormulario();
    
    // Enfocar el primer campo del formulario de registro
    this.focusTimeout = setTimeout(() => {
      const nombreInput = document.getElementById('nombre-registro');
      if (nombreInput) {
        (nombreInput as HTMLInputElement).focus();
      }
    }, 100);
  }
}