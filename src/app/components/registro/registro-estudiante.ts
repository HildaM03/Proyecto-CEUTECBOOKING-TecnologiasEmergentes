import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-registro-estudiante',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-estudiante.html',
  styleUrls: ['./registro-estudiante.css']
})
export class RegistroEstudianteComponent implements OnInit {
  nombre = '';
  correo = '';
  contrasena = '';
  mensaje = '';
  registrando = false;
  mostrarErrorValidacion = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Enfocar el campo de nombre al cargar para navegación por teclado
    setTimeout(() => {
      const nombreInput = document.getElementById('nombre-estudiante');
      if (nombreInput) {
        nombreInput.focus();
      }
    }, 100);
  }

  async registrar() {
    // Validación básica
    if (!this.validarFormulario()) {
      this.mostrarErrorValidacion = true;
      this.announceForScreenReader('Error: Complete todos los campos correctamente.');
      
      // Enfocar el primer campo con error
      setTimeout(() => {
        if (!this.nombre.trim()) {
          document.getElementById('nombre-estudiante')?.focus();
        } else if (!this.correo.trim() || !this.validarCorreo()) {
          document.getElementById('correo-estudiante')?.focus();
        } else if (!this.contrasena.trim() || this.contrasena.length < 8) {
          document.getElementById('contrasena-estudiante')?.focus();
        }
      }, 100);
      
      return;
    }
    
    this.mostrarErrorValidacion = false;
    this.registrando = true;
    this.mensaje = '';
    
    this.announceForScreenReader('Procesando registro, por favor espere...');
    
    try {
      await this.authService.registrarEstudiante(this.nombre, this.correo, this.contrasena);
      
      this.mensaje = '✅ Registro exitoso. Ahora inicia sesión.';
      this.announceForScreenReader('¡Registro exitoso! Redirigiendo a inicio de sesión...');
      
      setTimeout(() => {
        this.router.navigate(['/login-estudiante']);
      }, 2000);
      
    } catch (error: any) {
      this.mensaje = '❌ Error: ' + error.message;
      this.registrando = false;
      
      // Anunciar error específico
      const mensajeError = error.message.includes('correo') ? 
        'Error: El correo ya está registrado o no es válido.' :
        'Error en el registro. Intente nuevamente.';
      
      this.announceForScreenReader(mensajeError);
      
      // Enfocar el campo de correo si hay error de correo
      if (error.message.includes('correo')) {
        setTimeout(() => {
          document.getElementById('correo-estudiante')?.focus();
        }, 100);
      }
    }
  }

  // Validación del formulario
  private validarFormulario(): boolean {
    if (!this.nombre.trim()) return false;
    
    if (!this.correo.trim() || !this.validarCorreo()) return false;
    
    if (!this.contrasena.trim() || this.contrasena.length < 8) return false;
    
    return true;
  }

  // Validación de correo institucional (.edu)
  private validarCorreo(): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.edu(\.[a-z]{2,})?$/i;
    return regex.test(this.correo);
  }

  // Manejo de teclado en el formulario
  onKeydown(event: KeyboardEvent, campo: string) {
    // Enter en campos de texto navega al siguiente campo
    if (event.key === 'Enter' && campo !== 'submit') {
      event.preventDefault();
      
      // Navegar al siguiente campo con Enter
      const campos = ['nombre', 'correo', 'contrasena'];
      const currentIndex = campos.indexOf(campo);
      
      if (currentIndex < campos.length - 1) {
        const nextCampo = document.getElementById(`${campos[currentIndex + 1]}-estudiante`);
        if (nextCampo) {
          nextCampo.focus();
        }
      }
    }
    
    // Navegación con flechas entre campos
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const camposIds = ['nombre-estudiante', 'correo-estudiante', 'contrasena-estudiante', 'boton-registro'];
      const currentIndex = camposIds.findIndex(id => 
        document.activeElement?.id === id
      );
      
      let nextIndex = event.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0) nextIndex = camposIds.length - 1;
      if (nextIndex >= camposIds.length) nextIndex = 0;
      
      const nextElement = document.getElementById(camposIds[nextIndex]);
      if (nextElement) {
        nextElement.focus();
      }
    }
  }

  // Método para anunciar cambios a lectores de pantalla
  private announceForScreenReader(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }

  // Método para limpiar mensajes de error al escribir
  onInputChange(campo: string) {
    this.mostrarErrorValidacion = false;
    
    // Anunciar cambios para lectores de pantalla (opcional)
    if (campo === 'contrasena' && this.contrasena.length > 0) {
      const caracteresRestantes = Math.max(0, 8 - this.contrasena.length);
      if (caracteresRestantes > 0) {
        this.announceForScreenReader(`${caracteresRestantes} caracteres restantes para cumplir el mínimo.`);
      } else {
        this.announceForScreenReader('Contraseña cumple con el mínimo de caracteres.');
      }
    }
  }
}