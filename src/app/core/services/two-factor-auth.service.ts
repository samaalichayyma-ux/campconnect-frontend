import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TwoFactorSetupResponse {
  secret: string;
  otpAuthUrl: string;
  qrCodeBase64: string;
}

export interface TwoFactorStatusResponse {
  enabled: boolean;
  verified: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TwoFactorAuthService {
  private baseUrl = 'http://localhost:8082/api/auth/2fa';

  constructor(private http: HttpClient) {}

  getStatus(): Observable<TwoFactorStatusResponse> {
    return this.http.get<TwoFactorStatusResponse>(`${this.baseUrl}/status`);
  }

  setup(): Observable<TwoFactorSetupResponse> {
    return this.http.post<TwoFactorSetupResponse>(`${this.baseUrl}/setup`, {});
  }

  verify(code: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/verify`,
      { code }
    );
  }

  disable(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/disable`, {});
  }
}