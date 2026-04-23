import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Publication {
  id?: number;
  forumId?: number;
  forum?: {
    id?: number;
    nom?: string;
  };
  titre?: string;
  contenu: string;
  auteurEmail?: string;
  likesCount?: number;
  commentairesCount?: number;
  vuesCount?: number;
  dateCreation?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PublicationAdminService {
  private apiUrl = '/api/admin/publications';

  constructor(private http: HttpClient) {}

 getByForum(forumId: number): Observable<Publication[]> {
  return this.http.get<Publication[]>(`${this.apiUrl}/forum/${forumId}`);
}


  getById(id: number): Observable<Publication> {
    return this.http.get<Publication>(`${this.apiUrl}/${id}`);
  }

  create(publication: Publication): Observable<Publication> {
    return this.http.post<Publication>(this.apiUrl, publication);
  }

  update(id: number, publication: Publication): Observable<Publication> {
    return this.http.put<Publication>(`${this.apiUrl}/${id}`, publication);
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }
    getAll(): Observable<Publication[]> {
    return this.http.get<Publication[]>(this.apiUrl);
  }

  like(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/like`, {});
  }
  
}
