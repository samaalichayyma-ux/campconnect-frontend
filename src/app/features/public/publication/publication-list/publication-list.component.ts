import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { PublicationService } from '../services/publication.service';
import { EngagementService } from '../services/engagement.service';
import { Publication } from '../models/publication';

@Component({
  selector: 'app-publication-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publication-list.component.html',
  styleUrl: './publication-list.component.css'
})
export class PublicationListComponent implements OnInit {
  publications: Publication[] = [];
  currentUserEmail = '';
  isAdmin = false;
  feedbackMessage = '';

  constructor(
    private publicationService: PublicationService,
    private router: Router,
    private authService: AuthService,
    private engagementService: EngagementService
  ) {}

  ngOnInit(): void {
    this.currentUserEmail = this.authService.getUserEmail();
    this.isAdmin = this.authService.isAdmin();
    this.loadPublications();
  }

  loadPublications(): void {
    this.publicationService.getAll().subscribe({
      next: (data) => {
        this.publications = data;
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  like(id?: number): void {
    if (!this.requireSession()) {
      return;
    }

    if (!id) return;
    if (this.engagementService.hasPublicationLike(id, this.currentUserEmail)) {
      this.feedbackMessage = 'Tu as deja aime cette publication.';
      return;
    }

    this.publicationService.like(id).subscribe({
      next: () => {
        this.engagementService.markPublicationLike(id, this.currentUserEmail);
        this.feedbackMessage = '';
        this.loadPublications();
      },
      error: (error) => {
        console.error(error);
        this.feedbackMessage = this.resolveActionError(error, 'Impossible de liker cette publication.');
      }
    });
  }

  deletePublication(publication?: Publication): void {
    if (!this.requireSession()) {
      return;
    }

    if (!publication?.id) return;
    if (!this.canManagePublication(publication)) return;

    const targetAuthorEmail = this.isAdmin
      ? (publication.auteurEmail || this.currentUserEmail)
      : this.currentUserEmail;

    this.publicationService.delete(publication.id, targetAuthorEmail).subscribe({
      next: () => this.loadPublications(),
      error: (error) => {
        console.error(error);
        this.feedbackMessage = this.resolveActionError(error, 'Impossible de supprimer cette publication.');
      }
    });
  }

  canManagePublication(publication: Publication): boolean {
    return this.isAdmin || this.authService.ownsResource(publication.auteurEmail);
  }

  goToEdit(id?: number): void {
    if (!id) return;
    this.router.navigate(['/public/publications/edit', id]);
  }

  goToDetails(publication: Publication): void {
    const publicationId = publication.id;
    if (!publicationId) return;

    this.publicationService.incrementView(publicationId).subscribe({
      next: () => {
        const forumId = Number(publication.forumId || publication.forum?.id);
        if (Number.isFinite(forumId) && forumId > 0) {
          this.router.navigate(['/public/forums', forumId, 'publications']);
          return;
        }
        this.feedbackMessage = 'Forum introuvable pour cette publication.';
      },
      error: (error) => {
        console.error(error);
        this.feedbackMessage = this.resolveActionError(error, 'Impossible d ouvrir cette publication.');
      }
    });
  }

  hasLikedPublication(publication: Publication): boolean {
    return !!publication.id && this.engagementService.hasPublicationLike(publication.id, this.currentUserEmail);
  }

  private requireSession(): boolean {
    if (this.currentUserEmail.trim()) {
      return true;
    }

    this.feedbackMessage = 'Session invalide ou expiree. Reconnecte-toi pour continuer.';
    this.router.navigate(['/login']);
    return false;
  }

  private resolveActionError(error: unknown, fallback: string): string {
    const status = Number((error as { status?: unknown })?.status);
    if (status === 401) {
      return 'Session invalide ou expiree. Reconnecte-toi puis reessaie.';
    }
    if (status === 403) {
      return 'Action interdite: tu peux modifier/supprimer seulement ton propre contenu.';
    }
    if (status === 500) {
      return 'Erreur serveur pendant l action. Reessaie dans quelques secondes.';
    }
    return fallback;
  }
}