import { CommonModule } from '@angular/common';
import { HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormationMediaResponseDto } from '../models/formation-media.model';
import { FormationMediaService } from '../services/formation-media.service';
import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';

@Component({
  selector: 'app-formation-media-gallery',
  standalone: true,
  imports: [CommonModule, AdminIconComponent],
  templateUrl: './formation-media-gallery.component.html',
  styleUrl: './formation-media-gallery.component.css'
})
export class FormationMediaGalleryComponent implements OnInit, OnChanges {
  @ViewChild('mediaInput') mediaInput?: ElementRef<HTMLInputElement>;

  @Input() formationId: number | null = null;
  @Input() canManage = false;
  @Input() title = 'Galerie media';
  @Input() mediaMode: 'all' | 'image' = 'all';

  @Output() mediaAdded = new EventEmitter<void>();
  @Output() mediaDeleted = new EventEmitter<number>();
  @Output() actionDone = new EventEmitter<'media-added' | 'media-deleted'>();

  readonly fallbackImageUrl = 'assets/images/default-image.jpg';

  mediaList: FormationMediaResponseDto[] = [];
  selectedFile: File | null = null;
  selectedFileName = '';
  uploadProgress = 0;
  isLoading = false;
  isUploading = false;
  message = '';
  deleteInProgress = new Set<number>();

  constructor(private mediaService: FormationMediaService) {}

  get acceptedFileTypes(): string {
    return this.mediaMode === 'image' ? 'image/*' : 'image/*,video/*';
  }

  get visibleMediaList(): FormationMediaResponseDto[] {
    if (this.mediaMode === 'image') {
      return this.mediaList.filter((media) => this.isImage(media));
    }
    return this.mediaList;
  }

