import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminUser } from '../../features/admin/users/models/user.model';


@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private apiUrl = 'http://localhost:8082/api/user';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/getAllUsers`);
  }

  getUserById(id: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiUrl}/getUser/${id}`);
  }

  addUser(user: AdminUser): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.apiUrl}/addUser`, user);
  }

  updateUser(user: AdminUser): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.apiUrl}/updateUser`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deleteUser/${id}`);
  }
}