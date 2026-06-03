import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {  ReclamationNotification,  ReclamationUnreadCount} from './models/reclamation-notification.model';

import { Reclamation } from '../../admin/reclamation/models/reclamation.model';

@Injectable({
  providedIn: 'root'
})
export class ReclamationService {


  private apiUrl = 'http://localhost:8082/api/reclamations';
  private notifUrl = 'http://localhost:8082/api/reclamation-notifications';


  constructor(private http: HttpClient) {}

  // ================= CRUD =================

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }


  getMyReclamations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/me`);
  }



  create(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }


  getByUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`);
  }



  update(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // ── Admin ──────────────────────────────────────────────────────────────

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

  // ── Réduction réclamation ──────────────────────────────────────────────

  /** Consomme la réduction d'une réclamation (met reduction_pourcentage à null en base) */
  consommerReduction(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/consommer-reduction`, {});
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