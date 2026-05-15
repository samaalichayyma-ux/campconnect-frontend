import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ForumService } from '../../forum/services/forum.service';

export interface Commentaire {
  id?: number;
  contenu: string;
  dateCreation?: string;
  likesCount?: number;
  auteurEmail?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommentaireService {
  constructor(
    private forumService: ForumService,
    private authService: AuthService
  ) {}

  getByPublication(publicationId: number): Observable<Commentaire[]> {
    return this.forumService.getCommentaires(publicationId) as Observable<Commentaire[]>;
  }

  create(publicationId: number, commentaire: Commentaire): Observable<Commentaire> {
    const payload = {
      ...commentaire,
      auteurEmail: commentaire.auteurEmail || this.authService.getUserEmail()
    };
    return this.forumService.addCommentaire(publicationId, payload) as Observable<Commentaire>;
  }

  update(id: number, commentaire: Commentaire, email = this.authService.getUserEmail()): Observable<Commentaire> {
    return this.forumService.updateCommentaire(
      id,
      { ...commentaire, auteurEmail: (email || '').trim() },
      (email || '').trim()
    ) as Observable<Commentaire>;
  }

  delete(id: number, email = this.authService.getUserEmail()): Observable<void> {
    return this.forumService.deleteCommentaire(id, (email || '').trim()) as Observable<void>;
  }

  like(id: number): Observable<Commentaire> {
    return this.forumService.likeCommentaire(id) as Observable<Commentaire>;
  }

}
