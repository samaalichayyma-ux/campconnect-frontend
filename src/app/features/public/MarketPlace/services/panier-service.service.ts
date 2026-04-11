import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreatePanierResponse {
  message: string;
  idPanier: number;
}

@Injectable({
  providedIn: 'root'
})
export class PanierServiceService {
  private panierUrl = 'http://localhost:8082/api/paniers';
  private detailPanierUrl = 'http://localhost:8082/api/detail-panier';

  constructor(private http: HttpClient) {}

  creerPanier(payload: {
    dateCreation: string;
    etat: string;
    utilisateur: { id: number };
  }): Observable<CreatePanierResponse> {
    return this.http.post<CreatePanierResponse>(this.panierUrl, payload);
  }

  ajouterDetailPanier(payload: any): Observable<string> {
    return this.http.post(this.detailPanierUrl, payload, {
      responseType: 'text'
    });
  }

  getOrCreatePanierEnCours(userId: number) {
    return this.http.get<any>(`${this.panierUrl}/${userId}/en-cours`);
  }

  getDetailsByPanier(idPanier: number) {
    return this.http.get<any[]>(`${this.detailPanierUrl}/panier/${idPanier}`);
  }

  viderPanierEnCours(userId: number) {
    return this.http.delete(
      `${this.panierUrl}/utilisateur/${userId}/vider-en-cours`,
      { responseType: 'text' }
    );
  }

  updateDetailPanier(id: number, payload: any) {
  return this.http.put(`${this.detailPanierUrl}/${id}`, payload, {
    responseType: 'text'
  });
}

deleteDetailPanier(id: number) {
  return this.http.delete(`${this.detailPanierUrl}/${id}`, {
    responseType: 'text'
  });
}
}