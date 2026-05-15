import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MarketplaceStatService {

  private apiUrl = 'http://localhost:8082/api/marketplace/stats';

  constructor(private http: HttpClient) {}

  getStatsProduits(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/produits`);
  }

  getResume(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/resume`);
  }

  getMeilleurProduit(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/meilleur-produit`);
  }
}