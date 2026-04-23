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
    if (!this.theme.trim()) {
      this.aiError = 'Veuillez saisir un theme pour obtenir une suggestion.';
      return;
    }

    this.aiError = '';
    this.aiLoading = true;

    this.aiService.suggestContent(this.theme).subscribe({
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

    const content = this.contenu.trim();
    if (!content) {
      this.errorMessage = 'Le contenu est obligatoire.';
      return;
    }

    if (!this.selectedForumId) {
      this.errorMessage = 'Choisissez un forum avant de publier.';
      return;
    }

    const publication: Publication = {
      titre: this.getNormalizedTitle(),
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
        this.errorMessage = 'Impossible de creer la publication.';
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
}
