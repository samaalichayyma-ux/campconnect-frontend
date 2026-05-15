import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { Publication } from '../models/publication';
import { PublicationService } from '../services/publication.service';

@Component({
  selector: 'app-publication-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publication-edit.component.html',
  styleUrl: './publication-edit.component.css'
})
export class PublicationEditComponent implements OnInit {
  readonly maxTitleLength = 150;
  readonly maxContentLength = 255;

  publicationId = 0;
  canEdit = false;

  publication: Publication = {
    contenu: '',
    titre: ''
  };

  successMessage = '';
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private publicationService: PublicationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.publicationId = Number(this.route.snapshot.paramMap.get('id'));

    if (!this.publicationId || Number.isNaN(this.publicationId)) {
      this.errorMessage = 'Publication invalide.';
      return;
    }

    this.loadPublication(this.publicationId);
  }

  loadPublication(id: number): void {
    this.publicationService.getById(id).subscribe({
      next: (data) => {
        this.publication = data;
        this.canEdit = this.authService.isAdmin() || this.authService.ownsResource(data.auteurEmail);

        if (!this.canEdit) {
          this.errorMessage = 'Vous ne pouvez modifier que vos publications.';
        }
      },
      error: (err) => {
        console.error('Erreur chargement publication :', err);
        this.errorMessage = 'Erreur chargement publication.';
      }
    });
  }

  update(): void {
    if (!this.canEdit) {
      this.errorMessage = 'Action non autorisee.';
      return;
    }

    const titre = (this.publication.titre || '').trim();
    const contenu = this.publication.contenu.trim();

    if (!titre || !contenu) {
      this.errorMessage = 'Titre et contenu sont obligatoires.';
      return;
    }
    if (titre.length > this.maxTitleLength) {
      this.errorMessage = `Le titre depasse ${this.maxTitleLength} caracteres.`;
      return;
    }
    if (contenu.length > this.maxContentLength) {
      this.errorMessage = `Le contenu depasse ${this.maxContentLength} caracteres.`;
      return;
    }

    this.publicationService.update(this.publicationId, { ...this.publication, titre, contenu }).subscribe({
      next: () => {
        this.successMessage = 'Modifie avec succes.';
        setTimeout(() => this.router.navigate(['/public/publications']), 700);
      },
      error: (err) => {
        console.error('Erreur modification publication :', err);
        this.errorMessage = this.resolveActionError(err);
      }
    });
  }

  private resolveActionError(error: unknown): string {
    const status = Number((error as { status?: unknown })?.status);
    const backendError = (error as { error?: unknown })?.error;
    const backendText = typeof backendError === 'string' ? backendError : '';

    if (status === 0) {
      return 'Backend inaccessible. Verifie que le serveur tourne.';
    }
    if (status === 401) {
      return 'Session expiree. Reconnecte-toi.';
    }
    if (status === 403) {
      return 'Tu peux modifier seulement ta propre publication.';
    }
    if (/data too long for column\s+'contenu'/i.test(backendText)) {
      return `Le contenu est trop long (max ${this.maxContentLength} caracteres).`;
    }
    if (/data too long for column\s+'titre'/i.test(backendText)) {
      return `Le titre est trop long (max ${this.maxTitleLength} caracteres).`;
    }
    return 'Erreur modification publication.';
  }
}
