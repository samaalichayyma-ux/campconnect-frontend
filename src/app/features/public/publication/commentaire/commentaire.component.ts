import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentaireService, Commentaire } from '../services/commentaire.service';

@Component({
  selector: 'app-commentaire',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './commentaire.component.html',
  styleUrls: ['./commentaire.component.css']
})
export class CommentaireComponent implements OnInit {
  @Input() publicationId!: number;

  commentaires: Commentaire[] = [];
  nouveauCommentaire: Commentaire = {
    contenu: ''
  };
  

  editCommentId: number | null = null;
  editContenu = '';

  constructor(private commentaireService: CommentaireService) {}

  ngOnInit(): void {
    if (this.publicationId) {
      this.loadCommentaires();
    }
  }

  loadCommentaires(): void {
    this.commentaireService.getByPublication(this.publicationId).subscribe({
      next: (data: Commentaire[]) => {
        this.commentaires = data;
      },
      error: (err: any) => {
        console.error('Erreur chargement commentaires', err);
      }
    });
  }

  ajouterCommentaire(): void {
    if (!this.nouveauCommentaire.contenu.trim()) return;

    this.commentaireService.create(this.publicationId, this.nouveauCommentaire).subscribe({
      next: () => {
        this.nouveauCommentaire = { contenu: '' };
        this.loadCommentaires();
      },
      error: (err: any) => {
        console.error('Erreur ajout commentaire', err);
      }
    });
  }

  supprimerCommentaire(id: number): void {
    this.commentaireService.delete(id).subscribe({
      next: () => this.loadCommentaires(),
      error: (err: any) => console.error('Erreur suppression commentaire', err)
    });
  }

  likeCommentaire(id: number): void {
    this.commentaireService.like(id).subscribe({
      next: () => this.loadCommentaires(),
      error: (err: any) => console.error('Erreur like commentaire', err)
    });
  }

  startEdit(commentaire: Commentaire): void {
    this.editCommentId = commentaire.id!;
    this.editContenu = commentaire.contenu;
  }

  cancelEdit(): void {
    this.editCommentId = null;
    this.editContenu = '';
  }

  saveEdit(id: number): void {
    const updatedCommentaire: Commentaire = {
      contenu: this.editContenu
    };

    this.commentaireService.update(id, updatedCommentaire).subscribe({
      next: () => {
        this.editCommentId = null;
        this.editContenu = '';
        this.loadCommentaires();
      },
      error: (err: any) => {
        console.error('Erreur modification commentaire', err);
      }
    });
  }
}