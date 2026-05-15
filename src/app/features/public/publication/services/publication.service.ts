import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { Publication } from '../models/publication';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class PublicationService {
  private apiUrl = `${environment.apiUrl}/api/publications`;
  private apiForums = `${environment.apiUrl}/api/forums`;
  private apiBase = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getAll(): Observable<Publication[]> {
    return this.http.get<Publication[]>(this.apiUrl).pipe(
      catchError(() => this.getAllFromForumEndpoints())
    );
  }

  getById(id: number): Observable<Publication> {
    return this.http.get<Publication>(`${this.apiUrl}/${id}`);
  }

  create(publication: Publication): Observable<Publication> {
    const forumId = Number(publication.forumId || publication.forum?.id);
    const payload: Publication = {
      ...publication,
      auteurEmail: publication.auteurEmail || this.authService.getUserEmail(),
      forum: Number.isFinite(forumId) && forumId > 0 ? { id: forumId } : publication.forum
    };

    return this.http.post<Publication>(`${this.apiUrl}/create`, payload).pipe(
      catchError(() => this.http.post<Publication>(this.apiUrl, payload))
    );
  }

  update(id: number, publication: Publication): Observable<Publication> {
    const payload = {
      ...publication,
      auteurEmail: publication.auteurEmail || this.authService.getUserEmail()
    };
    return this.http.put<Publication>(`${this.apiUrl}/${id}`, payload).pipe(
      catchError(() =>
        this.http.put<Publication>(
          `${this.apiUrl}/${id}?auteurEmail=${encodeURIComponent(payload.auteurEmail || this.authService.getUserEmail())}`,
          payload
        )
      )
    );
  }

  delete(id: number, authorEmail = this.authService.getUserEmail()): Observable<void> {
    const safeEmail = encodeURIComponent((authorEmail || '').trim());
    return this.http.delete<void>(`${this.apiUrl}/${id}?auteurEmail=${safeEmail}`);
  }

  like(id: number): Observable<any> {
    return this.http
      .put(`${this.apiUrl}/${id}/like`, {}, { responseType: 'text' })
      .pipe(
        map((body) => this.parseJsonOrFallback<any>(body, { id })),
        catchError((err) => throwError(() => err))
      );
  }

  getByForum(forumId: number): Observable<Publication[]> {
    return this.http.get<Publication[]>(`${this.apiUrl}/forum/${forumId}`).pipe(
      catchError(() =>
        this.http.get<Publication[]>(this.apiUrl).pipe(
          map((publications) =>
            (publications || []).filter((publication) => {
              const resolvedForumId = Number(publication.forumId || publication.forum?.id);
              return Number.isFinite(resolvedForumId) && resolvedForumId === forumId;
            })
          ),
          catchError(() => of([] as Publication[]))
        )
      )
    );
  }

  incrementView(id: number): Observable<Publication> {
    return this.http
      .put(`${this.apiBase}/publications/${id}/view`, {}, { responseType: 'text' })
      .pipe(
        map((body) => this.parseJsonOrFallback<Publication>(body, { id } as Publication)),
        catchError(() =>
          this.http
            .put(`${this.apiUrl}/${id}/view`, {}, { responseType: 'text' })
            .pipe(map((body) => this.parseJsonOrFallback<Publication>(body, { id } as Publication)))
        )
      );
  }

  private getAllFromForumEndpoints(): Observable<Publication[]> {
    return this.http.get<Array<{ id?: number }>>(this.apiForums).pipe(
      switchMap((forums) => {
        const forumIds = (forums || [])
          .map((forum) => Number(forum.id))
          .filter((id) => Number.isFinite(id) && id > 0);

        if (!forumIds.length) {
          return of([] as Publication[]);
        }

        return forkJoin(
          forumIds.map((forumId) =>
            this.getByForum(forumId).pipe(
              map((publications) =>
                (publications || []).map((publication) => ({
                  ...publication,
                  forumId: publication.forumId || forumId
                }))
              ),
              catchError(() => of([] as Publication[]))
            )
          )
        ).pipe(map((chunks) => chunks.flat()));
      }),
      catchError(() => of([] as Publication[]))
    );
  }

  private parseJsonOrFallback<T>(body: string | null | undefined, fallback: T): T {
    const raw = (body || '').trim();
    if (!raw) {
      return fallback;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
}
