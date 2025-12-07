import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, doc, setDoc, deleteDoc, getDocs, query, where } from '@angular/fire/firestore';

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
  selector: 'app-formulario-reservacion-estudiante',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formulario-reservacion-estudiante.html',
  styleUrls: ['./formulario-reservacion-estudiante.css']
})
export class FormularioReservacionEstudianteComponent implements OnInit {
  // Variables del formulario
  nombre = '';
  numeroCuenta = '';
  correo = '';
  otrosEstudiantes: string[] = [];
  campus = '';
  sede = '';
  tipoAula = '';
  numeroaula = '';
  fecha = '';
  hora = '';
  
  // Variables de estado
  resumen: Reservacion | null = null;
  qrDataUrl = '';
  docId: string | null = null;
  cargando = false;
  reservacionConfirmada = false;
  confirmando = false;
  qrGenerado = false;
  qrCargado = false;
  generandoQR = false;
  errorQR = false;
  
  // Variables para accesibilidad
  mostrarError = false;
  mensajeError = '';
  campoConError = '';

  // Fechas de emisión
  fechaEmision = new Date().toLocaleDateString();
  horaEmision = new Date().toLocaleTimeString();

  // Firestore
  firestore: Firestore = inject(Firestore);

  // Opciones del formulario
  campusOpciones = [
    'Unitec Tegucigalpa','Unitec San Pedro Sula','Ceutec Tegucigalpa','Ceutec La Ceiba',
    'Ceutec San Pedro Sula','Universidad Virtual','Unitec Teledocencia','Ceutec Teledocencia'
  ];

  horasDisponibles = ['8:00 AM','9:30 AM','11:00 AM','12:30 PM','2:00 PM','3:30 PM','5:00 PM','6:30 PM','8:00 PM','9:30 PM'];
  horasOcupadas: string[] = [];

  ngOnInit() {
    // Establecer fecha actual por defecto
    this.establecerFechaActual();
    
    // Enfocar título principal al cargar
    setTimeout(() => {
      const titulo = document.getElementById('titulo-formulario');
      if (titulo) {
        titulo.focus();
      }
    }, 100);
  }

  // Establecer fecha actual
  private establecerFechaActual(): void {
    const hoy = new Date();
    this.fecha = hoy.toISOString().split('T')[0];
  }

  agregarEstudiante(nombre: string) { 
    const nombreLimpio = nombre.trim();
    if(nombreLimpio && !this.otrosEstudiantes.includes(nombreLimpio)) {
      this.otrosEstudiantes.push(nombreLimpio);
      this.announceForScreenReader(`Estudiante "${nombreLimpio}" agregado a la lista`);
      
      // Enfocar el nuevo elemento de la lista
      setTimeout(() => {
        const nuevoElemento = document.getElementById(`estudiante-${this.otrosEstudiantes.length - 1}`);
        if (nuevoElemento) {
          nuevoElemento.focus();
        }
      }, 100);
    }
  }

  eliminarEstudiante(index: number) {
    if (this.otrosEstudiantes.length > index) {
      const estudianteEliminado = this.otrosEstudiantes[index];
      this.otrosEstudiantes.splice(index, 1);
      this.announceForScreenReader(`Estudiante "${estudianteEliminado}" eliminado de la lista`);
    }
  }

