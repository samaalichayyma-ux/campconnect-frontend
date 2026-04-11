import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReclamationNotification {
  id: number;
  message: string;
  read: boolean;
  dateCreation: string;
  statut?: string;
}

export interface ReclamationUnreadCount {
  unreadCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReclamationNotificationService {

  private readonly apiUrl =
    'http://localhost:8082/api/reclamation-notifications';

  constructor(private http: HttpClient) {}

  // 📌 notifications utilisateur connecté
  getMyNotifications(): Observable<ReclamationNotification[]> {
    return this.http.get<ReclamationNotification[]>(
      `${this.apiUrl}/me`
    );
  }

  // 📌 compteur non lus
  getUnreadCount(): Observable<ReclamationUnreadCount> {
    return this.http.get<ReclamationUnreadCount>(
      `${this.apiUrl}/me/unread-count`
    );
  }

  // 📌 marquer une notification comme lue
  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${id}/read`,
      {}
    );
  }

  // 📌 tout marquer comme lu
  markAllAsRead(): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/me/mark-all-read`,
      {}
    );
  }
}