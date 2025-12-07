import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pagina-bienvenida',
  standalone: true,
  templateUrl: './pagina-bienvenida.html',
  styleUrls: ['./pagina-bienvenida.css']
})
export class PaginaBienvenidaComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    // Enfocar el título principal al cargar para navegación por teclado
    setTimeout(() => {
      const titulo = document.getElementById('titulo-bienvenida');
      if (titulo) {
        titulo.setAttribute('tabindex', '-1');
        titulo.focus();
      }
    }, 100);
  }

  irAEstudiante() { 
    this.announceForScreenReader('Redirigiendo al formulario de estudiante...');
    this.router.navigate(['/login-estudiante']); 
  }

  irADocente() { 
    this.announceForScreenReader('Redirigiendo al formulario de docente...');
    this.router.navigate(['/login-docente']); 
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

  // Manejo de teclado para navegación adicional
  onKeydown(event: KeyboardEvent, action: 'estudiante' | 'docente') {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (action === 'estudiante') {
        this.irAEstudiante();
      } else {
        this.irADocente();
      }
    }
    
    // Navegación con flechas entre botones
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const buttons = document.querySelectorAll('.btn');
      const currentIndex = Array.from(buttons).findIndex(btn => 
        btn === event.target
      );
      
      let nextIndex = event.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0) nextIndex = buttons.length - 1;
      if (nextIndex >= buttons.length) nextIndex = 0;
      
      const nextButton = buttons[nextIndex] as HTMLButtonElement;
      if (nextButton) {
        nextButton.focus();
      }
    }
  }
}