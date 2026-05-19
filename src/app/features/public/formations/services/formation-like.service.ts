import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';

interface LikeActionCandidate {
  method: 'POST' | 'PUT' | 'DELETE';
  url: string;
}

export interface FormationLikeActionResult {
  formationId: number;
  liked: boolean;
  likesCount?: number;
  persisted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FormationLikeService {
  private readonly formationsBaseUrl = 'http://localhost:8082/api/formations';
  private readonly backendBaseUrl = 'http://localhost:8082';
  private readonly storagePrefix = 'campconnect:formation:likes:';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getLikedFormationIds(): Observable<Set<number>> {
    if (!this.authService.isLoggedIn()) {
      return of(new Set<number>());
    }

    const candidates = this.buildLikedListCandidates();
    return this.getLikedIdsWithFallback(candidates, 0).pipe(
      map((ids) => {
        this.writeLocalLikedIds(ids);
        return ids;
      }),
      catchError((error) => {
        if (this.canFallbackToLocal(error)) {
          return of(this.readLocalLikedIds());
        }
        return throwError(() => error);
      })
    );
  }

  setLikeState(formationId: number, liked: boolean): Observable<FormationLikeActionResult> {
    if (!this.authService.isLoggedIn()) {
      return throwError(() => new Error('Utilisateur non connecte.'));
    }

    // Frontend hard guard: one like per user/session key.
    // Prevents duplicate like requests even if another component calls this directly.
    if (liked) {
      const localIds = this.readLocalLikedIds();
      if (localIds.has(formationId)) {
        return of({
          formationId,
          liked: true,
          persisted: true
        } as FormationLikeActionResult);
      }
    }

    const candidates = liked
      ? this.buildLikeCandidates(formationId)
      : this.buildUnlikeCandidates(formationId);

    return this.executeLikeActionWithFallback(candidates, 0).pipe(
      map((responseBody) => {
        const localIds = this.readLocalLikedIds();
        if (liked) {
          localIds.add(formationId);
        } else {
          localIds.delete(formationId);
        }
        this.writeLocalLikedIds(localIds);

        return {
          formationId,
          liked,
          likesCount: this.extractLikeCount(responseBody) ?? undefined,
          persisted: true
        } as FormationLikeActionResult;
      }),
      catchError((error) => {
        if (!this.canFallbackToLocal(error)) {
          return throwError(() => error);
        }

        const localIds = this.readLocalLikedIds();
        if (liked) {
          localIds.add(formationId);
        } else {
          localIds.delete(formationId);
        }
        this.writeLocalLikedIds(localIds);

        return of({
          formationId,
          liked,
          persisted: false
        } as FormationLikeActionResult);
      })
    );
  }

  private getLikedIdsWithFallback(candidates: string[], index: number): Observable<Set<number>> {
    return this.http.get<unknown>(candidates[index]).pipe(
      map((payload) => this.extractLikedFormationIds(payload)),
      catchError((error) => {
        if (this.canTryNextCandidate(error, index, candidates.length)) {
          return this.getLikedIdsWithFallback(candidates, index + 1);
        }
        return throwError(() => error);
      })
    );
  }

  private executeLikeActionWithFallback(
    candidates: LikeActionCandidate[],
    index: number
  ): Observable<unknown> {
    const candidate = candidates[index];
    const request$ = candidate.method === 'POST'
      ? this.http.post<unknown>(candidate.url, {})
      : candidate.method === 'PUT'
        ? this.http.put<unknown>(candidate.url, {})
        : this.http.delete<unknown>(candidate.url);

    return request$.pipe(
      catchError((error) => {
        if (this.canTryNextCandidate(error, index, candidates.length)) {
          return this.executeLikeActionWithFallback(candidates, index + 1);
        }
        return throwError(() => error);
      })
    );
  }

  private buildLikedListCandidates(): string[] {
    return [
      `${this.formationsBaseUrl}/favorites/me`,
      `${this.formationsBaseUrl}/favoris/me`,
      `${this.formationsBaseUrl}/likes/me`,
      `${this.formationsBaseUrl}/liked/me`,
      `${this.formationsBaseUrl}/me/favorites`,
      `${this.backendBaseUrl}/api/formation/favorites/me`,
      `${this.backendBaseUrl}/api/formations/favorites`
    ];
  }

  private buildLikeCandidates(formationId: number): LikeActionCandidate[] {
    return [
      { method: 'POST', url: `${this.formationsBaseUrl}/${formationId}/favorite` },
      { method: 'POST', url: `${this.formationsBaseUrl}/${formationId}/favori` },
      { method: 'PUT', url: `${this.formationsBaseUrl}/${formationId}/like` },
      { method: 'POST', url: `${this.formationsBaseUrl}/${formationId}/like` },
      { method: 'POST', url: `${this.formationsBaseUrl}/${formationId}/likes` },
      { method: 'POST', url: `${this.backendBaseUrl}/api/formation/${formationId}/favorite` }
    ];
  }

  private buildUnlikeCandidates(formationId: number): LikeActionCandidate[] {
    return [
      { method: 'DELETE', url: `${this.formationsBaseUrl}/${formationId}/favorite` },
      { method: 'DELETE', url: `${this.formationsBaseUrl}/${formationId}/favori` },
      { method: 'DELETE', url: `${this.formationsBaseUrl}/${formationId}/like` },
      { method: 'DELETE', url: `${this.formationsBaseUrl}/${formationId}/likes` },
      { method: 'PUT', url: `${this.formationsBaseUrl}/${formationId}/unlike` },
      { method: 'DELETE', url: `${this.backendBaseUrl}/api/formation/${formationId}/favorite` }
    ];
  }

  private extractLikedFormationIds(payload: unknown): Set<number> {
    const ids = this.extractIdsFromUnknown(payload);
    return new Set(ids);
  }

  private extractIdsFromUnknown(payload: unknown): number[] {
    if (Array.isArray(payload)) {
      return this.extractIdsFromArray(payload);
    }

    const record = this.asRecord(payload);
    if (!record) {
      return [];
    }

    const directCandidates = [
      record['likedFormationIds'],
      record['favoriteFormationIds'],
      record['favorites'],
      record['likes'],
      record['content'],
      record['items'],
      record['data'],
      record['formations']
    ];

    for (const candidate of directCandidates) {
      if (Array.isArray(candidate)) {
        return this.extractIdsFromArray(candidate);
      }
    }

    const singleId = this.toPositiveNumber(record['id'] ?? record['formationId']);
    return singleId ? [singleId] : [];
  }

  private extractIdsFromArray(items: unknown[]): number[] {
    const ids = items
      .map((item) => {
        const directNumber = this.toPositiveNumber(item);
        if (directNumber) {
          return directNumber;
        }

        const record = this.asRecord(item);
        if (!record) {
          return null;
        }

        return this.toPositiveNumber(record['id'] ?? record['formationId']);
      })
      .filter((value): value is number => value !== null);

    return Array.from(new Set(ids));
  }

  private extractLikeCount(payload: unknown): number | null {
    const directCount = this.toPositiveNumber(payload);
    if (directCount !== null) {
      return directCount;
    }

    const record = this.asRecord(payload);
    if (!record) {
      return null;
    }

    const candidates = [
      record['likesCount'],
      record['likeCount'],
      record['favoriteCount'],
      record['favoritesCount'],
      record['totalLikes']
    ];

    for (const candidate of candidates) {
      const parsed = this.toPositiveNumber(candidate);
      if (parsed !== null) {
        return parsed;
      }
    }

    return null;
  }

  private canTryNextCandidate(error: unknown, index: number, total: number): boolean {
    if (index >= total - 1) {
      return false;
    }

    if (!(error instanceof HttpErrorResponse)) {
      return true;
    }

    // Try all endpoint variants except explicit auth failures.
    // This keeps likes working across backend route naming differences.
    return error.status !== 401 && error.status !== 403;
  }

  private canFallbackToLocal(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return true;
    }

    // Keep local like experience functional on backend/route issues.
    return error.status !== 401 && error.status !== 403;
  }

