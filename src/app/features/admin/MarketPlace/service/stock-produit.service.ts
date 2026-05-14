import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StockProduitService {

  private apiUrl = 'http://localhost:8082/api/stocks';

  constructor(private http: HttpClient) {}

  getStockByProduit(idProduit: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/produit/${idProduit}`);
  }

  modifierStock(id: number, stock: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, stock);
  }

  getProduitById(idProduit: number) {
  return this.http.get<any>(
    `http://localhost:8082/api/produits/${idProduit}`
  );
}

modifierStockGlobal(idProduit: number, stock: number) {
  return this.http.put<any>(
    `http://localhost:8082/api/produits/${idProduit}/stock`,
    { stock: stock }
  );
}
}