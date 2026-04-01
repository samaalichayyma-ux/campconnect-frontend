import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class RepasService {

  private apiUrl = 'http://localhost:8080/api/repas';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  create(repas: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, repas);
  }

  update(id: number, repas: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, repas);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}