import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PublicationAdminService } from '../publication-admin.service';

@Component({
  selector: 'app-publication-admin-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publication-admin-edit.component.html',
  styleUrl: './publication-admin-edit.component.css'
})
export class PublicationAdminEditComponent {
  readonly maxTitleLength = 150;
  readonly maxContentLength = 255;

  publication: any = {};
  errorMessage = '';
  successMessage = '';
  saving = false;

  constructor(
    private route: ActivatedRoute,
    private publicationService: PublicationAdminService
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPublication(+id);
    }
  }

  loadPublication(id: number): void {
    this.errorMessage = '';
    this.publicationService.getById(id).subscribe({
      next: (data) => {
        this.publication = data;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Impossible de charger la publication.';
      }
    });
  }

  update(): void {
    const id = Number(this.publication?.id);
    if (!Number.isFinite(id) || id <= 0) {
      this.errorMessage = 'Identifiant publication invalide.';
      return;
    }

    const titre = String(this.publication?.titre || '').trim();
    const contenu = String(this.publication?.contenu || '').trim();
    if (titre.length < 5) {
      this.errorMessage = 'Le titre doit contenir au moins 5 caracteres.';
      return;
    }
    if (titre.length > this.maxTitleLength) {
      this.errorMessage = `Le titre depasse ${this.maxTitleLength} caracteres.`;
      return;
    }
    if (contenu.length < 30) {
      this.errorMessage = 'Le contenu doit contenir au moins 30 caracteres.';
      return;
    }
    if (contenu.length > this.maxContentLength) {
      this.errorMessage = `Le contenu depasse ${this.maxContentLength} caracteres.`;
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.saving = true;

    const payload = {
      ...this.publication,
      titre,
      contenu
    };

    this.publicationService.update(id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = 'Publication modifiee avec succes.';
      },
      error: (error) => {
        this.saving = false;
        console.error(error);
        this.errorMessage = this.resolveError(error);
      }
    });
  }

  private resolveError(error: unknown): string {
    const status = Number((error as { status?: unknown })?.status);
    const backendError = (error as { error?: unknown })?.error;
    const backendText = typeof backendError === 'string' ? backendError : '';

    if (status === 0) {
      return 'Backend inaccessible. Verifie le serveur.';
    }
    if (status === 401) {
      return 'Session expiree. Reconnecte-toi.';
    }
    if (status === 403) {
      return 'Action interdite.';
    }
    if (/data too long for column\s+'contenu'/i.test(backendText)) {
      return `Le contenu est trop long (max ${this.maxContentLength} caracteres).`;
    }
    if (/data too long for column\s+'titre'/i.test(backendText)) {
      return `Le titre est trop long (max ${this.maxTitleLength} caracteres).`;
    }
    return 'Echec de modification de publication.';
  }
}
