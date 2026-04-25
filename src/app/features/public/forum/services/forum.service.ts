import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';


export interface ForumRequest {
  nom: string;
  description: string;
  categorie: string;
  icon?: string;
}

export interface Forum {
  id?: number;
  nom: string;
  description: string;
  categorie: string;
  icon?: string;
  auteurEmail?: string;
  auteurNom?: string;
  dateCreation?: string;
  publications?: any[];
}
export interface Commentaire {
  id?: number;
  contenu: string;
  auteurEmail?: string;
  auteurNom?: string;
  dateCreation?: string;
  likesCount?: number;
}

export interface Publication {
  id?: number;
  titre: string;
  contenu: string;
  auteurEmail?: string;
  auteurNom?: string;
  forum?: {
    id?: number;
    nom?: string;
  };
  likesCount?: number;
  vuesCount?: number;
  dateCreation?: string;
  forumId?: number;
  commentairesCount?: number;

  commentaires?: Commentaire[];
  nouveauCommentaire?: string;
}

@Injectable({ providedIn: 'root' })
export class ForumService {
private apiForums = `${environment.apiUrl}/api/forums`;
private apiPubs = `${environment.apiUrl}/api/publications`;
private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Forum[]> {
    return this.http.get<Forum[]>(this.apiForums);
  }

  getById(id: number): Observable<Forum> {
    return this.http.get<Forum>(`${this.apiForums}/${id}`);
  }

  create(forum: Forum): Observable<Forum> {
    return this.http.post<Forum>(this.apiForums, {
      ...forum,
      auteurEmail: this.getEmail()
    });
  }

  update(id: number, forum: Forum): Observable<Forum> {
    return this.http.put<Forum>(`${this.apiForums}/${id}`, forum);
  }

 deleteForum(id: number) {
  return this.http.delete(`${this.apiForums}/${id}`);
}

