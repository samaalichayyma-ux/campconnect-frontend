import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Forum, ForumService } from '../../forum/services/forum.service';
import { Publication } from '../models/publication';
import { AiService } from '../services/ai.service';
import { PublicationService } from '../services/publication.service';

@Component({
  selector: 'app-publication-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publication-create.component.html',
  styleUrl: './publication-create.component.css'
})
export class PublicationCreateComponent implements OnInit {
  titre = '';
  contenu = '';
  theme = '';

  forums: Forum[] = [];
  selectedForumId: number | null = null;

  successMessage = '';
  errorMessage = '';
  aiLoading = false;
  aiError = '';

  constructor(
    private publicationService: PublicationService,
    private forumService: ForumService,
    private aiService: AiService
  ) {}

  ngOnInit(): void {
    this.loadForums();
  }

  private loadForums(): void {
    this.forumService.getAll().subscribe({
      next: (forums) => {
        this.forums = forums || [];
        if (!this.selectedForumId && this.forums.length > 0 && this.forums[0].id) {
          this.selectedForumId = this.forums[0].id;
        }
      },
      error: (err) => {
        console.error('Erreur chargement forums pour creation publication :', err);
        this.errorMessage = 'Impossible de charger la liste des forums.';
      }
    });
  }

  suggestWithAI(): void {
    const titleHint = this.titre.trim();
    const themeHint = this.theme.trim();
    const source = titleHint || themeHint;
    if (!source) {
      this.aiError = 'Veuillez saisir un titre ou un theme pour obtenir une suggestion.';
      return;
    }

    this.aiError = '';
    this.aiLoading = true;
    const selectedForumName = this.forums.find((forum) => forum.id === this.selectedForumId)?.nom || '';

    this.aiService.suggestContent(source, selectedForumName, titleHint).subscribe({
      next: (suggestion) => {
        this.aiLoading = false;
        if (suggestion) {
          this.contenu = suggestion;
        } else {
          this.aiError = 'Aucune suggestion disponible.';
        }
      },
      error: () => {
        this.aiLoading = false;
        this.aiError = 'Erreur lors de la generation IA.';
      }
    });
  }

  improveWithAI(): void {
    if (!this.contenu.trim()) {
      this.aiError = 'Ecrivez d abord du contenu avant amelioration.';
      return;
    }

    this.aiError = '';
    this.aiLoading = true;

    this.aiService.improveContent(this.contenu).subscribe({
      next: (improved) => {
        this.aiLoading = false;
        if (improved) {
          this.contenu = improved;
        } else {
          this.aiError = 'Impossible d ameliorer le texte.';
        }
      },
      error: () => {
        this.aiLoading = false;
        this.aiError = 'Erreur lors de l amelioration IA.';
      }
    });
  }

  create(): void {
    this.successMessage = '';
    this.errorMessage = '';

    const title = this.normalizeForBackend(this.getNormalizedTitle());
    const content = this.normalizeForBackend(this.contenu.trim());
    if (!content) {
      this.errorMessage = 'Le contenu est obligatoire.';
      return;
    }

    if (!this.selectedForumId) {
      this.errorMessage = 'Choisissez un forum avant de publier.';
      return;
    }

    const publication: Publication = {
      titre: title,
      contenu: content,
      forumId: this.selectedForumId,
      forum: { id: this.selectedForumId }
    };

    this.publicationService.create(publication).subscribe({
      next: () => {
        this.successMessage = 'Publication ajoutee avec succes.';
        this.titre = '';
        this.contenu = '';
        this.theme = '';
      },
      error: (error) => {
        console.error('Erreur creation publication :', error);
        const backendMessage = this.extractBackendMessage(error);
        this.errorMessage = backendMessage || 'Impossible de creer la publication.';
      }
    });
  }

  private getNormalizedTitle(): string {
    const candidate = (this.titre || this.theme || this.contenu).trim().replace(/\s+/g, ' ');
    if (!candidate) {
      return 'Nouvelle publication';
    }

    return candidate.length > 60 ? candidate.slice(0, 60).trim() : candidate;
  }

  private normalizeForBackend(value: string): string {
    if (!value) {
      return '';
    }

    return value
      .normalize('NFC')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
      .replace(/[\u{10000}-\u{10FFFF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractBackendMessage(error: unknown): string {
    const payload = (error as { error?: unknown })?.error;
    if (typeof payload === 'string' && payload.trim()) {
      try {
        const parsed = JSON.parse(payload) as { message?: string };
        if (typeof parsed?.message === 'string' && parsed.message.trim()) {
          return parsed.message.trim();
        }
      } catch {
        return payload.trim();
      }
    }

    const message = (payload as { message?: unknown } | undefined)?.message;
    return typeof message === 'string' ? message.trim() : '';
  }
}
