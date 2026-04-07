import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommandeRepas } from './models/commande-repas.model';

@Injectable({
  providedIn: 'root'
})
export class CommandeRepasService {
  private apiUrl = 'http://localhost:8082/commande-repas';

  constructor(private http: HttpClient) {}

  getAllCommandes(): Observable<CommandeRepas[]> {
    return this.http.get<CommandeRepas[]>(this.apiUrl);
  }

  getCommandeById(id: number): Observable<CommandeRepas> {
    return this.http.get<CommandeRepas>(`${this.apiUrl}/${id}`);
  }

  updateCommande(id: number, commande: CommandeRepas): Observable<CommandeRepas> {
    return this.http.put<CommandeRepas>(`${this.apiUrl}/${id}`, commande);
  }

  deleteCommande(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}