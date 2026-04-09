import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Avis {
  id: number;
  note?: number | null;
  commentaire?: string | null;
  dateCreation: string;
  siteId: number;
  siteNom?: string;
  utilisateurEmail: string;
}

export interface SiteRating {
  siteId: number;
  averageRating: number;
  totalRatings: number;
}

@Injectable({
  providedIn: 'root'
})
export class SiteCampingAvisService {
  private apiUrl = 'http://localhost:8082/api/site-camping-avis';

  constructor(private http: HttpClient) {}

  getAvisBySite(siteId: number): Observable<Avis[]> {
    return this.http.get<Avis[]>(`${this.apiUrl}/site/${siteId}`);
  }

  createAvis(siteId: number, data: any): Observable<Avis> {
    return this.http.post<Avis>(`${this.apiUrl}/site/${siteId}`, data);
  }

  updateAvis(idAvis: number, data: any): Observable<Avis> {
    return this.http.patch<Avis>(`${this.apiUrl}/${idAvis}`, data);
  }

  deleteAvis(idAvis: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idAvis}`);
  }

  getAllAdminAvis(): Observable<Avis[]> {
    return this.http.get<Avis[]>(`${this.apiUrl}/admin/site-camping-avis`);
  }

  getMyCampAvis(): Observable<Avis[]> {
    return this.http.get<Avis[]>(`${this.apiUrl}/my-camp-avis`);
  }

  getSiteRating(siteId: number): Observable<SiteRating> {
    return this.http.get<SiteRating>(`${this.apiUrl}/site/${siteId}/rating`);
  }
}