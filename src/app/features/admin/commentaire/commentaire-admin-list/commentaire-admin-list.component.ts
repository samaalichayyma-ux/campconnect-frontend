import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ForumService, Publication } from '../../../public/forum/services/forum.service';

interface AdminCommentView {
  id: number;
  contenu: string;
  auteurEmail?: string;
  auteurNom?: string;
  dateCreation?: string;
  likesCount?: number;
  publicationId: number;
  publicationTitre: string;
}

@Component({
  selector: 'app-commentaire-admin-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './commentaire-admin-list.component.html',
  styleUrl: './commentaire-admin-list.component.css'
})
export class CommentaireAdminListComponent implements OnInit {
  loading = false;
  error = '';

  commentaires: AdminCommentView[] = [];
  filteredCommentaires: AdminCommentView[] = [];

  searchTerm = '';
  selectedPublicationId = 0;

  editId: number | null = null;
  editContenu = '';
  saving = false;

  constructor(private forumService: ForumService) {}

  ngOnInit(): void {
    this.loadCommentaires();
  }

  get publicationsFilter(): Array<{ id: number; titre: string }> {
    const mapByPublication = new Map<number, string>();
    this.commentaires.forEach((commentaire) => {
      mapByPublication.set(commentaire.publicationId, commentaire.publicationTitre);
    });

    return [...mapByPublication.entries()]
      .map(([id, titre]) => ({ id, titre }))
      .sort((a, b) => a.titre.localeCompare(b.titre));
  }

  loadCommentaires(): void {
    this.loading = true;
    this.error = '';

    this.forumService.getAllPublications().subscribe({
      next: (publications) => this.loadCommentsByPublications(publications || []),
      error: (err) => {
        console.error('Erreur chargement publications pour commentaires admin :', err);
        this.error = 'Impossible de charger les publications.';
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    const query = this.searchTerm.trim().toLowerCase();
    this.filteredCommentaires = this.commentaires.filter((commentaire) => {
      const matchesPublication =
        this.selectedPublicationId === 0 || commentaire.publicationId === this.selectedPublicationId;

      const matchesSearch =
        !query ||
        commentaire.contenu.toLowerCase().includes(query) ||
        (commentaire.auteurEmail || '').toLowerCase().includes(query) ||
        commentaire.publicationTitre.toLowerCase().includes(query);

      return matchesPublication && matchesSearch;
    });
  }

  startEdit(commentaire: AdminCommentView): void {
    this.editId = commentaire.id;
    this.editContenu = commentaire.contenu;
  }

  cancelEdit(): void {
    this.editId = null;
    this.editContenu = '';
  }

  saveEdit(commentaire: AdminCommentView): void {
    const contenu = this.editContenu.trim();
    if (!contenu) return;

    this.saving = true;
    this.forumService.updateCommentaire(commentaire.id, { contenu }, commentaire.auteurEmail || '').subscribe({
      next: () => {
        commentaire.contenu = contenu;
        this.saving = false;
        this.cancelEdit();
        this.onFilterChange();
      },
      error: (err) => {
        console.error('Erreur modification commentaire admin :', err);
        this.saving = false;
      }
    });
  }

  deleteComment(commentaire: AdminCommentView): void {
    if (!confirm('Supprimer ce commentaire ?')) return;

    this.forumService.deleteCommentaire(commentaire.id, commentaire.auteurEmail || '').subscribe({
      next: () => {
        this.commentaires = this.commentaires.filter((item) => item.id !== commentaire.id);
        this.onFilterChange();
      },
      error: (err) => {
        console.error('Erreur suppression commentaire admin :', err);
      }
    });
  }

  private loadCommentsByPublications(publications: Publication[]): void {
    const validPublications = publications.filter((publication) => !!publication.id);
    if (validPublications.length === 0) {
      this.commentaires = [];
      this.filteredCommentaires = [];
      this.loading = false;
      return;
    }

    const requests = validPublications.map((publication) =>
      this.forumService.getCommentaires(publication.id!).pipe(
        map((commentaires: any[]) =>
          (commentaires || []).map(
            (commentaire): AdminCommentView => ({
              id: Number(commentaire.id),
              contenu: commentaire.contenu || '',
              auteurEmail: commentaire.auteurEmail,
              auteurNom: commentaire.auteurNom,
              dateCreation: commentaire.dateCreation,
              likesCount: commentaire.likesCount || 0,
              publicationId: publication.id!,
              publicationTitre: publication.titre || `Publication #${publication.id}`
            })
          )
        ),
        catchError((err) => {
          console.error(`Erreur chargement commentaires publication ${publication.id} :`, err);
          return of([]);
        })
      )
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        this.commentaires = results
          .flat()
          .sort((a, b) => new Date(b.dateCreation || '').getTime() - new Date(a.dateCreation || '').getTime());
        this.onFilterChange();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur agrégation commentaires admin :', err);
        this.error = 'Impossible de charger les commentaires.';
        this.loading = false;
      }
    });
  }
}
