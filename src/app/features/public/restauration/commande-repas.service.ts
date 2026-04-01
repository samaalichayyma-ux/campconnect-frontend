import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class CommandeRepasService {

  private apiUrl = 'http://localhost:8080/api/commandes-repas';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  create(commande: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, commande);
  }

  ajouterLigne(commandeId: number, repasId: number, quantite: number): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${commandeId}/lignes?repasId=${repasId}&quantite=${quantite}`,
      {}
    );
  }

  changeStatut(commandeId: number, statut: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${commandeId}/statut?statut=${statut}`,
      {}
    );
  }
}