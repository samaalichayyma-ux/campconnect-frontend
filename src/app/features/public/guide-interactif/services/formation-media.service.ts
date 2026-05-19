import { HttpClient, HttpErrorResponse, HttpEvent, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import {
  AnalyzeFormationRequestDto,
  AnalyzeFormationResponseDto,
  FormationGenerateRequestDto,
  FormationGenerateResponseDto,
  FormationQuizItemDto
} from '../models/formation-ai.model';
import { FormationListResult, FormationSummaryDto } from '../models/formation.model';
import { FormationMediaResponseDto } from '../models/formation-media.model';

@Injectable({
  providedIn: 'root'
})
export class FormationMediaService {
  private readonly formationsBaseUrl = 'http://localhost:8082/api/formations';
  private readonly backendBaseUrl = 'http://localhost:8082';

  constructor(private http: HttpClient) {}

  uploadMedia(
    formationId: number,
    file: File
  ): Observable<HttpEvent<FormationMediaResponseDto>> {
    const candidates = this.buildMediaEndpointCandidates(formationId);
    return this.uploadMediaWithFallback(candidates, file, 0);
  }

  getFormationMedia(formationId: number): Observable<FormationMediaResponseDto[]> {
    const candidates = this.buildMediaEndpointCandidates(formationId);
    return this.getMediaWithFallback(candidates, 0);
  }

  deleteFormationMedia(formationId: number, mediaId: number): Observable<void> {
    const candidates = this.buildMediaEndpointCandidates(formationId)
      .map((endpoint) => `${endpoint}/${mediaId}`);
    return this.deleteMediaWithFallback(candidates, 0);
  }

  createFormation(payload: Record<string, unknown>): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      this.formationsBaseUrl,
      payload
    );
  }

  listFormations(page = 0, size = 10): Observable<FormationListResult> {
    const params = new HttpParams()
      .set('page', String(Math.max(0, page)))
      .set('size', String(Math.max(1, size)));

    return this.http.get<unknown>(this.formationsBaseUrl, { params }).pipe(
      map((response) => this.normalizeFormationList(response, page, size))
    );
  }

  generateFormationWithAi(
    payload: FormationGenerateRequestDto
  ): Observable<FormationGenerateResponseDto> {
    return this.http.post<FormationGenerateResponseDto>(
      `${this.formationsBaseUrl}/generate`,
      payload
    );
  }

  analyzeFormationDraft(
    payload: AnalyzeFormationRequestDto
  ): Observable<AnalyzeFormationResponseDto> {
    return this.http.post<AnalyzeFormationResponseDto>(
      `${this.formationsBaseUrl}/analyze`,
      payload
    );
  }

  suggestFormationTitles(query: string): Observable<string[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<string[]>(
      `${this.formationsBaseUrl}/suggestions`,
      { params }
    );
  }

  generateQuizForFormation(formationId: number): Observable<FormationQuizItemDto[] | { quiz: FormationQuizItemDto[] }> {
    return this.http.post<FormationQuizItemDto[] | { quiz: FormationQuizItemDto[] }>(
      `${this.formationsBaseUrl}/${formationId}/generate-quiz`,
      {}
    );
  }

  sortByDisplayOrder(mediaList: FormationMediaResponseDto[]): FormationMediaResponseDto[] {
    return [...mediaList].sort((first, second) => {
      const displayOrderDiff = first.displayOrder - second.displayOrder;
      if (displayOrderDiff !== 0) {
        return displayOrderDiff;
      }

      return new Date(first.uploadDate).getTime() - new Date(second.uploadDate).getTime();
    });
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

    const normalizedUrl = trimmedUrl.replace(/\\/g, '/');
    if (normalizedUrl.startsWith('/')) {
      return `${this.backendBaseUrl}${normalizedUrl}`;
    }

    return `${this.backendBaseUrl}/${normalizedUrl}`;
  }

  private normalizeFormationList(
    payload: unknown,
    fallbackPage: number,
    fallbackSize: number
  ): FormationListResult {
    const items = this.extractFormationItems(payload);
    const record = this.asRecord(payload);

    const totalElements = this.toPositiveNumber(record?.['totalElements']) ?? items.length;
    const page = this.toPositiveNumber(record?.['number']) ?? Math.max(0, fallbackPage);
    const size = this.toPositiveNumber(record?.['size']) ?? Math.max(1, fallbackSize);

    return {
      items,
      totalElements,
      page,
      size
    };
  }

  private extractFormationItems(payload: unknown): FormationSummaryDto[] {
    if (Array.isArray(payload)) {
      return this.normalizeFormationArray(payload);
    }

    const record = this.asRecord(payload);
    if (!record) {
      return [];
    }

    const candidates = [
      record['content'],
      record['data'],
      record['items'],
      record['formations'],
      record['result']
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return this.normalizeFormationArray(candidate);
      }
    }

    return [];
  }

  private normalizeFormationArray(rawItems: unknown[]): FormationSummaryDto[] {
    return rawItems
      .map((item) => this.toFormationSummary(item))
      .filter((item): item is FormationSummaryDto => item !== null);
  }

  private toFormationSummary(value: unknown): FormationSummaryDto | null {
    const record = this.asRecord(value);
    if (!record) {
      return null;
    }

    const rawId = record['id'] ?? record['formationId'];
    const parsedId = this.toPositiveNumber(rawId);
    if (!parsedId) {
      return null;
    }

    return {
      id: parsedId,
      titre: this.toOptionalText(record['titre']),
      title: this.toOptionalText(record['title']),
      nom: this.toOptionalText(record['nom']),
      description: this.toOptionalText(record['description']),
      level: this.toOptionalText(record['level']),
      role: this.toOptionalText(record['role']),
      targetUser: this.toOptionalText(record['targetUser']),
      estimatedDuration: this.toOptionalText(record['estimatedDuration']),
      dateCreation: this.toOptionalText(record['dateCreation']),
      createdAt: this.toOptionalText(record['createdAt']),
      guideId: this.toPositiveNumber(record['guideId'] ?? record['guideInteractifId']) ?? undefined,
      guideInteractifId: this.toPositiveNumber(record['guideInteractifId'] ?? record['guideId']) ?? undefined,
      createdById: this.toPositiveNumber(record['createdById'] ?? record['auteurId']) ?? undefined,
      createdByNom: this.toOptionalText(record['createdByNom'] ?? record['createdByName'] ?? record['auteurNom']),
      createdByEmail: this.toOptionalText(record['createdByEmail'] ?? record['auteurEmail']),
      auteurId: this.toPositiveNumber(record['auteurId'] ?? record['createdById']) ?? undefined,
      auteurNom: this.toOptionalText(record['auteurNom'] ?? record['createdByNom'] ?? record['createdByName']),
      auteurEmail: this.toOptionalText(record['auteurEmail'] ?? record['createdByEmail'])
    };
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
    return parsed;
  }

  private toOptionalText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private buildMediaEndpointCandidates(formationId: number): string[] {
    return [
      `${this.formationsBaseUrl}/${formationId}/media`,
      `${this.backendBaseUrl}/api/formation/${formationId}/media`,
      `${this.formationsBaseUrl}/${formationId}/medias`
    ];
  }

  private getMediaWithFallback(
    candidates: string[],
    index: number
  ): Observable<FormationMediaResponseDto[]> {
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

  private deleteMediaWithFallback(
    candidates: string[],
    index: number
  ): Observable<void> {
    return this.http.delete<void>(candidates[index]).pipe(
      catchError((error) => {
        if (this.canUseNextMediaCandidate(error, index, candidates.length)) {
          return this.deleteMediaWithFallback(candidates, index + 1);
        }
        return throwError(() => error);
      })
    );
  }

  private canUseNextMediaCandidate(
    error: unknown,
    currentIndex: number,
    totalCandidates: number
  ): boolean {
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
