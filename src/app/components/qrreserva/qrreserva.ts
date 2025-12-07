import { Component, OnInit, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

interface Reservacion {
  nombre: string;
  numeroCuenta: string;
  correo: string;
  otrosEstudiantes: string[];
  campus: string;
  sede: string;
  tipoAula: string;
  numeroaula: string;
  fecha: string;
  hora: string;
}

@Component({
  selector: 'app-qrreserva',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qrreserva.html',
  styleUrls: ['./qrreserva.css']
})
export class QrreservaComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  
  reservacion: Reservacion | null = null;
  cargando = true;
  error = false;
  reservacionValida = false;
  idReservacion: string = '';

  // Fechas de emisión
  fechaEmision = new Date().toLocaleDateString('es-HN');
  horaEmision = new Date().toLocaleTimeString('es-HN');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.idReservacion = params['id'];
      
      if (this.idReservacion) {
        this.announceForScreenReader('Código QR recibido. Verificando reservación...');
        this.verificarReservacion(this.idReservacion);
      } else {
        this.error = true;
        this.cargando = false;
        this.announceForScreenReader('Error: No se recibió código de reservación');
      }
    });
  }

  ngAfterViewInit() {
    // Enfocar el título principal al cargar para navegación por teclado
    setTimeout(() => {
      const titulo = document.getElementById('titulo-principal');
      if (titulo) {
        titulo.setAttribute('tabindex', '-1');
        titulo.focus();
      }
    }, 100);
  }

  async verificarReservacion(id: string) {
    try {
      const docRef = doc(this.firestore, 'reservas', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        this.reservacion = docSnap.data() as Reservacion;
        this.reservacionValida = true;
        this.announceForScreenReader('¡Reservación verificada exitosamente! Detalles cargados.');
        
        // Anunciar detalles importantes
        setTimeout(() => {
          this.announceForScreenReader(
            `Reservación a nombre de ${this.reservacion?.nombre}, ` +
            `aula ${this.reservacion?.numeroaula}, ` +
            `fecha ${this.reservacion?.fecha}, ` +
            `hora ${this.reservacion?.hora}. ` +
            `Presentar este comprobante si es requerido.`
          );
        }, 500);
      } else {
        this.reservacionValida = false;
        this.announceForScreenReader('Reservación no encontrada. Verifique el código QR escaneado.');
      }
    } catch (error) {
      console.error('Error verificando reservación:', error);
      this.error = true;
      this.announceForScreenReader('Error al verificar la reservación. Intente nuevamente.');
    } finally {
      this.cargando = false;
    }
  }

  // Manejar error de imagen
  onImageError(event: any) {
    console.log('Error cargando imagen');
    event.target.style.display = 'none';
    this.announceForScreenReader('Logo no disponible, continuando con la verificación.');
  }

  volverInicio() {
    this.announceForScreenReader('Redirigiendo al formulario de reservación...');
    window.location.href = '/#/formulario-reservacion-estudiante';
  }

  // Método para manejar teclado en botón volver
  onKeydownVolver(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.volverInicio();
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
}