import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotificationUser } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = 'http://localhost:8082/api/users/me/notifications';

  constructor(private http: HttpClient) {}

  getMyNotifications(): Observable<NotificationUser[]> {
    return this.http.get<NotificationUser[]>(this.baseUrl);
  }

  markAsRead(id: number): Observable<NotificationUser> {
    return this.http.put<NotificationUser>(`${this.baseUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/read-all`, {});
  }
}