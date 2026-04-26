import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';

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
  private apiUrl = '/api/commentaires';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getByPublication(publicationId: number): Observable<Commentaire[]> {
    return this.http.get<Commentaire[]>(`${this.apiUrl}/publication/${publicationId}`);
  }

  create(publicationId: number, commentaire: Commentaire): Observable<Commentaire> {
    return this.http.post<Commentaire>(`${this.apiUrl}/publication/${publicationId}`, commentaire);
  }

  update(id: number, commentaire: Commentaire, email = this.authService.getUserEmail()): Observable<Commentaire> {
    return this.http.put<Commentaire>(`${this.apiUrl}/${id}`, {
      ...commentaire,
      auteurEmail: (email || '').trim()
    });
  }

  delete(id: number, email = this.authService.getUserEmail()): Observable<void> {
    const safeEmail = encodeURIComponent((email || '').trim());
    return this.http.delete<void>(`${this.apiUrl}/${id}?auteurEmail=${safeEmail}`);
  }

  like(id: number): Observable<Commentaire> {
    return this.http.put<Commentaire>(`${this.apiUrl}/${id}/like`, {});
  }

}