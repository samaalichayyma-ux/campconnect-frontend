import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { AdminUser } from '../../features/admin/users/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private readonly primaryApiUrl = 'http://localhost:8082/api/user';
  private readonly fallbackApiUrl = 'http://localhost:8082/api/utilisateurs';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.primaryApiUrl}/getAllUsers`).pipe(
      catchError(() => this.http.get<AdminUser[]>(`${this.fallbackApiUrl}/getAllUsers`))
    );
  }

  getUserById(id: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.primaryApiUrl}/getUser/${id}`).pipe(
      catchError(() => this.http.get<AdminUser>(`${this.fallbackApiUrl}/getUser/${id}`))
    );
  }

  addUser(user: AdminUser): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.primaryApiUrl}/addUser`, user).pipe(
      catchError(() => this.http.post<AdminUser>(`${this.fallbackApiUrl}/addUser`, user))
    );
  }

  updateUser(user: AdminUser): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.primaryApiUrl}/updateUser`, user).pipe(
      catchError(() => this.http.put<AdminUser>(`${this.fallbackApiUrl}/updateUser`, user))
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.primaryApiUrl}/deleteUser/${id}`).pipe(
      catchError(() => this.http.delete<void>(`${this.fallbackApiUrl}/deleteUser/${id}`))
    );
  }
}
