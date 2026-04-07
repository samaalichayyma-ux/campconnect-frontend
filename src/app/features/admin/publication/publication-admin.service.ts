import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Publication {
  id?: number;
  contenu: string;
  dateCreation?: string;
  likesCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PublicationAdminService {
  private apiUrl = 'http://localhost:8082/api/admin/publications';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Publication[]> {
    return this.http.get<Publication[]>(this.apiUrl);
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

  like(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/like`, {});
  }
}