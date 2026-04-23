import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TimeAgoPipe } from '../../../../core/pipes/time-ago.pipe';
import { AuthService } from '../../../../core/services/auth.service';
import { AiService, AiTextQuality } from '../../publication/services/ai.service';
import { EngagementService } from '../../publication/services/engagement.service';
import { CommentaireService, Commentaire } from '../services/commentaire.service';

type CommentSort = 'recent' | 'popular';
type CommentTone = 'friendly' | 'curious' | 'expert';

@Component({
  selector: 'app-commentaire',
  standalone: true,
  imports: [CommonModule, FormsModule, TimeAgoPipe],
  templateUrl: './commentaire.component.html',
  styleUrls: ['./commentaire.component.css']
})
export class CommentaireComponent implements OnInit {
  @Input() publicationId!: number;

  commentaires: Commentaire[] = [];
  nouveauCommentaire: Commentaire = {
    contenu: ''
  };

  errorMessage = '';
  successMessage = '';

  editCommentId: number | null = null;
  editContenu = '';

  currentUserEmail = '';
  isAdmin = false;

  sortMode: CommentSort = 'recent';
  commentTone: CommentTone = 'friendly';

  aiSuggestLoading = false;
  aiImproveLoading = false;
  aiAnalyzeLoading = false;
  draftQuality?: AiTextQuality;

  constructor(
    private commentaireService: CommentaireService,
    private aiService: AiService,
    private authService: AuthService,
    private engagementService: EngagementService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.refreshSessionContext();

    if (this.publicationId) {
      this.loadCommentaires();
    }
  }

  get displayedCommentaires(): Commentaire[] {
    const list = [...this.commentaires];
    if (this.sortMode === 'popular') {
      return list.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    }

    return list.sort((a, b) => {
      const left = new Date(b.dateCreation || '').getTime();
      const right = new Date(a.dateCreation || '').getTime();
      return left - right;
    });
  }

  setSortMode(mode: CommentSort): void {
    this.sortMode = mode;
  }

  loadCommentaires(): void {
    this.commentaireService.getByPublication(this.publicationId).subscribe({
      next: (data: Commentaire[]) => {
        this.commentaires = data;
      },
      error: (err: unknown) => {
        console.error('Erreur chargement commentaires', err);
      }
    });
  }

  suggestWithAI(): void {
    this.errorMessage = '';
    const seed = this.commentaires[0]?.contenu || 'Discussion camping';
    const existingDraft = this.nouveauCommentaire.contenu.trim();

    this.aiSuggestLoading = true;
    const request$ = existingDraft
      ? this.aiService.improveCommentText(existingDraft, this.commentTone)
      : this.aiService.suggestCommentForPublication('Publication', seed, this.commentTone);

    request$.subscribe({
      next: (result) => {
        this.aiSuggestLoading = false;
        this.nouveauCommentaire.contenu = result;
      },
      error: () => {
        this.aiSuggestLoading = false;
        this.errorMessage = 'Impossible de corriger/generer une suggestion IA.';
      }
    });
  }

  improveWithAI(): void {
    this.errorMessage = '';
    if (!this.nouveauCommentaire.contenu.trim()) {
      this.errorMessage = 'Ecris un commentaire avant l amelioration IA.';
      return;
    }

    this.aiImproveLoading = true;
    this.aiService.improveCommentText(this.nouveauCommentaire.contenu, this.commentTone).subscribe({
      next: (result) => {
        this.aiImproveLoading = false;
        if (result) {
          this.nouveauCommentaire.contenu = result;
        }
      },
      error: () => {
        this.aiImproveLoading = false;
        this.errorMessage = 'Impossible d ameliorer ce commentaire.';
      }
    });
  }

  analyzeDraftWithAI(): void {
    this.errorMessage = '';
    if (!this.nouveauCommentaire.contenu.trim()) {
      this.errorMessage = 'Ecris un commentaire avant l analyse IA.';
      return;
    }

    this.aiAnalyzeLoading = true;
    this.aiService.analyzeTextQuality(this.nouveauCommentaire.contenu).subscribe({
      next: (quality) => {
        this.aiAnalyzeLoading = false;
        this.draftQuality = quality;
      },
      error: () => {
        this.aiAnalyzeLoading = false;
        this.errorMessage = 'Erreur pendant l analyse IA.';
      }
    });
  }

  replyToComment(commentaire: Commentaire): void {
    if (!commentaire.contenu?.trim()) return;

    this.errorMessage = '';
    this.aiSuggestLoading = true;

    this.aiService.suggestCommentForPublication('Reponse', commentaire.contenu, this.commentTone).subscribe({
      next: (result) => {
        this.aiSuggestLoading = false;
        this.nouveauCommentaire.contenu = result;
      },
      error: () => {
        this.aiSuggestLoading = false;
        this.errorMessage = 'Impossible de preparer une reponse IA.';
      }
    });
  }

