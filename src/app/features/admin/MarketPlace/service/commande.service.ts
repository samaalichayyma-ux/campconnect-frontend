import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Commande } from '../models/commande';

@Injectable({
  providedIn: 'root'
})
export class CommandeService {

  private apiUrl = 'http://localhost:8082/api/commandes';

  constructor(private http: HttpClient) {}

  getAllCommandes(): Observable<Commande[]> {
    return this.http.get<Commande[]>(this.apiUrl);
  }

  updateEtatLivraison(
    idCommande: number,
    etatLivraison: string
  ): Observable<Commande> {

    return this.http.put<Commande>(
      `${this.apiUrl}/${idCommande}/livraison`,
      { etatLivraison }
    );
  }

  telechargerPdfCommandes(): void {
    window.open(`${this.apiUrl}/pdf`, '_blank');
  }

  
}