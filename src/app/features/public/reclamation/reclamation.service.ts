import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ReclamationNotification,
  ReclamationUnreadCount
} from './models/reclamation-notification.model';

@Injectable({
  providedIn: 'root'
})
export class ReclamationService {

  private readonly apiUrl = 'http://localhost:8082/api/reclamations';

  constructor(private http: HttpClient) {}

  // ================= CRUD =================

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getByUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`);
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  update(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  changeStatut(id: number, statut: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${id}/statut?statut=${statut}`,
      {}
    );
  }
getMyReclamations(): Observable<any[]> {
  return this.http.get<any[]>(
    `${this.apiUrl}/me`
  );
}
  // ================= NOTIFICATIONS =================

  getMyNotifications(): Observable<ReclamationNotification[]> {
    return this.http.get<ReclamationNotification[]>(
      `${this.apiUrl}/notifications/me`
    );
  }

  getUnreadCount(): Observable<ReclamationUnreadCount> {
    return this.http.get<ReclamationUnreadCount>(
      `${this.apiUrl}/notifications/me/unread-count`
    );
  }

  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/notifications/${id}/read`,
      {}
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/notifications/me/read-all`,
      {}
    );
  }
}