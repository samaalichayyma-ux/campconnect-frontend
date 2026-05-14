import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReclamationService {

  private apiUrl = 'http://localhost:8082/api/reclamations';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(reclamation: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, reclamation);
  }

  update(id: number, reclamation: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, reclamation);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  changeStatut(id: number, statut: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/statut?statut=${statut}`, {});
  }
}