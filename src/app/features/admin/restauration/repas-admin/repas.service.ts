import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Repas } from './models/repas.model';

@Injectable({
  providedIn: 'root'
})
export class RepasService {
  private baseUrl = 'http://localhost:8082/api'; // ton backend Spring Boot

  constructor(private http: HttpClient) {}

  // Repas endpoints

  getAllRepas(): Observable<Repas[]> {
    return this.http.get<Repas[]>('${this.baseUrl}/repas');
  }
  addRepas(repas: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/repas`, repas);
  }

  updateRepas(id: number, repas: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/repas/${id}`, repas);
  }

  deleteRepas(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/repas/${id}`);
  }
  getRepasById(id: number): Observable<Repas> {
  return this.http.get<Repas>(`${this.baseUrl}/repas/${id}`);
}
  // Commande endpoints
  getCommandes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/commandes-repas`);
  }

  updateCommandeStatus(id: number, statut: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/commandes-repas/${id}`, { statut });
  }
}