import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ReclamationUnreadCount } from '../../../public/reclamation/models/reclamation-notification.model';

import { Reclamation } from '../models/reclamation.model';

@Injectable({
  providedIn: 'root'
})
export class ReclamationService {
  private apiUrl = 'http://localhost:8082/api/reclamations';
  private notifUrl = 'http://localhost:8082/api/reclamation-notifications';

  constructor(private http: HttpClient) {}

  getAllReclamations(): Observable<Reclamation[]> {
    return this.http.get<Reclamation[]>(this.apiUrl);
  }

  getReclamationById(id: number): Observable<Reclamation> {
    return this.http.get<Reclamation>(`${this.apiUrl}/${id}`);
  }

  updateReclamation(id: number, reclamation: Reclamation): Observable<Reclamation> {
    return this.http.put<Reclamation>(`${this.apiUrl}/${id}`, reclamation);
  }

  changeStatut(id: number, statut: string, reduction?: number): Observable<Reclamation> {
    let url = `${this.apiUrl}/${id}/statut?statut=${statut}`;
    if (reduction != null) url += `&reduction=${reduction}`;
    return this.http.put<Reclamation>(url, {});
  }

  deleteReclamation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ── Notifications ──────────────────────────────────────────────────────
getUnreadCount(): Observable<ReclamationUnreadCount> {
  return this.http.get<ReclamationUnreadCount>(`${this.notifUrl}/me/unread-count`);
}

  getMyNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.notifUrl}/me`);
  }

  markAsRead(id: number): Observable<any> {
    return this.http.put(`${this.notifUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.notifUrl}/me/read-all`, {});
  }
}