  ngOnInit(): void {
    this.loadMedia();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formationId'] && !changes['formationId'].firstChange) {
      this.loadMedia();
    }
  }

  loadMedia(): void {
    if (!this.formationId) {
      this.mediaList = [];
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.mediaService.getFormationMedia(this.formationId).subscribe({
      next: (response) => {
        this.mediaList = this.mediaService.sortByDisplayOrder(response);
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.mediaList = [];
        this.isLoading = false;
        this.message = this.getErrorMessage(error.status, 'load', error.error);
      }
    });
  }

  onMediaSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    this.message = '';

    if (!file) {
      this.clearFileSelection();
      return;
    }

    if (this.mediaMode === 'image' && !file.type.startsWith('image/')) {
      this.message = 'Seules les images sont autorisees ici.';
      this.clearFileSelection();
      return;
    }

    if (this.mediaMode !== 'image' && !file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      this.message = this.getErrorMessage(415, 'upload');
      this.clearFileSelection();
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
  }

  uploadSelectedMedia(): void {
    if (!this.canManage || !this.formationId || !this.selectedFile || this.isUploading) {
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.message = '';

    this.mediaService.uploadMedia(this.formationId, this.selectedFile).subscribe({
      next: (event: HttpEvent<FormationMediaResponseDto>) => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total ?? this.selectedFile?.size ?? 0;
          this.uploadProgress = total > 0 ? Math.round((event.loaded / total) * 100) : 0;
        }

        if (event.type === HttpEventType.Response) {
          this.isUploading = false;
          this.uploadProgress = 100;
          this.clearFileSelection();
          this.loadMedia();
          this.mediaAdded.emit();
          this.actionDone.emit('media-added');
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isUploading = false;
        this.message = this.getErrorMessage(error.status, 'upload', error.error);
      }
    });
  }

  deleteMedia(media: FormationMediaResponseDto): void {
    if (!this.canManage || !this.formationId || this.deleteInProgress.has(media.id)) {
      return;
    }

    this.deleteInProgress.add(media.id);
    this.message = '';

    this.mediaService.deleteFormationMedia(this.formationId, media.id).subscribe({
      next: () => {
        this.deleteInProgress.delete(media.id);
        this.mediaList = this.mediaList.filter((item) => item.id !== media.id);
        this.mediaDeleted.emit(media.id);
        this.actionDone.emit('media-deleted');
      },
      error: (error: HttpErrorResponse) => {
        this.deleteInProgress.delete(media.id);
        this.message = this.getErrorMessage(error.status, 'delete', error.error);
      }
    });
  }

  isVideo(media: FormationMediaResponseDto): boolean {
    if (this.mediaMode === 'image') {
      return false;
    }
    const mediaType = this.safeText(media.mediaType).toUpperCase();
    const mimeType = this.safeText(media.mimeType).toLowerCase();
    const fileName = this.safeText(media.fileName).toLowerCase();
    const mediaUrl = this.safeText(media.mediaUrl).toLowerCase();
    return mediaType === 'VIDEO'
      || mimeType.startsWith('video/')
      || /\.(mp4|mov|m3u8|webm)(\?.*)?$/i.test(fileName)
      || /\.(mp4|mov|m3u8|webm)(\?.*)?$/i.test(mediaUrl);
  }

  isImage(media: FormationMediaResponseDto): boolean {
    const mediaType = this.safeText(media.mediaType).toUpperCase();
    const mimeType = this.safeText(media.mimeType).toLowerCase();
    const fileName = this.safeText(media.fileName).toLowerCase();
    const mediaUrl = this.safeText(media.mediaUrl).toLowerCase();
    return mediaType === 'IMAGE'
      || mimeType.startsWith('image/')
      || /\.(png|jpe?g|gif|webp|bmp|avif|svg)(\?.*)?$/i.test(fileName)
      || /\.(png|jpe?g|gif|webp|bmp|avif|svg)(\?.*)?$/i.test(mediaUrl);
  }

  resolveMediaUrl(mediaUrl: string): string {
    return this.mediaService.resolveMediaUrl(mediaUrl);
  }

  trackByMediaId(_index: number, media: FormationMediaResponseDto): number {
    return media.id;
  }

  onImageError(event: Event): void {
    const imageElement = event.target as HTMLImageElement | null;
    if (!imageElement || imageElement.dataset['fallbackApplied'] === 'true') {
      return;
    }

    imageElement.dataset['fallbackApplied'] = 'true';
    imageElement.src = this.fallbackImageUrl;
  }

  formatUploadDate(uploadDate: string): string {
    const parsedDate = new Date(uploadDate);
    return Number.isNaN(parsedDate.getTime()) ? '-' : parsedDate.toLocaleString();
  }

  formatFileSize(fileSize: number): string {
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const unitIndex = Math.min(Math.floor(Math.log(fileSize) / Math.log(1024)), units.length - 1);
    const normalizedValue = fileSize / (1024 ** unitIndex);
    return `${normalizedValue.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }

  private clearFileSelection(): void {
    this.selectedFile = null;
    this.selectedFileName = '';
    if (this.mediaInput?.nativeElement) {
      this.mediaInput.nativeElement.value = '';
    }
  }

  private getErrorMessage(
    status: number,
    action: 'load' | 'upload' | 'delete',
    errorBody?: unknown
  ): string {
    const backendMessage = this.resolveBackendMessage(errorBody);
    if (backendMessage) {
      return backendMessage;
    }

    switch (status) {
      case 400:
        return '400: Donnees invalides.';
      case 401:
        return '401: Utilisateur non connecte.';
      case 403:
        return '403: Acces refuse.';
      case 404:
        return action === 'delete' ? '404: Media introuvable.' : '404: Formation introuvable.';
      case 415:
        return this.mediaMode === 'image'
          ? '415: Media non supporte. Utilisez uniquement image/*.'
          : '415: Media non supporte. Utilisez image/* ou video/*.';
      case 500:
        return '500: Erreur serveur.';
      default:
        return action === 'load'
          ? 'Impossible de charger les medias.'
          : action === 'upload'
            ? 'Impossible de televerser le media.'
            : 'Impossible de supprimer le media.';
    }
  }

  private resolveBackendMessage(errorBody: unknown): string {
    if (typeof errorBody === 'string' && errorBody.trim()) {
      return errorBody.trim();
    }
    if (!errorBody || typeof errorBody !== 'object') {
      return '';
    }
    const candidate = errorBody as { message?: unknown; error?: unknown; details?: unknown };
    return (typeof candidate.message === 'string' && candidate.message.trim())
      || (typeof candidate.error === 'string' && candidate.error.trim())
      || (typeof candidate.details === 'string' && candidate.details.trim())
      || '';
  }

  private safeText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }
}
