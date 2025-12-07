import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, doc, setDoc, deleteDoc, getDocs, query, where } from '@angular/fire/firestore';

@Component({
  selector: 'app-formulario-reservacion-docente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formulario-reservacion-docente.html',
  styleUrl: './formulario-reservacion-docente.css',
})
export class FormularioReservacionDocente implements OnInit {

  // Variables del formulario
  nombre = '';
  nombredelacarrera = '';
  correo = '';
  nuevaClase: string[] = [];
  campus = '';
  sede = '';
  tipoAula = '';
  numeroaula = '';
  fecha = '';
  hora = '';
  resumen: any = null;
  qrDataUrl = '';
  docId: string | null = null;
  
  // Variables para manejo de errores y accesibilidad
  mostrarError = false;
  mensajeError = '';

  // Inyección de Firestore
  firestore: Firestore = inject(Firestore);

  // Opciones para selectores
  campusOpciones = [
    'Ceutec Tegucigalpa',
    'Ceutec La Ceiba',
    'Ceutec San Pedro Sula',
    'Ceutec Teledocencia'
  ];

  horasDisponibles = [
    '7:00 AM','8:30 AM','9:00 AM','10:00 AM','11:30 AM',
    '12:30 PM','1:30 PM','2:00 PM','3:00 PM','4:30 PM',
    '5:00 PM','6:00 PM','7:30 PM','8:00 PM','9:00 PM'
  ];
  
  horasOcupadas: string[] = [];

  ngOnInit() {
    // Inicializar fecha con el día actual
    const hoy = new Date();
    const fechaFormateada = hoy.toISOString().split('T')[0];
    this.fecha = fechaFormateada;
    
    // Cargar horas ocupadas inicialmente si hay datos
    setTimeout(() => this.cargarHorasOcupadas(), 1000);
  }

  // Método para agregar clase y sección
  agregarClaseyseccion(clase: string): void {
    if (clase && clase.trim() !== '' && !this.nuevaClase.includes(clase.trim())) {
      this.nuevaClase.push(clase.trim());
      
      // Anunciar para lectores de pantalla
      this.announceForScreenReader(`Clase "${clase}" agregada a la lista`);
    }
  }

