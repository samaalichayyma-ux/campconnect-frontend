import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Commentaire {
  id?: number;
  contenu: string;
  dateCreation?: string;
  likesCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CommentaireService {
  private apiUrl = '/api/commentaires';

  constructor(private http: HttpClient) {}

  getByPublication(publicationId: number): Observable<Commentaire[]> {
    return this.http.get<Commentaire[]>(`${this.apiUrl}/publication/${publicationId}`);
  }

  create(publicationId: number, commentaire: Commentaire): Observable<Commentaire> {
    return this.http.post<Commentaire>(`${this.apiUrl}/publication/${publicationId}`, commentaire);
  }

  update(id: number, commentaire: Commentaire): Observable<Commentaire> {
    return this.http.put<Commentaire>(`${this.apiUrl}/${id}`, commentaire);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  like(id: number): Observable<Commentaire> {
    return this.http.put<Commentaire>(`${this.apiUrl}/${id}/like`, {});
  }
}