  ajouterCommentaire(): void {
    if (!this.requireSession()) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const content = this.nouveauCommentaire.contenu.trim();
    if (!content) {
      this.errorMessage = 'Le commentaire ne peut pas etre vide.';
      return;
    }

    if (content.length < 3) {
      this.errorMessage = 'Le commentaire est trop court.';
      return;
    }

    const duplicate = this.commentaires.some(
      (c) =>
        (c.auteurEmail || '').trim().toLowerCase() === this.currentUserEmail.trim().toLowerCase() &&
        c.contenu.trim().toLowerCase() === content.toLowerCase()
    );

    if (duplicate) {
      this.errorMessage = 'Tu as deja publie ce commentaire.';
      return;
    }

    this.aiService.moderateComment(content).subscribe({
      next: (approved) => {
        if (!approved) {
          this.errorMessage = 'Votre commentaire semble inapproprie. Reformulez-le.';
          return;
        }

        const commentaireToSend: Commentaire = {
          contenu: content,
          auteurEmail: this.currentUserEmail
        };

        this.commentaireService.create(this.publicationId, commentaireToSend).subscribe({
          next: () => {
            this.nouveauCommentaire = { contenu: '' };
            this.draftQuality = undefined;
            this.successMessage = 'Commentaire publie.';
            this.loadCommentaires();
          },
          error: (err: unknown) => {
            if (this.isParsingErrorWithSuccessStatus(err)) {
              this.nouveauCommentaire = { contenu: '' };
              this.draftQuality = undefined;
              this.successMessage = 'Commentaire publie.';
              this.loadCommentaires();
              return;
            }

            console.error('Erreur ajout commentaire', err);
            this.errorMessage = this.resolveActionError(err, 'Erreur lors de l envoi du commentaire.');
          }
        });
      },
      error: (err: unknown) => {
        console.error('Erreur moderation commentaire', err);
        this.errorMessage = 'Erreur de moderation. Reessayez plus tard.';
      }
    });
  }

  supprimerCommentaire(commentaire: Commentaire): void {
    if (!this.requireSession()) {
      return;
    }

    if (!commentaire.id) {
      return;
    }
    if (!this.canManageCommentaire(commentaire)) {
      return;
    }

    const targetAuthorEmail = this.isAdmin
      ? (commentaire.auteurEmail || this.currentUserEmail)
      : this.currentUserEmail;

    this.commentaireService.delete(commentaire.id, targetAuthorEmail).subscribe({
      next: () => this.loadCommentaires(),
      error: (err: unknown) => {
        console.error('Erreur suppression commentaire', err);
        this.errorMessage = this.resolveActionError(err, 'Impossible de supprimer ce commentaire.');
      }
    });
  }

  canManageCommentaire(commentaire: Commentaire): boolean {
    return this.isAdmin || this.authService.ownsResource(commentaire.auteurEmail);
  }

  likeCommentaire(id: number): void {
    if (!this.requireSession()) {
      return;
    }

    if (this.engagementService.hasCommentLike(id, this.currentUserEmail)) {
      this.errorMessage = 'Tu as deja like ce commentaire.';
      return;
    }

    this.commentaireService.like(id).subscribe({
      next: () => {
        this.engagementService.markCommentLike(id, this.currentUserEmail);
        this.loadCommentaires();
      },
      error: (err: unknown) => {
        if (this.isParsingErrorWithSuccessStatus(err)) {
          this.engagementService.markCommentLike(id, this.currentUserEmail);
          this.loadCommentaires();
          return;
        }

        console.error('Erreur like commentaire', err);
        this.errorMessage = this.resolveActionError(err, 'Erreur lors du like du commentaire.');
      }
    });
  }

  hasLikedCommentaire(commentaire: Commentaire): boolean {
    return !!commentaire.id && this.engagementService.hasCommentLike(commentaire.id, this.currentUserEmail);
  }

  startEdit(commentaire: Commentaire): void {
    if (!this.canManageCommentaire(commentaire)) return;
    this.editCommentId = commentaire.id!;
    this.editContenu = commentaire.contenu;
  }

  cancelEdit(): void {
    this.editCommentId = null;
    this.editContenu = '';
  }

  saveEdit(id: number, authorEmail = this.currentUserEmail): void {
    const content = this.editContenu.trim();
    if (!content) {
      this.errorMessage = 'Le commentaire modifie ne peut pas etre vide.';
      return;
    }

    this.aiService.moderateComment(content).subscribe({
      next: (approved) => {
        if (!approved) {
          this.errorMessage = 'La modification est refusee par la moderation IA.';
          return;
        }

        const updatedCommentaire: Commentaire = {
          contenu: content
        };

        const targetAuthorEmail = this.isAdmin ? (authorEmail || this.currentUserEmail) : this.currentUserEmail;

        this.commentaireService.update(id, updatedCommentaire, targetAuthorEmail).subscribe({
          next: () => {
            this.editCommentId = null;
            this.editContenu = '';
            this.loadCommentaires();
          },
          error: (err: unknown) => {
            console.error('Erreur modification commentaire', err);
            this.errorMessage = this.resolveActionError(err, 'Erreur pendant la modification du commentaire.');
          }
        });
      },
      error: () => {
        this.errorMessage = 'Erreur de moderation pendant la modification.';
      }
    });
  }

  private requireSession(): boolean {
    this.refreshSessionContext();
    if (this.authService.isLoggedIn()) {
      return true;
    }

    this.errorMessage = 'Session invalide ou expiree. Reconnecte-toi pour continuer.';
    this.router.navigate(['/login']);
    return false;
  }

  private resolveActionError(error: unknown, fallback: string): string {
    const status = Number((error as { status?: unknown })?.status);
    if (status === 0) {
      return 'Backend inaccessible. Verifie que le serveur Spring tourne sur le bon port.';
    }
    if (status === 400) {
      return 'Donnees invalides envoyees au backend. Verifie ton commentaire et reessaie.';
    }
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

  private isParsingErrorWithSuccessStatus(error: unknown): boolean {
    const status = Number((error as { status?: unknown })?.status);
    return status === 200;
  }

  private refreshSessionContext(): void {
    this.currentUserEmail = this.authService.getUserEmail();
    this.isAdmin = this.authService.isAdmin();
  }
}
