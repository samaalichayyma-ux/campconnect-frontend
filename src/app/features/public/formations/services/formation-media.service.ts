import { HttpClient, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { FormationMediaResponseDto } from '../models/formation-media.model';

@Injectable({
  providedIn: 'root'
})
export class FormationMediaService {
  private readonly formationsBaseUrl = 'http://localhost:8082/api/formations';
  private readonly backendBaseUrl = 'http://localhost:8082';

  constructor(private http: HttpClient) {}

  uploadMedia(formationId: number, file: File): Observable<HttpEvent<FormationMediaResponseDto>> {
    const candidates = this.buildMediaEndpointCandidates(formationId);
    return this.uploadMediaWithFallback(candidates, file, 0);
  }

  getFormationMedia(formationId: number): Observable<FormationMediaResponseDto[]> {
    const candidates = this.buildMediaEndpointCandidates(formationId);
    return this.getMediaWithFallback(candidates, 0);
  }

  deleteFormationMedia(formationId: number, mediaId: number): Observable<void> {
    const candidates = this.buildMediaEndpointCandidates(formationId).map((url) => `${url}/${mediaId}`);
    return this.deleteMediaWithFallback(candidates, 0);
  }

  resolveMediaUrl(mediaUrl?: string | null): string {
    if (!mediaUrl) {
      return '';
    }
    const trimmedUrl = mediaUrl.trim();
    if (!trimmedUrl) {
      return '';
    }
    if (trimmedUrl.startsWith('data:') || /^https?:\/\//i.test(trimmedUrl)) {
      return trimmedUrl;
    }
    const normalized = trimmedUrl.replace(/\\/g, '/');
    if (normalized.startsWith('/')) {
      return `${this.backendBaseUrl}${normalized}`;
    }
    return `${this.backendBaseUrl}/${normalized}`;
  } 
#okkkkkkkkkkkkkkkkkkkkkkkkkkk#
  sortByDisplayOrder(mediaList: FormationMediaResponseDto[]): FormationMediaResponseDto[] {
    return [...mediaList].sort((a, b) => {
      const orderDiff = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
      if (orderDiff !== 0) {
        return orderDiff;
      }
      return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
    });
  }

  private buildMediaEndpointCandidates(formationId: number): string[] {
    return [
      `${this.formationsBaseUrl}/${formationId}/media`,
      `${this.backendBaseUrl}/api/formation/${formationId}/media`,
      `${this.formationsBaseUrl}/${formationId}/medias`
    ];
  }

  private getMediaWithFallback(candidates: string[], index: number): Observable<FormationMediaResponseDto[]> {
    return this.http.get<FormationMediaResponseDto[]>(candidates[index]).pipe(
      catchError((error) => {
        if (this.canUseNextMediaCandidate(error, index, candidates.length)) {
          return this.getMediaWithFallback(candidates, index + 1);
        }
        return throwError(() => error);
      })
    );
  }

  private uploadMediaWithFallback(
    candidates: string[],
    file: File,
    index: number
  ): Observable<HttpEvent<FormationMediaResponseDto>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<FormationMediaResponseDto>(
      candidates[index],
      formData,
      {
        observe: 'events',
        reportProgress: true
      }
    ).pipe(
      catchError((error) => {
        if (this.canUseNextMediaCandidate(error, index, candidates.length)) {
          return this.uploadMediaWithFallback(candidates, file, index + 1);
        }
        return throwError(() => error);
      })
    );
  }

  private deleteMediaWithFallback(candidates: string[], index: number): Observable<void> {
    return this.http.delete<void>(candidates[index]).pipe(
      catchError((error) => {
        if (this.canUseNextMediaCandidate(error, index, candidates.length)) {
          return this.deleteMediaWithFallback(candidates, index + 1);
        }
        return throwError(() => error);
      })
    );
  }

  private canUseNextMediaCandidate(error: unknown, currentIndex: number, totalCandidates: number): boolean {
    if (currentIndex >= totalCandidates - 1) {
      return false;
    }
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }
    if (error.status === 404) {
      return true;
    }
    if (error.status !== 500) {
      return false;
    }
    const message = this.extractBackendErrorMessage(error.error);
    return message.toLowerCase().includes('no static resource');
  }

  private extractBackendErrorMessage(errorBody: unknown): string {
    if (typeof errorBody === 'string') {
      return errorBody;
    }
    if (!errorBody || typeof errorBody !== 'object') {
      return '';
    }
    const candidate = errorBody as { message?: unknown; error?: unknown };
    if (typeof candidate.message === 'string') {
      return candidate.message;
    }
    if (typeof candidate.error === 'string') {
      return candidate.error;
    }
    return '';
  }
}
