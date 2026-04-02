import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProduitService {

   private http = inject(HttpClient);

  private apiUrl = 'http://localhost:8082/api/produits';

 getProduitsPourUser(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/user`);
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }
}
