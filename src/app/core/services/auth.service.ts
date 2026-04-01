import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  email: string;
  motDePasse: string;
}

export interface RegisterRequest {
  nom: string;
  email: string;
  motDePasse: string;
  telephone: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  message: string;
  role: string;
  nom: string;
  email: string; 
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8082/api/auth';

  constructor(private http: HttpClient) {}

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((response) => this.saveAuthData(response))
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap((response) => this.saveAuthData(response))
    );
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  }
  private saveAuthData(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('role', response.role);
    const decoded = this.decodeToken(response.token);

  if (decoded?.sub) {
    localStorage.setItem('email', decoded.sub);
    localStorage.setItem('nom', decoded.sub);
  }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('nom');
    localStorage.removeItem('email');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string {
    return localStorage.getItem('role') || '';
  }

  redirectByRole(router: any): void {
    const role = this.getRole();

    switch (role) {
      case 'ADMINISTRATEUR':
        router.navigate(['/admin']);
        break;
      case 'CLIENT':
        router.navigate(['/public']);
        break;
      case 'LIVREUR':
        router.navigate(['/public']);
        break;
      case 'GUIDE':
        router.navigate(['/admin']);
        break;
      case 'GERANT_RESTAU':
        router.navigate(['/public']);
        break;
      case 'AGENT_ASSURANCE':
        router.navigate(['/public']);
        break;
      default:
        router.navigate(['/public']);
    }
  }

  

saveUserName(nom: string): void {
  localStorage.setItem('nom', nom);
}

getUserName(): string {
  return localStorage.getItem('nom') || '';
}

getUserEmail(): string {
  return localStorage.getItem('email') || '';
}
}