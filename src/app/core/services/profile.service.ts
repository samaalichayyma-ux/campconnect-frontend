import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CurrentUser } from '../../features/public/profile/models/current-user.model';
import { Profile } from '../../features/public/profile/models/profile.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private baseUrl  = 'http://localhost:8082/api';

 
  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.baseUrl}/auth/me`);
  }

  getMyProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${this.baseUrl}/profile/me`);
  }

  updateMyProfile(profile: Profile): Observable<Profile> {
    return this.http.put<Profile>(`${this.baseUrl}/profile/me`, profile);
  }
}