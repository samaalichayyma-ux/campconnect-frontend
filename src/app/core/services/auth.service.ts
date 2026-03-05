import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  login(token: string) {
    localStorage.setItem('token', token);
  }

  logout() {
    localStorage.removeItem('token');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getRole(): string {
    return localStorage.getItem('role') || '';
  }
}