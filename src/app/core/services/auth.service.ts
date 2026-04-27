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

export interface GoogleLoginRequest {
  credential: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyLogin2FARequest {
  tempToken: string;
  code: string;
}

export interface AuthResponse {
  userId?: number;
  id?: number;
  utilisateurId?: number;
  token?: string | null;
  message: string;
  role?: string | null;
  nom?: string;
  email?: string;
  requires2FA?: boolean;
  tempToken?: string | null;
}

export interface CurrentUserResponse {
  userId?: number;
  id?: number;
  utilisateurId?: number;
  nom?: string;
  email?: string;
  role?: string;
  authorities?: Array<{ authority?: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8082/api/auth';
  private readonly currentUserFallbackUrl = 'http://localhost:8082/api/auth/me';
private readonly adminPanelRoles = new Set([
  'ADMINISTRATEUR',
  'GUIDE',
  'LIVREUR',
  'GERANT_RESTAU',
  'AGENT_ASSURANCE'
]);  private readonly eventManagementRoles = new Set(['ADMINISTRATEUR', 'GERANT_RESTAU', 'GUIDE']);

  constructor(private http: HttpClient) {}

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((response) => {
        if (response.token) {
          this.saveAuthData(response);
        }
      })
    );
  }

  isInsuranceAgent(role = this.getRole()): boolean {
  return this.normalizeRole(role) === 'AGENT_ASSURANCE';
}

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap((response) => {
        if (!response.requires2FA && response.token) {
          this.saveAuthData(response);
        }
      })
    );
  }

  verifyLogin2FA(data: VerifyLogin2FARequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/verify-2fa`, data).pipe(
      tap((response) => {
        if (response.token) {
          this.saveAuthData(response);
        }
      })
    );
  }

  googleLogin(credential: string): Observable<AuthResponse> {
    const payload: GoogleLoginRequest = { credential };

    return this.http.post<AuthResponse>(`${this.apiUrl}/google`, payload).pipe(
      tap((response) => {
        if (response.token) {
          this.saveAuthData(response);
        }
      })
    );
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/forgot-password`, data, {
      responseType: 'text'
    });
  }

  resetPassword(data: ResetPasswordRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/reset-password`, data, {
      responseType: 'text'
    });
  }

  private saveAuthData(response: AuthResponse): void {
    if (!response.token) {
      return;
    }

    localStorage.setItem('token', response.token);
    this.saveRole(response.role);

    const decodedToken = this.decodeJwtPayload(response.token);
    const resolvedUserId = this.resolveUserId(response) ?? this.resolveUserId(decodedToken);
    if (resolvedUserId) {
      this.saveUserId(resolvedUserId);
    }

    const resolvedName = this.resolveDisplayName(response) || this.resolveDisplayName(decodedToken);
    if (resolvedName) {
      this.saveUserName(resolvedName);
    }

    const resolvedEmail = this.resolveEmail(response) || this.resolveEmail(decodedToken);
    if (resolvedEmail) {
      this.saveUserEmail(resolvedEmail);
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('nom');
    localStorage.removeItem('email');
    localStorage.removeItem('returnUrl');
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

    const tokenRole = this.extractRole(this.decodeJwtPayload(token));
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

  redirectByRole(router: { navigate: (commands: string[]) => void }): void {
    const role = this.getRole();

    switch (role) {
      case 'ADMINISTRATEUR':
        router.navigate(['/admin/dashboard']);
        break;
      case 'GUIDE':
        router.navigate(['/admin/owner-dashboard']);
        break;
        case 'AGENT_ASSURANCE':
      router.navigate(['/insurance-agent/dashboard']);
      break;
      case 'LIVREUR':
        router.navigate(['/admin']);
        break;
      case 'GERANT_RESTAU':
        router.navigate(['/admin']);
        break;
      case 'CLIENT':
      default:
        router.navigate(['/public']);
        break;
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

  fetchCurrentUser(): Observable<CurrentUserResponse> {
    return this.http.get<CurrentUserResponse>(`${this.apiUrl}/me`).pipe(
      tap((userInfo) => this.syncCurrentUser(userInfo))
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

  private resolveDisplayName(source: unknown): string {
    const candidate = source as
      | {
          nom?: unknown;
          name?: unknown;
          username?: unknown;
          sub?: unknown;
        }
      | null;

    const directName = [candidate?.nom, candidate?.name, candidate?.username]
      .find((value) => typeof value === 'string' && value.trim());

    if (typeof directName === 'string') {
      return directName.trim();
    }

    if (typeof candidate?.sub === 'string' && candidate.sub.trim()) {
      return candidate.sub.trim();
    }

    return '';
  }

  private resolveEmail(source: unknown): string {
    const candidate = source as
      | {
          email?: unknown;
          sub?: unknown;
        }
      | null;

    if (typeof candidate?.email === 'string' && candidate.email.trim()) {
      return candidate.email.trim();
    }

    if (typeof candidate?.sub === 'string' && candidate.sub.includes('@')) {
      return candidate.sub.trim();
    }

    return '';
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

   isAdmin(): boolean {
    return this.canAccessAdminPanel();
  }
  
  ownsResource(authorEmail?: string): boolean {
    const currentEmail = this.getUserEmail().trim().toLowerCase();
    const targetEmail = (authorEmail || '').trim().toLowerCase();
    return currentEmail !== '' && currentEmail === targetEmail;
  }
}