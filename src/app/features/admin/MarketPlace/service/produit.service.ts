import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProduitService {

  private apiUrl = 'http://localhost:8082/api/produits';

  constructor(private http: HttpClient) {}

ajouterProduit(formData: FormData) {
  return this.http.post(`${this.apiUrl}`, formData);
}
  getAllProduits(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getProduitById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  deactivateProduit(id: number) {
    return this.http.put(`${this.apiUrl}/${id}/deactivate`, {}, {
      responseType: 'text'
    });
  }

  activateProduit(id: number) {
    return this.http.put(`${this.apiUrl}/${id}/activate`, {}, {
      responseType: 'text'
    });
  }

deleteProduit(id: number) {
  return this.http.delete(`${this.apiUrl}/${id}`, {
    responseType: 'text'
  });
}


updateProduit(id: number, produit: Product) {
  return this.http.put(`${this.apiUrl}/${id}`, produit);
}

}