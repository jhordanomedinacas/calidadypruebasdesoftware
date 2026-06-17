import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { NavbarComponent } from '../../../../components/navbar/navbar';
import { AuthService } from '../../../../services/auth';
import { NoticiaAdminService, CategoriaNoticia, NoticiaRequest } from '../../../../services/noticia-admin';

interface FormNoticia {
  titulo: string;
  lead: string;          // ← resumen corto (NotBlank en el backend)
  contenidoHtml: string;
  categoria: Exclude<CategoriaNoticia, 'Todas'>;
  imagenUrl: string;
  imagenNombre: string;
  publicada: boolean;    // ← NUEVO: el backend lo exige al crear/editar
  destacada: boolean;
}

@Component({
  selector: 'app-crear-editar-noticia',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './crear-editar-noticia.html',
  styleUrl: './crear-editar-noticia.css'
})
export class CrearEditarNoticiaComponent implements OnInit, AfterViewInit {

  @ViewChild('editorRef')        editorRef!: ElementRef<HTMLDivElement>;
  @ViewChild('inputImagenInline') inputImagenInline!: ElementRef<HTMLInputElement>;

  modoEditar  = false;
  private noticiaId: number | null = null;

  form: FormNoticia = this.resetForm();

  categorias: Exclude<CategoriaNoticia, 'Todas'>[] = [
    'Institucional', 'Rutas', 'Alertas', 'Tráfico', 'Eventos'
  ];

  // ── Estado de la barra de formato ──────────────────────────────────────────
  estadoBold   = false;
  estadoItalic = false;
  estadoUnder  = false;
  tamanoTexto  = 14;
  tamanoOpciones = [10, 12, 14, 16, 18, 20, 24];
  mostrarTamanos = false;

  // ── Estado del editor ──────────────────────────────────────────────────────
  editorTieneContenido = false;

  // ── Imagen seleccionada dentro del editor ──────────────────────────────────
  imgSeleccionada: HTMLImageElement | null = null;
  imgToolbarTop  = 0;
  imgToolbarLeft = 0;

  // Posiciones de los handles en esquinas
  imgCornerTL_X = 0;
  imgCornerTL_Y = 0;
  imgCornerTR_X = 0;
  imgCornerBL_Y = 0;

  // ── Resize handles ────────────────────────────────────────────────────────
  private resizeData: { startX: number; startW: number } | null = null;
  private boundResizeMove!: (e: MouseEvent) => void;
  private boundResizeEnd!:  () => void;

  // Guardamos la selección antes de abrir el file picker
  private savedRange: Range | null = null;

  // ── Historial undo ─────────────────────────────────────────────────────────
  private historial: string[] = [];
  private historialIndex = -1;
  private readonly MAX_HISTORIAL = 50;
  private guardandoHistorial = false;
  private timerHistorial: any = null;
  canUndo = false;
  canRedo = false;

  // ── Modal eliminar ─────────────────────────────────────────────────────────
  modalEliminar = false;