  // Anunciar para lectores de pantalla
  private announceForScreenReader(message: string): void {
    // Crear elemento para anunciar
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    // Agregar y remover después de anunciar
    document.body.appendChild(announcement);
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1500);
  }

  async cargarHorasOcupadas() {
    if(!this.fecha || !this.campus || !this.tipoAula || !this.numeroaula) {
      this.horasOcupadas = [];
      return;
    }
    
    this.cargando = true;
    this.announceForScreenReader('Cargando disponibilidad de horas...');
    
    try {
      const reservasRef = collection(this.firestore, 'reservas');
      const q = query(
        reservasRef, 
        where('campus','==',this.campus), 
        where('tipoAula','==',this.tipoAula), 
        where('numeroaula','==',this.numeroaula), 
        where('fecha','==',this.fecha)
      );
      const snapshot = await getDocs(q);
      this.horasOcupadas = snapshot.docs.map(doc => (doc.data() as { hora:string }).hora);
      
      if (this.horasOcupadas.length > 0) {
        this.announceForScreenReader(`${this.horasOcupadas.length} horas ocupadas encontradas.`);
      } else {
        this.announceForScreenReader('Todas las horas están disponibles.');
      }
    } catch (error) {
      console.error('Error cargando horas ocupadas:', error);
      this.horasOcupadas = [];
      this.announceForScreenReader('Error al cargar la disponibilidad de horas.');
    } finally {
      this.cargando = false;
    }
  }

  aceptarReservacion() {
    this.mostrarError = false;
    this.mensajeError = '';
    this.campoConError = '';
    
    // Validar campos obligatorios
    const camposObligatorios = [
      { campo: this.nombre, nombre: 'Nombre completo', id: 'nombre-completo' },
      { campo: this.numeroCuenta, nombre: 'Número de cuenta', id: 'numero-cuenta' },
      { campo: this.correo, nombre: 'Correo educativo', id: 'correo-educativo' },
      { campo: this.numeroaula, nombre: 'Número de aula', id: 'numero-aula' },
      { campo: this.fecha, nombre: 'Fecha', id: 'fecha-reservacion' },
      { campo: this.hora, nombre: 'Hora', id: 'hora-reservacion' }
    ];

    const camposFaltantes = camposObligatorios.filter(item => !item.campo.trim());
    
    if (camposFaltantes.length > 0) {
      const camposStr = camposFaltantes.map(item => item.nombre).join(', ');
      this.mensajeError = `Complete los campos obligatorios: ${camposStr}`;
      this.mostrarError = true;
      this.campoConError = camposFaltantes[0].id;
      this.announceForScreenReader(`Error: Campos obligatorios incompletos: ${camposStr}`);
      this.setFocusOnField(this.campoConError);
      return;
    }

    // Validar formato de correo
    const correoRegex = /^[^\s@]+@[^\s@]+\.edu(\.[a-z]{2,})?$/i;
    if(!correoRegex.test(this.correo)){ 
      this.mensajeError = 'El correo debe ser educativo (.edu)';
      this.mostrarError = true;
      this.campoConError = 'correo-educativo';
      this.announceForScreenReader('Error: El correo debe ser educativo y terminar en .edu');
      this.setFocusOnField(this.campoConError);
      return; 
    }

    // Validar hora ocupada
    if(this.horasOcupadas.includes(this.hora)) {
      this.mensajeError = 'La hora seleccionada no está disponible. Por favor seleccione otra hora.';
      this.mostrarError = true;
      this.campoConError = 'hora-reservacion';
      this.announceForScreenReader('Error: La hora seleccionada ya está ocupada. Seleccione otra hora.');
      this.setFocusOnField(this.campoConError);
      return;
    }

    // Crear resumen
    this.resumen = { 
      nombre: this.nombre, 
      numeroCuenta: this.numeroCuenta, 
      correo: this.correo, 
      otrosEstudiantes: [...this.otrosEstudiantes], 
      campus: this.campus, 
      sede: this.sede, 
      tipoAula: this.tipoAula, 
      numeroaula: this.numeroaula, 
      fecha: this.fecha, 
      hora: this.hora 
    };
    
    this.announceForScreenReader('Resumen de reservación generado. Revise los detalles antes de confirmar.');
    
    // Enfocar el título del resumen
    setTimeout(() => {
      const resumenTitle = document.getElementById('titulo-resumen');
      if (resumenTitle) {
        resumenTitle.focus();
      }
    }, 100);
  }

  // Enfocar campo específico
  private setFocusOnField(fieldId: string): void {
    setTimeout(() => {
      const fieldElement = document.getElementById(fieldId);
      if (fieldElement) {
        (fieldElement as HTMLElement).focus();
        
        // Para selects, abrir la lista
        if (fieldElement.tagName === 'SELECT') {
          fieldElement.setAttribute('aria-expanded', 'true');
        }
      }
    }, 100);
  }

  async confirmarReservacion() {
    if(!this.resumen) return;
    
    this.confirmando = true;
    this.errorQR = false;
    this.announceForScreenReader('Confirmando reservación...');
    
    try {
      // Verificar disponibilidad nuevamente
      await this.cargarHorasOcupadas();
      
      if(this.horasOcupadas.includes(this.resumen.hora)) {
        this.mensajeError = 'La hora seleccionada ya no está disponible. Por favor seleccione otra hora.';
        this.mostrarError = true;
        this.announceForScreenReader('Error: La hora seleccionada ya no está disponible. Actualizando formulario.');
        this.actualizarReservacion();
        return;
      }

      // Guardar en Firestore
      const reservasRef = collection(this.firestore,'reservas');
      if(this.docId){ 
        await setDoc(doc(this.firestore,'reservas',this.docId), this.resumen); 
        this.announceForScreenReader('Reservación actualizada exitosamente en la base de datos.');
      } else { 
        const docRef = await addDoc(reservasRef, this.resumen); 
        this.docId = docRef.id; 
        this.announceForScreenReader('Reservación creada exitosamente con ID: ' + this.docId);
      }

      // Generar QR
      await this.generarQRConURL();

      // Pequeña pausa para UX
      await new Promise(resolve => setTimeout(resolve, 1500));
        
      this.reservacionConfirmada = true;
      this.qrGenerado = true;
      
      this.announceForScreenReader('¡Reservación confirmada exitosamente! Código QR generado.');
      
      // Enfocar el título de confirmación
      setTimeout(() => {
        const confirmTitle = document.querySelector('.titulo-confirmacion');
        if (confirmTitle) {
          (confirmTitle as HTMLElement).focus();
        }
      }, 100);
      
    } catch(e){ 
      console.error('Error al confirmar:', e); 
      this.mensajeError = 'Error al confirmar la reservación. Intente nuevamente.';
      this.mostrarError = true;
      this.errorQR = true;
      this.announceForScreenReader('Error crítico al confirmar la reservación. Por favor intente nuevamente.');
    } finally {
      this.confirmando = false;
    }
  }

  // Generar QR con URL con hash
  private async generarQRConURL(): Promise<void> {
    if (!this.resumen || !this.docId) return;

    this.generandoQR = true;
    this.qrCargado = false;
    this.errorQR = false;
    this.announceForScreenReader('Generando código QR...');

    try {
      const qrURL = `https://ceutecbooking-980dd.web.app/#/qrreserva?id=${this.docId}`;

      let QRCode: any;
      
      try {
        const QRCodeModule = await import('qrcode');
        QRCode = QRCodeModule.default || QRCodeModule;
      } catch (importError) {
        console.warn('Error en import dinámico:', importError);
        throw new Error('No se pudo cargar la librería QRCode');
      }

      this.qrDataUrl = await QRCode.toDataURL(qrURL, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      this.announceForScreenReader('Código QR generado exitosamente. Escanee para ver los detalles de la reservación.');
      
    } catch (error) {
      console.error('Error generando QR:', error);
      this.errorQR = true;
      this.generarQRRespaldoSimple();
    } finally {
      this.generandoQR = false;
    }
  }

  // Generar QR de respaldo simple
  private generarQRRespaldoSimple(): void {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('No se pudo obtener contexto canvas');
      }
    
      canvas.width = 200;
      canvas.height = 200;
    
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    
      ctx.strokeStyle = '#004aad';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
      ctx.fillStyle = '#004aad';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('RESERVACIÓN', canvas.width / 2, canvas.height / 2 - 10);
      ctx.fillText('CONFIRMADA', canvas.width / 2, canvas.height / 2 + 10);
    
      this.qrDataUrl = canvas.toDataURL();
      this.qrCargado = true;
      this.announceForScreenReader('Código QR de respaldo generado.');
    
    } catch (error) {
      console.error('Error generando QR de respaldo:', error);
      this.qrDataUrl = '';
      this.errorQR = true;
    }
  }

  // Manejadores de eventos de QR
  onQRLoaded() {
    this.qrCargado = true;
    this.errorQR = false;
    this.announceForScreenReader('Imagen QR cargada exitosamente.');
  }

  onQRError() {
    this.qrCargado = false;
    this.errorQR = true;
    this.announceForScreenReader('Error cargando imagen QR.');
  }

  async regenerarQR() {
    this.qrDataUrl = '';
    this.qrCargado = false;
    this.errorQR = false;
    this.announceForScreenReader('Regenerando código QR...');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    await this.generarQRConURL();
  }

  actualizarReservacion() {
    if(!this.resumen) return;
    
    // Restaurar valores
    this.nombre = this.resumen.nombre;
    this.numeroCuenta = this.resumen.numeroCuenta;
    this.correo = this.resumen.correo;
    this.otrosEstudiantes = [...this.resumen.otrosEstudiantes];
    this.campus = this.resumen.campus;
    this.sede = this.resumen.sede;
    this.tipoAula = this.resumen.tipoAula;
    this.numeroaula = this.resumen.numeroaula;
    this.fecha = this.resumen.fecha;
    this.hora = this.resumen.hora;

    this.resumen = null;
    this.reservacionConfirmada = false;
    this.qrGenerado = false;
    this.qrDataUrl = '';
    this.qrCargado = false;
    this.errorQR = false;
    this.mostrarError = false;
    
    this.announceForScreenReader('Formulario listo para actualizar. Los campos han sido restaurados con los datos anteriores.');
    
    // Enfocar el primer campo
    setTimeout(() => {
      const primerCampo = document.getElementById('nombre-completo');
      if (primerCampo) {
        primerCampo.focus();
      }
    }, 100);
  }

  async cancelarReservacion() {
    const confirmar = confirm('¿Está seguro de que desea cancelar esta reservación?');
    if(!confirmar) {
      this.announceForScreenReader('Cancelación de reservación cancelada.');
      return;
    }
    
    try {
      if(this.docId) {
        await deleteDoc(doc(this.firestore,'reservas',this.docId));
      }
      
      this.limpiarFormulario();
      this.announceForScreenReader('Reservación cancelada exitosamente. Formulario reiniciado.');
      alert('Reservación cancelada exitosamente');
      
    } catch(e){ 
      console.error(e); 
      this.mensajeError = 'Error al cancelar la reservación';
      this.mostrarError = true;
      this.announceForScreenReader('Error al cancelar la reservación.');
    }
  }

  // Manejar teclado en lista de estudiantes
  manejarTecladoEstudiante(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.eliminarEstudiante(index);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const items = document.querySelectorAll('.estudiante-item');
      let nextIndex = event.key === 'ArrowDown' ? index + 1 : index - 1;
      
      if (nextIndex < 0) nextIndex = items.length - 1;
      if (nextIndex >= items.length) nextIndex = 0;
      
      const nextItem = items[nextIndex] as HTMLElement;
      if (nextItem) {
        nextItem.focus();
      }
    }
  }

  private limpiarFormulario() {
    this.resumen = null; 
    this.qrDataUrl = ''; 
    this.docId = null; 
    this.nombre = ''; 
    this.numeroCuenta = ''; 
    this.correo = ''; 
    this.otrosEstudiantes = []; 
    this.campus = ''; 
    this.sede = ''; 
    this.tipoAula = ''; 
    this.numeroaula = ''; 
    this.fecha = ''; 
    this.hora = '';
    this.qrGenerado = false;
    this.qrCargado = false;
    this.errorQR = false;
    this.reservacionConfirmada = false;
    this.mostrarError = false;
    this.mensajeError = '';
    this.campoConError = '';
    
    // Restablecer fecha actual
    this.establecerFechaActual();
    
    // Enfocar título
    setTimeout(() => {
      const titulo = document.getElementById('titulo-formulario');
      if (titulo) {
        titulo.focus();
      }
    }, 100);
  }

  esHoraDisponible(hora: string): boolean {
    return !this.horasOcupadas.includes(hora);
  }

  getClaseHora(hora: string): string {
    return this.esHoraDisponible(hora) ? '' : 'hora-ocupada';
  }

  esHoraDeshabilitada(hora: string): boolean {
    return !this.esHoraDisponible(hora);
  }

  // Métodos de prueba (opcionales, mantener originales)
  probarRutaQR() {
    if (this.docId) {
      const urlQR = `/#/qrreserva?id=${this.docId}`;
      console.log('🔗 Navegando a ruta con hash:', urlQR);
      window.location.href = urlQR;
    } else {
      alert('Primero confirma una reservación');
    }
  }

  verificarURLQR() {
    if (this.docId) {
      const urlCompleta = `https://ceutecbooking-980dd.web.app/#/qrreserva?id=${this.docId}`;
      console.log('🔗 URL COMPLETA con hash:', urlCompleta);
      window.open(urlCompleta, '_blank');
      alert(`URL del QR generada:\n${urlCompleta}\n\nSe ha abierto en nueva pestaña.`);
    } else {
      alert('No hay ID de reservación generado');
    }
  }

  probarAmbasURLs() {
    if (!this.docId) {
      alert('No hay ID de reservación');
      return;
    }

    const urlNormal = `https://ceutecbooking-980dd.web.app/qrreserva?id=${this.docId}`;
    const urlConHash = `https://ceutecbooking-980dd.web.app/#/qrreserva?id=${this.docId}`;
    
    console.log('🔗 URL Normal:', urlNormal);
    console.log('🔗 URL con Hash:', urlConHash);
    
    window.open(urlNormal, 'url_normal');
    setTimeout(() => {
      window.open(urlConHash, 'url_hash');
    }, 500);
    
    alert(`Probando ambas URLs:\n\n• Normal: ${urlNormal}\n• Con Hash: ${urlConHash}\n\nSe abrirán en pestañas separadas.`);
  }

  // Propiedad computada para los items del resumen
  get resumenItems() {
    if (!this.resumen) return [];
    
    return [
      {label:'Nombre', value: this.resumen.nombre, icon:'fas fa-user azul'},
      {label:'Número de cuenta', value: this.resumen.numeroCuenta, icon:'fas fa-id-card rojo'},
      {label:'Correo', value: this.resumen.correo, icon:'fas fa-envelope azul'},
      {label:'Otros estudiantes', value: this.resumen.otrosEstudiantes.join(', ') || 'Ninguno', icon:'fas fa-users beige'},
      {label:'Campus', value: this.resumen.campus, icon:'fas fa-university azul'},
      {label:'Sede', value: this.resumen.sede || 'No especificada', icon:'fas fa-map-marker-alt rojo'},
      {label:'Tipo de aula', value: this.resumen.tipoAula, icon:'fas fa-chalkboard beige'},
      {label:'Número de aula', value: this.resumen.numeroaula, icon:'fas fa-door-open beige'},
      {label:'Fecha reservación', value: this.resumen.fecha, icon:'fas fa-calendar-alt azul'},
      {label:'Hora reservación', value: this.resumen.hora + ' (1.5 h)', icon:'fas fa-clock rojo'}
    ];
  }
}