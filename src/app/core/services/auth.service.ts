import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap } from 'rxjs';

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
  userId?: number;
  id?: number;
  utilisateurId?: number;
  token: string;
  message: string;
  role: string;
}

export interface CurrentUserResponse {
  userId?: number;
  id?: number;
  utilisateurId?: number;
  nom?: string;
  email?: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private readonly adminPanelRoles = new Set(['ADMINISTRATEUR']);
  private readonly eventManagementRoles = new Set(['ADMINISTRATEUR', 'GERANT_RESTAU', 'GUIDE']);

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

  private saveAuthData(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    this.saveRole(response.role);

    const resolvedUserId = this.resolveUserId(response);
    console.log('Auth response received:', {
      hasToken: !!response.token,
      role: response.role,
      userId: resolvedUserId,
      fullResponse: response
    });

    if (resolvedUserId) {
      localStorage.setItem('userId', resolvedUserId.toString());
      console.log('UserId saved to localStorage:', resolvedUserId);
    } else {
      console.warn('Backend did not return a usable userId in the auth response.');
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
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
    const storedRole = this.normalizeRole(localStorage.getItem('role'));
    if (storedRole) {
      localStorage.setItem('role', storedRole);
      return storedRole;
    }

    const token = this.getToken();
    if (!token) {
      return '';
    }

    const decodedToken = this.decodeJwtPayload(token);
    const tokenRole = this.extractRole(decodedToken);
    if (tokenRole) {
      this.saveRole(tokenRole);
      return tokenRole;
    }

    return '';
  }

  canAccessAdminPanel(role = this.getRole()): boolean {
    return this.adminPanelRoles.has(this.normalizeRole(role));
  }

  canManageEvents(role = this.getRole()): boolean {
    return this.eventManagementRoles.has(this.normalizeRole(role));
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
        router.navigate(['/public']);
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

  setReturnUrl(url: string): void {
    localStorage.setItem('returnUrl', url);
  }

  getReturnUrl(): string | null {
    return localStorage.getItem('returnUrl');
  }

  clearReturnUrl(): void {
    localStorage.removeItem('returnUrl');
  }

  getUserName(): string {
    return localStorage.getItem('nom') || '';
  }

  getUserId(): number {
    const storedUserId = Number(localStorage.getItem('userId'));
    if (Number.isFinite(storedUserId) && storedUserId > 0) {
      return storedUserId;
    }

    const token = this.getToken();
    if (!token) {
      return 0;
    }

    const decodedUserId = this.resolveUserId(this.decodeJwtPayload(token));
    if (decodedUserId) {
      this.saveUserId(decodedUserId);
      return decodedUserId;
    }

    return 0;
  }

  saveUserId(id: number): void {
    if (Number.isFinite(id) && id > 0) {
      localStorage.setItem('userId', id.toString());
    }
  }

  fetchCurrentUser(): Observable<any> {
    return this.http.get<CurrentUserResponse>(`${this.apiUrl}/me`).pipe(
      tap((userInfo) => this.syncCurrentUser(userInfo)),
      catchError(() =>
        this.http.get<CurrentUserResponse>('http://localhost:8080/api/utilisateurs/me').pipe(
          tap((userInfo) => this.syncCurrentUser(userInfo))
        )
      )
    );
  }

  getUserEmail(): string {
    return localStorage.getItem('email') || '';
  }

  saveUserEmail(email: string): void {
    localStorage.setItem('email', email);
  }

  syncCurrentUser(userInfo: CurrentUserResponse | null | undefined): void {
    if (!userInfo) {
      return;
    }

    const resolvedUserId = this.resolveUserId(userInfo);
    if (resolvedUserId) {
      this.saveUserId(resolvedUserId);
    }

    if (typeof userInfo.nom === 'string' && userInfo.nom.trim()) {
      this.saveUserName(userInfo.nom.trim());
    }

    if (typeof userInfo.email === 'string' && userInfo.email.trim()) {
      this.saveUserEmail(userInfo.email.trim());
    }

    const resolvedRole = this.extractRole(userInfo);
    if (resolvedRole) {
      this.saveRole(resolvedRole);
    }
  }

  private resolveUserId(source: unknown): number | null {
    const candidate = source as { userId?: unknown; id?: unknown; utilisateurId?: unknown } | null;
    const rawUserId = candidate?.userId ?? candidate?.id ?? candidate?.utilisateurId;
    const parsedUserId = typeof rawUserId === 'string' ? Number(rawUserId) : rawUserId;

    return typeof parsedUserId === 'number' && Number.isFinite(parsedUserId) && parsedUserId > 0
      ? parsedUserId
      : null;
  }

  private extractRole(source: unknown): string {
    const candidate = source as
      | {
        role?: unknown;
        authorities?: Array<{ authority?: unknown }>;
      }
      | null;

    const directRole = this.normalizeRole(candidate?.role);
    if (directRole) {
      return directRole;
    }

    const authority = candidate?.authorities?.find((entry) => typeof entry?.authority === 'string')?.authority;
    return this.normalizeRole(authority);
  }

  private normalizeRole(rawRole: unknown): string {
    if (typeof rawRole !== 'string') {
      return '';
    }

    return rawRole.trim().replace(/^ROLE_/i, '').toUpperCase();
  }

  private saveRole(role: unknown): void {
    const normalizedRole = this.normalizeRole(role);
    if (normalizedRole) {
      localStorage.setItem('role', normalizedRole);
    }
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    const segments = token.split('.');
    if (segments.length < 2) {
      return null;
    }

    try {
      const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
      const normalizedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      return JSON.parse(atob(normalizedBase64)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
