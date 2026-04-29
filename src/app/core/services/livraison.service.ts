import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  LivraisonCreateRequest,
  LivraisonResponse,
  LivraisonStatusUpdateRequest,
  AssignLivreurRequest,
  LivraisonStatsResponse,
  AvailableOrderForLivraisonResponse,
  LivreurResponse
} from '../../models/livraison.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LivraisonService {
  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8082/api/livraisons';

  createLivraison(payload: LivraisonCreateRequest): Observable<LivraisonResponse> {
    return this.http.post<LivraisonResponse>(this.apiUrl, payload);
  }

  getAllLivraisons(): Observable<LivraisonResponse[]> {
    return this.http.get<LivraisonResponse[]>(this.apiUrl);
  }

  getMyLivraisons(): Observable<LivraisonResponse[]> {
    return this.http.get<LivraisonResponse[]>(`${this.apiUrl}/mine`);
  }

  getMyStats(): Observable<LivraisonStatsResponse> {
    return this.http.get<LivraisonStatsResponse>(`${this.apiUrl}/mine/stats`);
  }

  assignLivreur(
    idLivraison: number,
    payload: AssignLivreurRequest
  ): Observable<LivraisonResponse> {
    return this.http.patch<LivraisonResponse>(
      `${this.apiUrl}/${idLivraison}/assign-livreur`,
      payload
    );
  }

  updateStatus(
    idLivraison: number,
    payload: LivraisonStatusUpdateRequest
  ): Observable<LivraisonResponse> {
    return this.http.patch<LivraisonResponse>(
      `${this.apiUrl}/${idLivraison}/status`,
      payload
    );
  }

  getAvailableClassicOrders(): Observable<AvailableOrderForLivraisonResponse[]> {
    return this.http.get<AvailableOrderForLivraisonResponse[]>(
      `${this.apiUrl}/orders/classique/available`
    );
  }

  getAvailableRepasOrders(): Observable<AvailableOrderForLivraisonResponse[]> {
    return this.http.get<AvailableOrderForLivraisonResponse[]>(
      `${this.apiUrl}/orders/repas/available`
    );
  }

  getLivreurs(): Observable<LivreurResponse[]> {
  return this.http.get<LivreurResponse[]>(`${this.apiUrl}/livreurs`);
}


// checkout(payload: any) {
//   return this.http.post<any>(
//     '${this.apiUrl}/livraisons/demo/checkout',
//     payload
//   );
// }



  getDemoProducts() {
    return this.http.get<any[]>(`${this.apiUrl}/demo/products`);
  }

  getDemoRepas() {
    return this.http.get<any[]>(`${this.apiUrl}/demo/repas`);
  }

  //  create order
  checkoutClassic(payload: any) {
    return this.http.post<any>(
      `${this.apiUrl}/demo/checkout/classique`,
      payload
    );
  }

  checkoutRepas(payload: any) {
    return this.http.post<any>(
      `${this.apiUrl}/demo/checkout/repas`,
      payload
    );
  }

  //  Stripe session
  createDemoPaymentSession(payload: any) {
    return this.http.post<any>(
      `${this.apiUrl}/demo/payment/create-session`,
      payload
    );
  }

  //  success
  confirmStripePayment(sessionId: string) {
    return this.http.get<LivraisonResponse>(
      `${this.apiUrl}/demo/payment/success?session_id=${sessionId}`
    );
  }

  getAddressSuggestions(query: string) {
  return this.http.get<any[]>(
    `${this.apiUrl}/demo/address-suggestions`,
    {
      params: { query }
    }
  );
}

updateLivreurLocation(idLivraison: number, payload: any) {
  return this.http.patch(
    `${this.apiUrl}/${idLivraison}/livreur-location`,
    payload
  );
}

  getMyClientLivraisons() {
  return this.http.get<any[]>(`${this.apiUrl}/client/mine`);
}

getLivraisonById(id: number) {
  return this.http.get<any>(`${this.apiUrl}/${id}`);
}

getLivreurLocation(id: number) {
  return this.http.get<any>(`${this.apiUrl}/${id}/livreur-location`);
}


getLivreurTipHistory(idLivraison: number) {
  return this.http.get<any[]>(
    `${this.apiUrl}/${idLivraison}/tips`
  );
}

getMyLivreurWallet() {
  return this.http.get<any>(`${this.apiUrl}/livreur/wallet`);
}

getMyLivreurTips() {
  return this.http.get<any[]>(`${this.apiUrl}/livreur/tips`);
}

createTipPaymentSession(idLivraison: number, payload: any) {
  return this.http.post<any>(
    `${this.apiUrl}/${idLivraison}/tip/create-session`,
    payload
  );
}

confirmTipPayment(sessionId: string) {
  return this.http.get(
    `${this.apiUrl}/tip/success?session_id=${sessionId}`,
    { responseType: 'text' }
  );
}

}