  getAllPublications(): Observable<Publication[]> {
    return this.http.get<unknown>(this.apiPubs).pipe(
      map((response) => this.normalizePublications(this.extractPublicationArray(response))),
      catchError(() =>
        this.getAll().pipe(
          switchMap((forums) => {
            const forumIds = (forums || [])
              .map((forum) => Number(forum.id))
              .filter((id) => Number.isFinite(id) && id > 0);

            if (!forumIds.length) {
              return of([] as Publication[]);
            }

            return forkJoin(
              forumIds.map((forumId) =>
                this.getByForumFromEndpoint(forumId).pipe(
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
        )
      )
    );
  }

  getByForum(forumId: number): Observable<Publication[]> {
    const safeForumId = Number(forumId);
    if (!Number.isFinite(safeForumId) || safeForumId <= 0) {
      return of([] as Publication[]);
    }

    return this.getByForumFromEndpoint(safeForumId).pipe(
      switchMap((publications) => {
        if (publications.length > 0) {
          return of(publications);
        }

        // Fallback: certains backends exposent mieux la liste globale que le filtre par forum.
        return this.http.get<unknown>(this.apiPubs).pipe(
          map((response) =>
            this.normalizePublications(this.extractPublicationArray(response)).filter(
              (publication) => this.resolveForumId(publication) === safeForumId
            )
          ),
          catchError(() => of([] as Publication[]))
        );
      }),
      catchError(() => of([] as Publication[]))
    );
  }

  createPublication(publication: Publication): Observable<Publication> {
    const forumId = Number(publication.forumId || publication.forum?.id);
    return this.http.post<Publication>(`${this.apiPubs}/create`, {
      ...publication,
      auteurEmail: this.getEmail(),
      forum: Number.isFinite(forumId) && forumId > 0 ? { id: forumId } : publication.forum
    });
  }

  updatePublication(
    id: number,
    publication: Partial<Publication>,
    authorEmail = publication.auteurEmail || this.getEmail()
  ): Observable<Publication> {
    return this.http.put<Publication>(`${this.apiPubs}/${id}`, {
      ...publication,
      auteurEmail: authorEmail
    });
  }

  likePublication(id: number): Observable<Publication> {
    return this.http
      .put(`${this.apiPubs}/${id}/like`, {}, { responseType: 'text' })
      .pipe(
        map((body) => this.parseJsonOrFallback<Publication>(body, { id, titre: '', contenu: '' })),
        catchError((err) => throwError(() => err))
      );
  }

  deletePublication(id: number, authorEmail = this.getEmail()): Observable<any> {
    const safeEmail = encodeURIComponent((authorEmail || '').trim());
    return this.http.delete(`${this.apiPubs}/${id}?auteurEmail=${safeEmail}`, {
      responseType: 'text'
    });
  }

 incrementVues(id: number): Observable<any> {
  return this.http
    .put(`${this.apiUrl}/publications/${id}/view`, {}, { responseType: 'text' })
    .pipe(
      map((body) => this.parseJsonOrFallback<any>(body, { id })),
      catchError((err) => {
        const status = Number((err as { status?: unknown })?.status);
        const shouldRetryDirect = status === 0 || status === 404 || status === 405;
        if (!shouldRetryDirect) {
          return throwError(() => err);
        }

        return this.http
          .put(`${this.apiPubs}/${id}/view`, {}, { responseType: 'text' })
          .pipe(
            map((body) => this.parseJsonOrFallback<any>(body, { id })),
            catchError(() => throwError(() => err))
          );
      })
    );
}

  getEmail(): string {
    try {
      const u = localStorage.getItem('currentUser') || localStorage.getItem('user') || '{}';
      return JSON.parse(u)?.email || 'anonyme@campconnect.tn';
    } catch {
      return 'anonyme@campconnect.tn';
    }
  }

  getSmartScore(pub: Publication): number {
    const likes = pub.likesCount || 0;
    const comments = pub.commentairesCount || 0;
    const views = pub.vuesCount || 0;
    const engagement = likes * 3 + comments * 4 + views;
    const heures = pub.dateCreation ? (Date.now() - new Date(pub.dateCreation).getTime()) / 3600000 : 24;
    const jours = Math.max(heures / 24, 0);
    const decay = 1 + Math.log1p(jours);
    return engagement / decay;
  }

  getSimilarPublications(source: Publication, all: Publication[], limit = 3): Publication[] {
    const stop = new Set(['le','la','les','de','du','un','une','des','et','ou','en','est','que','pour','sur','dans','avec']);
    const tok = (t: string) =>
      new Set(
        t.toLowerCase()
         .replace(/[^a-zA-Zàâçéèêëîïôûùüÿñæœ\s]/g, ' ')
         .split(/\s+/)
         .filter(w => w.length > 3 && !stop.has(w))
      );

    const src = tok(`${source.titre} ${source.contenu}`);

    return all
      .filter(p => p.id !== source.id)
      .map(p => {
        const t = tok(`${p.titre} ${p.contenu}`);
        const i = [...src].filter(w => t.has(w)).length;
        return { p, i };
      })
      .filter(x => x.i > 0)
      .sort((a, b) => b.i - a.i)
      .slice(0, limit)
      .map(x => x.p);
  }

  getSearchSuggestions(term: string, forums: Forum[], pubs: Publication[], limit = 5): string[] {
    if (!term || term.length < 2) return [];
    const q = term.toLowerCase();

    return [
      ...forums.filter(f => f.nom.toLowerCase().includes(q)).map(f => `📁 ${f.nom}`),
      ...pubs.filter(p => p.titre.toLowerCase().includes(q)).map(p => `📝 ${p.titre}`)
    ].slice(0, limit);
  }

  search(term: string, forums: Forum[], pubs: Publication[]): { forums: Forum[]; publications: Publication[] } {
    const q = term.trim().toLowerCase();
    if (!q) return { forums, publications: pubs };

    return {
      forums: forums.filter(f =>
        f.nom.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.categorie.toLowerCase().includes(q) ||
        (f.auteurNom || '').toLowerCase().includes(q) ||
        (f.auteurEmail || '').toLowerCase().includes(q)
      ),
      publications: pubs.filter(p =>
        p.titre.toLowerCase().includes(q) ||
        p.contenu.toLowerCase().includes(q) ||
        (p.auteurEmail || '').toLowerCase().includes(q)
      )
    };
  }
getCommentaires(publicationId: number) {
  return this.http.get<any[]>(`${this.apiUrl}/commentaires/publication/${publicationId}`).pipe(
    catchError((err) => {
      const status = Number((err as { status?: unknown })?.status);
      const shouldTryLegacyEndpoint = status === 404 || status === 405;
      if (!shouldTryLegacyEndpoint) {
        return throwError(() => err);
      }

      return this.http.get<any[]>(`${this.apiPubs}/${publicationId}/commentaires`).pipe(
        catchError(() => throwError(() => err))
      );
    })
  );
}

addCommentaire(publicationId: number, commentaire: any) {
  return this.http
    .post(`${this.apiUrl}/commentaires/publication/${publicationId}`, commentaire, { responseType: 'text' })
    .pipe(
      map((body) => this.parseJsonOrFallback<any>(body, commentaire)),
      catchError((err) => {
        const status = Number((err as { status?: unknown })?.status);
        const shouldTryLegacyEndpoint = status === 404 || status === 405;
        if (!shouldTryLegacyEndpoint) {
          return throwError(() => err);
        }

        return this.http
          .post(
            `${this.apiPubs}/commentaire/create`,
            { ...commentaire, publication: { id: publicationId } },
            { responseType: 'text' }
          )
          .pipe(
            map((body) => this.parseJsonOrFallback<any>(body, commentaire)),
            catchError(() => throwError(() => err))
          );
      })
    );
}

updateCommentaire(id: number, commentaire: Partial<Commentaire>, authorEmail = this.getEmail()) {
  return this.http.put<Commentaire>(`${this.apiUrl}/commentaires/${id}`, {
    ...commentaire,
    auteurEmail: authorEmail
  });
}

likeCommentaire(id: number) {
  return this.http.put<Commentaire>(`${this.apiUrl}/commentaires/${id}/like`, {});
}

deleteCommentaire(id: number, authorEmail = this.getEmail()) {
  return this.http.delete(`${this.apiUrl}/commentaires/${id}?auteurEmail=${encodeURIComponent(authorEmail)}`, {
    responseType: 'text'
  });
}

private parseJsonOrFallback<T>(body: string, fallback: T): T {
  const normalized = (body || '').trim();
  if (!normalized) {
    return fallback;
  }

  try {
    return JSON.parse(normalized) as T;
  } catch {
    return fallback;
  }
}

private getByForumFromEndpoint(forumId: number): Observable<Publication[]> {
  return this.http.get<unknown>(`${this.apiPubs}/forum/${forumId}`).pipe(
    map((response) =>
      this.normalizePublications(this.extractPublicationArray(response)).map((publication) => ({
        ...publication,
        forumId: this.resolveForumId(publication) || forumId,
        forum: publication.forum || { id: forumId }
      }))
    )
  );
}

private extractPublicationArray(payload: unknown): Publication[] {
  if (Array.isArray(payload)) {
    return payload as Publication[];
  }

  const record = payload as Record<string, unknown> | null;
  if (!record) {
    return [];
  }

  const candidates = [
    record['content'],
    record['data'],
    record['value'],
    record['items'],
    record['publications']
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as Publication[];
    }
  }

  return [];
}

private normalizePublications(publications: Publication[]): Publication[] {
  return (publications || []).map((publication) => {
    const forumId = this.resolveForumId(publication);
    return {
      ...publication,
      forumId: forumId || publication.forumId
    };
  });
}

private resolveForumId(publication: Publication): number {
  const byField = Number(publication?.forumId);
  if (Number.isFinite(byField) && byField > 0) {
    return byField;
  }

  const byLegacyField = Number((publication as unknown as Record<string, unknown>)?.['idForum']);
  if (Number.isFinite(byLegacyField) && byLegacyField > 0) {
    return byLegacyField;
  }

  const byObject = Number(publication?.forum?.id);
  if (Number.isFinite(byObject) && byObject > 0) {
    return byObject;
  }

  const forumRecord = (publication?.forum || {}) as Record<string, unknown>;
  const byLegacyObject = Number(
    forumRecord['idForum'] ?? forumRecord['idforum'] ?? forumRecord['forumId']
  );
  if (Number.isFinite(byLegacyObject) && byLegacyObject > 0) {
    return byLegacyObject;
  }

  return 0;
}
}
