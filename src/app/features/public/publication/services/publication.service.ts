import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { Publication } from '../models/publication';

@Injectable({
  providedIn: 'root'
})

export class PublicationService {
  private apiUrl = '/api/publications';

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

    return this.http.post<Publication>(`${this.apiUrl}/create`, payload);
  }

  update(id: number, publication: Publication): Observable<Publication> {
    return this.http.put<Publication>(`${this.apiUrl}/${id}`, publication);
  }

  delete(id: number, authorEmail = this.authService.getUserEmail()): Observable<void> {
    const safeEmail = encodeURIComponent((authorEmail || '').trim());
    return this.http.delete<void>(`${this.apiUrl}/${id}?auteurEmail=${safeEmail}`);
  }

  like(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/like`, {});
  }

  getByForum(forumId: number): Observable<Publication[]> {
    return this.http.get<Publication[]>(`${this.apiUrl}/forum/${forumId}`);
  }

  incrementView(id: number): Observable<Publication> {
    return this.http.put<Publication>(`${this.apiUrl}/${id}/view`, {});
  }

  private getAllFromForumEndpoints(): Observable<Publication[]> {
    return this.http.get<Array<{ id?: number }>>('/api/forums').pipe(
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
}