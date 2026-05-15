import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

export interface Publication {
  id?: number;
  forumId?: number;
  forum?: {
    id?: number;
    nom?: string;
  };
  titre?: string;
  contenu: string;
  auteurEmail?: string;
  likesCount?: number;
  commentairesCount?: number;
  vuesCount?: number;
  dateCreation?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PublicationAdminService {
  private apiUrl = `${environment.apiUrl}/api/admin/publications`;
  private publicApiUrl = `${environment.apiUrl}/api/publications`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getByForum(forumId: number): Observable<Publication[]> {
    return this.http.get<Publication[]>(`${this.apiUrl}/forum/${forumId}`).pipe(
      catchError(() => this.http.get<Publication[]>(`${this.publicApiUrl}/forum/${forumId}`))
    );
  }


  getById(id: number): Observable<Publication> {
    return this.http.get<Publication>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => this.http.get<Publication>(`${this.publicApiUrl}/${id}`))
    );
  }

  create(publication: Publication): Observable<Publication> {
    const payload = this.toPublicPayload(publication);
    return this.http.post<Publication>(this.apiUrl, payload).pipe(
      catchError(() => this.http.post<Publication>(`${this.publicApiUrl}/create`, payload))
    );
  }

  update(id: number, publication: Publication): Observable<Publication> {
    const payload = this.toPublicPayload(publication);
    return this.http.put<Publication>(`${this.apiUrl}/${id}`, payload).pipe(
      catchError(() =>
        this.http.put<Publication>(`${this.publicApiUrl}/${id}`, payload).pipe(
          catchError(() =>
            this.http.put<Publication>(
              `${this.publicApiUrl}/${id}?auteurEmail=${encodeURIComponent(payload.auteurEmail || this.getUserEmail())}`,
              payload
            )
          )
        )
      )
    );
  }

  delete(id: number): Observable<string> {
    const email = encodeURIComponent(this.getUserEmail());
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' }).pipe(
      catchError(() =>
        this.http.delete(`${this.publicApiUrl}/${id}?auteurEmail=${email}`, { responseType: 'text' })
      )
    );
  }
  getAll(): Observable<Publication[]> {
    return this.http.get<Publication[]>(this.apiUrl).pipe(
      catchError(() => this.http.get<Publication[]>(this.publicApiUrl))
    );
  }

  like(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/like`, {}).pipe(
      catchError(() => this.http.put(`${this.publicApiUrl}/${id}/like`, {}))
    );
  }

  private getUserEmail(): string {
    return this.authService.getUserEmail() || this.tryReadLocalEmail() || 'admin@campconnect.tn';
  }

  private tryReadLocalEmail(): string {
    try {
      const parsed = JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('user') || '{}') as {
        email?: string;
      };
      return (parsed.email || '').trim();
    } catch {
      return '';
    }
  }

  private toPublicPayload(publication: Publication): Publication {
    const forumId = Number(publication.forumId || publication.forum?.id);
    return {
      ...publication,
      auteurEmail: publication.auteurEmail || this.getUserEmail(),
      forum: Number.isFinite(forumId) && forumId > 0 ? { id: forumId } : publication.forum
    };
  }
}