  private extractBackendMessage(errorBody: unknown): string {
    if (typeof errorBody === 'string') {
      return errorBody;
    }

    const record = this.asRecord(errorBody);
    if (!record) {
      return '';
    }

    const message = record['message'];
    if (typeof message === 'string') {
      return message;
    }

    const error = record['error'];
    if (typeof error === 'string') {
      return error;
    }

    return '';
  }

  private buildStorageKey(): string {
    const userId = this.authService.getUserId();
    if (userId > 0) {
      return `${this.storagePrefix}id:${userId}`;
    }

    const email = this.authService.getUserEmail().trim().toLowerCase();
    return `${this.storagePrefix}email:${email || 'anonymous'}`;
  }

  private readLocalLikedIds(): Set<number> {
    const raw = localStorage.getItem(this.buildStorageKey());
    if (!raw) {
      return new Set<number>();
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return new Set<number>();
      }

      const ids = parsed
        .map((value) => this.toPositiveNumber(value))
        .filter((value): value is number => value !== null);

      return new Set(ids);
    } catch {
      return new Set<number>();
    }
  }

  private writeLocalLikedIds(ids: Set<number>): void {
    localStorage.setItem(this.buildStorageKey(), JSON.stringify(Array.from(ids)));
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private toPositiveNumber(value: unknown): number | null {
    const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return null;
    }

    return Math.floor(parsed);
  }
}