  // Método para eliminar clase
  eliminarClase(index: number): void {
    if (this.nuevaClase.length > index) {
      const claseEliminada = this.nuevaClase[index];
      this.nuevaClase.splice(index, 1);
      
      // Anunciar para lectores de pantalla
      this.announceForScreenReader(`Clase "${claseEliminada}" eliminada`);
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
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Cargar horas ocupadas desde Firestore
  async cargarHorasOcupadas() {
    if (!this.fecha || !this.campus || !this.tipoAula || !this.numeroaula) {
      return;
    }

    try {
      const reservasRef = collection(this.firestore, 'reservas');
      const q = query(
        reservasRef,
        where('campus', '==', this.campus),
        where('tipoAula', '==', this.tipoAula),
        where('numeroaula', '==', this.numeroaula),
        where('fecha', '==', this.fecha)
      );

      const snapshot = await getDocs(q);

      this.horasOcupadas = snapshot.docs.map(doc => {
        const data = doc.data() as { hora: string };
        return data.hora;
      });

      // Anunciar actualización de disponibilidad
      if (this.horasOcupadas.length > 0) {
        this.announceForScreenReader(`${this.horasOcupadas.length} horas ocupadas cargadas`);
      }
    } catch (error) {
      console.error('Error al cargar horas ocupadas:', error);
    }
  }

  // Validar y mostrar resumen
  aceptarReservacion() {
    this.mostrarError = false;
    
    // Validar campos obligatorios
    const camposObligatorios = [
      { campo: this.nombre, nombre: 'Nombre completo' },
      { campo: this.nombredelacarrera, nombre: 'Nombre de la carrera' },
      { campo: this.correo, nombre: 'Correo educativo' },
      { campo: this.numeroaula, nombre: 'Número de aula' },
      { campo: this.fecha, nombre: 'Fecha' }
    ];

    const camposFaltantes = camposObligatorios.filter(item => !item.campo.trim());
    
    if (camposFaltantes.length > 0) {
      this.mensajeError = `Complete los campos obligatorios: ${camposFaltantes.map(item => item.nombre).join(', ')}`;
      this.mostrarError = true;
      this.setFocusOnFirstError();
      return;
    }

    // Validar formato de correo
    const correoRegex = /^[^\s@]+@[^\s@]+\.edu(\.[a-z]{2,})?$/i;
    if (!correoRegex.test(this.correo)) {
      this.mensajeError = '❌ El correo debe ser educativo (.edu)';
      this.mostrarError = true;
      this.setFocusOnFirstError();
      return;
    }

    // Validar hora ocupada
    if (this.horasOcupadas.includes(this.hora)) {
      this.mensajeError = '❌ Esta hora ya está reservada. Elija otra.';
      this.mostrarError = true;
      this.setFocusOnFirstError();
      return;
    }

    // Validar hora seleccionada
    if (!this.hora) {
      this.mensajeError = '❌ Seleccione una hora para la reservación';
      this.mostrarError = true;
      this.setFocusOnFirstError();
      return;
    }

    // Crear resumen
    this.resumen = {
      nombre: this.nombre,
      nombredelacarrera: this.nombredelacarrera,
      correo: this.correo,
      nuevaClase: [...this.nuevaClase],
      campus: this.campus,
      sede: this.sede,
      tipoAula: this.tipoAula,
      numeroaula: this.numeroaula,
      fecha: this.fecha,
      hora: this.hora
    };
    
    // Anunciar para lectores de pantalla
    this.announceForScreenReader('Resumen de reservación generado. Revise los detalles antes de confirmar.');
    
    // Enfocar el título del resumen
    setTimeout(() => {
      const resumenTitle = document.getElementById('resumen-title');
      if (resumenTitle) {
        resumenTitle.focus();
      }
    }, 100);
  }

  // Método para enfocar el primer campo con error
  private setFocusOnFirstError(): void {
    setTimeout(() => {
      const errorElement = document.querySelector('.mensaje-error');
      if (errorElement) {
        (errorElement as HTMLElement).focus();
      }
    }, 100);
  }

  // CREATE - Confirmar reservación
  async confirmarReservacion() {
    if (!this.resumen) return;

    try {
      const reservasRef = collection(this.firestore, 'reservas');

      if (this.docId) {
        // Actualizar reservación existente
        const docRef = doc(this.firestore, 'reservas', this.docId);
        await setDoc(docRef, this.resumen);
        this.announceForScreenReader('Reservación actualizada exitosamente');
      } else {
        // Crear nueva reservación
        const docRef = await addDoc(reservasRef, this.resumen);
        this.docId = docRef.id;
        this.announceForScreenReader('Reservación creada exitosamente');
      }

      // Generar texto para QR
      const qrTexto = `
RESERVACIÓN DE AULA
-------------------
Nombre: ${this.resumen.nombre}
Carrera: ${this.resumen.nombredelacarrera}
Correo: ${this.resumen.correo}
Clases: ${this.resumen.nuevaClase.join(', ') || 'Ninguna'}
Campus: ${this.resumen.campus}
Sede: ${this.resumen.sede || 'No especificada'}
Tipo de aula: ${this.resumen.tipoAula}
Aula: ${this.resumen.numeroaula}
Fecha: ${this.resumen.fecha}
Hora: ${this.resumen.hora} (1.5 horas)
ID: ${this.docId}
      `;

      // Generar QR
      const QRCodeModule: any = await import('qrcode');
      this.qrDataUrl = await QRCodeModule.toDataURL(qrTexto);

      // Anunciar éxito
      this.announceForScreenReader('Reservación confirmada y código QR generado');
      
      // Recargar horas ocupadas
      await this.cargarHorasOcupadas();
      
      // Mostrar alerta visual
      alert('✅ Reservación confirmada y QR generado.');
    } catch (error) {
      console.error('Error al confirmar reservación:', error);
      this.mensajeError = '❌ Error al confirmar la reservación. Intente nuevamente.';
      this.mostrarError = true;
      this.announceForScreenReader('Error al confirmar la reservación');
    }
  }

  // UPDATE - Actualizar reservación
  actualizarReservacion() {
    if (!this.resumen) return;

    // Restaurar valores del resumen al formulario
    this.nombre = this.resumen.nombre;
    this.nombredelacarrera = this.resumen.nombredelacarrera;
    this.correo = this.resumen.correo;
    this.nuevaClase = [...this.resumen.nuevaClase];
    this.campus = this.resumen.campus;
    this.sede = this.resumen.sede;
    this.tipoAula = this.resumen.tipoAula;
    this.numeroaula = this.resumen.numeroaula;
    this.fecha = this.resumen.fecha;
    this.hora = this.resumen.hora;

    this.resumen = null;
    this.qrDataUrl = '';
    
    // Anunciar para lectores de pantalla
    this.announceForScreenReader('Formulario listo para actualizar. Modifique los campos necesarios.');
    
    // Enfocar el primer campo del formulario
    setTimeout(() => {
      const primerCampo = document.getElementById('nombre-completo');
      if (primerCampo) {
        (primerCampo as HTMLElement).focus();
      }
    }, 100);
  }

  // DELETE - Cancelar reservación
  async cancelarReservacion() {
    try {
      if (!this.docId) {
        // Si no hay ID, solo limpiar el formulario
        this.limpiarFormulario();
        this.announceForScreenReader('Reservación cancelada');
        return;
      }

      // Confirmar cancelación
      const confirmar = confirm('¿Está seguro de cancelar esta reservación?');
      if (!confirmar) return;

      // Eliminar de Firestore
      const reservasRef = doc(this.firestore, 'reservas', this.docId);
      await deleteDoc(reservasRef);

      // Limpiar formulario
      this.limpiarFormulario();
      
      // Anunciar éxito
      this.announceForScreenReader('Reservación cancelada exitosamente');
      alert('🗑️ Reservación cancelada.');
      
      // Recargar horas ocupadas
      await this.cargarHorasOcupadas();
    } catch (error) {
      console.error('Error al cancelar reservación:', error);
      this.mensajeError = '❌ Error al cancelar la reservación.';
      this.mostrarError = true;
      this.announceForScreenReader('Error al cancelar la reservación');
    }
  }

  // Método auxiliar para limpiar el formulario
  private limpiarFormulario(): void {
    this.resumen = null;
    this.qrDataUrl = '';
    this.docId = null;
    this.nombre = '';
    this.nombredelacarrera = '';
    this.correo = '';
    this.nuevaClase = [];
    this.campus = '';
    this.sede = '';
    this.tipoAula = '';
    this.numeroaula = '';
    this.fecha = new Date().toISOString().split('T')[0];
    this.hora = '';
    this.mostrarError = false;
    this.mensajeError = '';
  }
}