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
  // If your backend has no /api prefix, use:
  // private readonly apiUrl = 'http://localhost:8089/livraisons';

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
}