  // ── Estados de red ─────────────────────────────────────────────────────────
  cargando        = false;  // cargando la noticia (modo editar)
  errorCarga      = '';
  guardando       = false;  // crear/editar en curso
  errorGuardar    = '';
  eliminandoNoticia = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private noticiaService: NoticiaAdminService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.modoEditar = true;
      this.noticiaId  = Number(id);
      this.cargarNoticia(this.noticiaId);
    }
  }

  ngAfterViewInit(): void {
    document.addEventListener('click', () => {
      if (this.mostrarTamanos) {
        this.mostrarTamanos = false;
        this.cdr.markForCheck();
      }
    });

    // En modo crear el editor ya está visible; inicializamos de una vez.
    // En modo editar el editor está oculto bajo *ngIf="!cargando", por lo que
    // editorRef todavía es undefined aquí — la inicialización se hace en
    // initEditor(), que se llama desde cargarNoticia() tras recibir la respuesta.
    if (!this.modoEditar) {
      this.initEditor();
    }
  }

  /** Adjunta el listener de teclado al editor y arranca el historial.
   *  Se llama una sola vez, cuando el div #editorRef ya existe en el DOM. */
  private initEditor(): void {
    if (!this.editorRef?.nativeElement) return;

    this.editorRef.nativeElement.addEventListener('keydown', (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'z') {
        e.preventDefault();
        this.undo();
      } else if (ctrl && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        this.redo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && this.imgSeleccionada) {
        e.preventDefault();
        this.eliminarImg();
      }
    });

    this.pushHistorial();
  }

  private cargarNoticia(id: number): void {
    this.cargando   = true;
    this.errorCarga = '';

    this.noticiaService.obtener(id).subscribe({
      next: (res) => {
        this.form = {
          titulo:        res.titulo,
          lead:          res.lead,
          contenidoHtml: res.contenidoHtml,
          categoria:     res.categoria as Exclude<CategoriaNoticia, 'Todas'>,
          imagenUrl:     res.imagenUrl,
          imagenNombre:  '',
          publicada:     res.publicada,
          destacada:     res.destacada
        };
        this.cargando = false;

        // Forzamos un ciclo de detección de cambios para que Angular
        // renderice el *ngIf="!cargando" y el div #editorRef aparezca
        // en el DOM antes de que intentemos escribir en él.
        this.cdr.detectChanges();

        this.editorRef.nativeElement.innerHTML = this.form.contenidoHtml;
        this.editorTieneContenido = !!this.form.contenidoHtml.trim();
        this.adjuntarListenersImagenes();
        this.initEditor();
        this.cdr.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        this.cargando   = false;
        this.errorCarga = err.error?.message ?? 'No se pudo cargar la noticia. Intenta nuevamente.';
        this.cdr.markForCheck();
      }
    });
  }

  // ── Historial undo/redo ────────────────────────────────────────────────────

  private pushHistorial(immediate = false): void {
    if (this.guardandoHistorial) return;

    const doGuardar = () => {
      if (this.imgSeleccionada) this.imgSeleccionada.classList.remove('selected');
      const html = this.editorRef?.nativeElement?.innerHTML ?? '';
      if (this.imgSeleccionada) this.imgSeleccionada.classList.add('selected');

      if (this.historial[this.historialIndex] === html) return;
      this.historial = this.historial.slice(0, this.historialIndex + 1);
      this.historial.push(html);
      if (this.historial.length > this.MAX_HISTORIAL) {
        this.historial.shift();
      }
      this.historialIndex = this.historial.length - 1;
      this.actualizarEstadoUndo();
    };

    if (immediate) {
      clearTimeout(this.timerHistorial);
      doGuardar();
    } else {
      clearTimeout(this.timerHistorial);
      this.timerHistorial = setTimeout(doGuardar, 400);
    }
  }

  undo(): void {
    if (this.historialIndex <= 0) return;
    clearTimeout(this.timerHistorial);
    const htmlActual = this.editorRef.nativeElement.innerHTML;
    if (this.historial[this.historialIndex] !== htmlActual) {
      this.historial = this.historial.slice(0, this.historialIndex + 1);
      this.historial.push(htmlActual);
      this.historialIndex = this.historial.length - 1;
    }
    this.historialIndex--;
    this.restaurarSnapshot(this.historial[this.historialIndex]);
  }

  redo(): void {
    if (this.historialIndex >= this.historial.length - 1) return;
    this.historialIndex++;
    this.restaurarSnapshot(this.historial[this.historialIndex]);
  }

  private restaurarSnapshot(html: string): void {
    this.guardandoHistorial = true;
    this.editorRef.nativeElement.innerHTML = html;
    this.adjuntarListenersImagenes();
    if (this.imgSeleccionada) this.imgSeleccionada.classList.remove('selected');
    this.imgSeleccionada = null;
    this.imgToolbarTop = 0; this.imgToolbarLeft = 0;
    this.imgCornerTL_X = 0; this.imgCornerTL_Y = 0;
    this.imgCornerTR_X = 0; this.imgCornerBL_Y = 0;
    this.onEditorInput();
    this.actualizarEstadoUndo();
    this.guardandoHistorial = false;
    this.cdr.detectChanges();
  }

  private actualizarEstadoUndo(): void {
    this.canUndo = this.historialIndex > 0;
    this.canRedo = this.historialIndex < this.historial.length - 1;
    this.cdr.markForCheck();
  }

  // ── Navegación ─────────────────────────────────────────────────────────────
  irInicio(): void { this.router.navigate(['/inicia']); }
  volver():   void { this.router.navigate(['/gestion-noticias']); }
  onLogout(): void { this.auth.cerrarSesion(); this.router.navigate(['/login']); }

  // ── Guardar ────────────────────────────────────────────────────────────────
  guardar(): void {
    if (!this.form.titulo.trim() || !this.form.lead.trim() || !this.editorTieneContenido) return;
    this.form.contenidoHtml = this.editorRef.nativeElement.innerHTML;

    const body: NoticiaRequest = {
      titulo:        this.form.titulo.trim(),
      contenidoHtml: this.form.contenidoHtml,
      lead:          this.form.lead.trim(),
      categoria:     this.form.categoria,
      imagenUrl:     this.form.imagenUrl,
      publicada:     this.form.publicada,
      destacada:     this.form.destacada
    };

    this.guardando    = true;
    this.errorGuardar = '';

    const peticion = (this.modoEditar && this.noticiaId !== null)
      ? this.noticiaService.editar(this.noticiaId, body)
      : this.noticiaService.crear(body);

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.volver();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando    = false;
        this.errorGuardar = err.error?.message ?? 'No se pudo guardar la noticia. Intenta nuevamente.';
        this.cdr.markForCheck();
      }
    });
  }

  // ── Modal eliminar ─────────────────────────────────────────────────────────
  confirmarEliminar(): void { this.modalEliminar = true; }

  cancelarEliminar(): void {
    if (this.eliminandoNoticia) return;
    this.modalEliminar = false;
  }

  ejecutarEliminar(): void {
    if (this.noticiaId === null) return;

    this.eliminandoNoticia = true;
    this.noticiaService.eliminar(this.noticiaId).subscribe({
      next: () => {
        this.eliminandoNoticia = false;
        this.modalEliminar     = false;
        this.volver();
      },
      error: (err: HttpErrorResponse) => {
        this.eliminandoNoticia = false;
        this.modalEliminar     = false;
        this.errorGuardar = err.error?.message ?? 'No se pudo eliminar la noticia. Intenta nuevamente.';
        this.cdr.markForCheck();
      }
    });
  }

  // ── Eventos del editor ─────────────────────────────────────────────────────

  onEditorInput(): void {
    const texto = this.editorRef.nativeElement.innerText?.trim() ?? '';
    const html  = this.editorRef.nativeElement.innerHTML ?? '';
    this.editorTieneContenido = texto.length > 0 || html.includes('<img');
    this.pushHistorial();
  }

  onEditorKeyup(): void {
    this.actualizarEstadoFormato();
  }

  onEditorMouseup(): void {
    this.actualizarEstadoFormato();
    this.deseleccionarImg();
  }

  onEditorClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'IMG' && target.classList.contains('editor-img')) {
      event.preventDefault();
      this.seleccionarImg(target as HTMLImageElement);
    } else {
      this.deseleccionarImg();
    }
  }

  // ── Formato de texto ───────────────────────────────────────────────────────

  aplicarFormato(comando: string): void {
    this.editorRef.nativeElement.focus();
    document.execCommand(comando, false);
    this.actualizarEstadoFormato();
    this.pushHistorial(true);
    this.cdr.markForCheck();
  }

  aplicarTamano(px: number): void {
    this.tamanoTexto    = px;
    this.mostrarTamanos = false;
    this.restaurarSeleccion();

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    const range    = sel.getRangeAt(0);
    const fragment = range.extractContents();
    const span     = document.createElement('span');
    span.style.fontSize = `${px}px`;
    span.appendChild(fragment);
    range.insertNode(span);

    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.addRange(newRange);

    this.pushHistorial(true);
    this.cdr.markForCheck();
  }

  toggleTamanos(): void {
    this.mostrarTamanos = !this.mostrarTamanos;
    if (this.mostrarTamanos) {
      this.guardarSeleccion();
    }
  }

  private actualizarEstadoFormato(): void {
    this.estadoBold   = document.queryCommandState('bold');
    this.estadoItalic = document.queryCommandState('italic');
    this.estadoUnder  = document.queryCommandState('underline');
    this.cdr.markForCheck();
  }

  // ── Insertar imagen en la posición del cursor ──────────────────────────────

  triggerImagenInline(): void {
    this.guardarSeleccion();
    this.inputImagenInline.nativeElement.value = '';
    this.inputImagenInline.nativeElement.click();
  }

  onImagenInlineSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.insertarImagenEnCursor(dataUrl, file.name);
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  private guardarSeleccion(): void {
    const sel = window.getSelection();
    this.savedRange = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;
  }

  private restaurarSeleccion(): void {
    if (!this.savedRange) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(this.savedRange);
    }
  }

  private insertarImagenEnCursor(src: string, nombre: string): void {
    this.editorRef.nativeElement.focus();

    if (!this.savedRange) {
      const range = document.createRange();
      range.selectNodeContents(this.editorRef.nativeElement);
      range.collapse(false);
      const sel = window.getSelection();
      if (sel) { sel.removeAllRanges(); sel.addRange(range); }
      this.savedRange = range.cloneRange();
    }

    this.restaurarSeleccion();

    const img = document.createElement('img');
    img.src       = src;
    img.alt       = nombre;
    img.className = 'editor-img';
    img.style.width = '100%';
    img.dataset['nombre'] = nombre;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(img);
      range.setStartAfter(img);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      this.editorRef.nativeElement.appendChild(img);
    }

    this.adjuntarListenerImagen(img);
    this.onEditorInput();
    this.pushHistorial(true);
  }

  // ── Selección y edición de imagen ─────────────────────────────────────────

  private adjuntarListenersImagenes(): void {
    const imgs = this.editorRef.nativeElement.querySelectorAll<HTMLImageElement>('img.editor-img');
    imgs.forEach(img => this.adjuntarListenerImagen(img));
  }

  private adjuntarListenerImagen(img: HTMLImageElement): void {
    img.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.seleccionarImg(img);
      this.cdr.markForCheck();
    });
  }

  // ── Resize handles ────────────────────────────────────────────────────────

  iniciarResize(event: MouseEvent, esquina: 'nw' | 'ne' | 'sw' | 'se'): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.imgSeleccionada) return;

    const imgEl  = this.imgSeleccionada;
    const startX = event.clientX;
    const startW = imgEl.getBoundingClientRect().width;
    const contW  = this.editorRef.nativeElement.getBoundingClientRect().width;
    const dirX   = (esquina === 'ne' || esquina === 'se') ? 1 : -1;

    this.boundResizeMove = (e: MouseEvent) => {
      const delta  = (e.clientX - startX) * dirX;
      const newPct = Math.min(100, Math.max(10, ((startW + delta) / contW) * 100));
      imgEl.style.width = `${newPct.toFixed(1)}%`;
      this.seleccionarImg(imgEl);
    };

    this.boundResizeEnd = () => {
      document.removeEventListener('mousemove', this.boundResizeMove);
      document.removeEventListener('mouseup',   this.boundResizeEnd);
      this.pushHistorial(true);
    };

    document.addEventListener('mousemove', this.boundResizeMove);
    document.addEventListener('mouseup',   this.boundResizeEnd);
  }

  private seleccionarImg(img: HTMLImageElement): void {
    if (this.imgSeleccionada && this.imgSeleccionada !== img) {
      this.imgSeleccionada.classList.remove('selected');
    }
    this.imgSeleccionada = img;
    img.classList.add('selected');

    const editorRect = this.editorRef.nativeElement.getBoundingClientRect();
    const imgRect    = img.getBoundingClientRect();

    this.imgToolbarTop  = imgRect.top  - editorRect.top  - 44;
    this.imgToolbarLeft = imgRect.left - editorRect.left;
    if (this.imgToolbarTop < 4) this.imgToolbarTop = imgRect.bottom - editorRect.top + 6;

    this.imgCornerTL_X = imgRect.left   - editorRect.left;
    this.imgCornerTL_Y = imgRect.top    - editorRect.top;
    this.imgCornerTR_X = imgRect.right  - editorRect.left;
    this.imgCornerBL_Y = imgRect.bottom - editorRect.top;

    this.cdr.markForCheck();
  }

  private deseleccionarImg(): void {
    if (this.imgSeleccionada) {
      this.imgSeleccionada.classList.remove('selected');
      this.imgSeleccionada = null;
      this.cdr.markForCheck();
    }
  }

  redimensionarImg(pct: number): void {
    if (!this.imgSeleccionada) return;
    this.imgSeleccionada.style.width = `${pct}%`;
    setTimeout(() => { if (this.imgSeleccionada) this.seleccionarImg(this.imgSeleccionada); }, 0);
    this.pushHistorial(true);
  }

  alinearImg(align: 'left' | 'center' | 'right'): void {
    if (!this.imgSeleccionada) return;
    const img = this.imgSeleccionada;
    if (align === 'left') {
      img.style.marginLeft  = '0';
      img.style.marginRight = 'auto';
      img.style.display     = 'block';
    } else if (align === 'center') {
      img.style.marginLeft  = 'auto';
      img.style.marginRight = 'auto';
      img.style.display     = 'block';
    } else {
      img.style.marginLeft  = 'auto';
      img.style.marginRight = '0';
      img.style.display     = 'block';
    }
    setTimeout(() => { if (this.imgSeleccionada) this.seleccionarImg(this.imgSeleccionada); }, 0);
    this.pushHistorial(true);
  }

  eliminarImg(): void {
    if (!this.imgSeleccionada) return;
    this.imgSeleccionada.remove();
    this.imgSeleccionada = null;
    this.imgToolbarTop = 0; this.imgToolbarLeft = 0;
    this.imgCornerTL_X = 0; this.imgCornerTL_Y = 0;
    this.imgCornerTR_X = 0; this.imgCornerBL_Y = 0;
    this.onEditorInput();
    this.pushHistorial(true);
    this.cdr.detectChanges();
  }

  // ── Imagen de portada ──────────────────────────────────────────────────────
  onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.form.imagenNombre = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.form.imagenUrl = e.target?.result as string;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private resetForm(): FormNoticia {
    return {
      titulo: '',
      lead: '',
      contenidoHtml: '',
      categoria: 'Institucional',
      imagenUrl: '',
      imagenNombre: '',
      publicada: false,
      destacada: false // ← default false
    };
  }
}