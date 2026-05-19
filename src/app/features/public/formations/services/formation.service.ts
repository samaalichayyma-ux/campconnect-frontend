import { HttpClient, HttpErrorResponse, HttpEvent, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import {
  AnalyzeFormationRequestDto,
  AnalyzeFormationResponseDto,
  FormationGenerateRequestDto,
  FormationGenerateResponseDto,
  FormationQuizItemDto
} from '../models/formation-ai.model';
import {
  FormationAuthorRef,
  FormationLevel,
  FormationListQuery,
  FormationListResult,
  FormationStatus,
  FormationSummaryDto,
  FormationUpsertPayload
} from '../models/formation.model';
import { FormationMediaResponseDto } from '../models/formation-media.model';
import {
  FormationSingleStatsDto,
  FormationStatsBarItemDto,
  FormationStatsLinePointDto,
  FormationStatsOverviewDto
} from '../models/formation-stats.model';

@Injectable({
  providedIn: 'root'
})
export class FormationService {
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

  createFormation(payload: FormationUpsertPayload | Record<string, unknown>): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      this.formationsBaseUrl,
      payload
    );
  }

  getFormationById(formationId: number): Observable<FormationSummaryDto> {
    return this.http.get<unknown>(`${this.formationsBaseUrl}/${formationId}`).pipe(
      map((response) => this.toFormationSummary(response) || { id: formationId })
    );
  }

  updateFormation(
    formationId: number,
    payload: FormationUpsertPayload | Record<string, unknown>
  ): Observable<Record<string, unknown>> {
    return this.http.put<Record<string, unknown>>(
      `${this.formationsBaseUrl}/${formationId}`,
      payload
    );
  }

  deleteFormation(formationId: number): Observable<void> {
    return this.http.delete<void>(`${this.formationsBaseUrl}/${formationId}`).pipe(
      catchError((error) => {
        if (!this.isGuideForeignKeyError(error)) {
          return throwError(() => error);
        }

        return this.deleteGuideDependenciesAndRetryFormationDelete(formationId, error);
      })
    );
  }

  publishFormation(formationId: number): Observable<Record<string, unknown>> {
    const patchPayload = { status: 'PUBLISHED', statut: 'PUBLISHED' as FormationStatus };
    return this.http.post<Record<string, unknown>>(
      `${this.formationsBaseUrl}/${formationId}/publish`,
      {}
    ).pipe(
      catchError(() => this.http.patch<Record<string, unknown>>(
        `${this.formationsBaseUrl}/${formationId}`,
        patchPayload
      )),
      catchError(() => this.updateFormation(formationId, patchPayload)),
      catchError(() => this.getFormationById(formationId).pipe(
        switchMap((formation) => this.updateFormation(formationId, {
          titre: formation.titre || formation.title || formation.nom || `Formation #${formationId}`,
          title: formation.titre || formation.title || formation.nom || `Formation #${formationId}`,
          nom: formation.titre || formation.title || formation.nom || `Formation #${formationId}`,
          description: formation.description || '',
          coverImageUrl: formation.coverImageUrl || formation.imagePrincipale || formation.imageUrl || formation.photoUrl || '',
          imagePrincipale: formation.imagePrincipale || formation.coverImageUrl || formation.imageUrl || formation.photoUrl || '',
          imageUrl: formation.imageUrl || formation.coverImageUrl || formation.imagePrincipale || formation.photoUrl || '',
          photoUrl: formation.photoUrl || formation.coverImageUrl || formation.imagePrincipale || formation.imageUrl || '',
          coverVideoUrl: formation.coverVideoUrl || formation.videoPrincipale || formation.videoUrl || '',
          videoPrincipale: formation.videoPrincipale || formation.coverVideoUrl || formation.videoUrl || '',
          videoUrl: formation.videoUrl || formation.coverVideoUrl || formation.videoPrincipale || '',
          content: formation.content || formation.contenu || '',
          contenu: formation.content || formation.contenu || '',
          objectives: formation.objectives || formation.objectifs || [],
          objectifs: formation.objectives || formation.objectifs || [],
          sections: formation.sections || [],
          summary: formation.summary || formation.resume || '',
          resume: formation.summary || formation.resume || '',
          level: this.normalizeLevel(formation.level) || 'BEGINNER',
          niveau: this.normalizeLevel(formation.level) || 'BEGINNER',
          estimatedDuration: formation.estimatedDuration || '',
          quiz: formation.quiz || [],
          status: 'PUBLISHED',
          statut: 'PUBLISHED'
        }))
      ))
    );
  }

  listFormations(
    pageOrQuery: number | FormationListQuery = 0,
    sizeValue = 10
  ): Observable<FormationListResult> {
    const query = this.normalizeListQuery(pageOrQuery, sizeValue);

    let params = new HttpParams()
      .set('page', String(query.page))
      .set('size', String(query.size));

    if (query.search) {
      params = params
        .set('search', query.search)
        .set('title', query.search)
        .set('q', query.search);
    }

    if (query.level) {
      params = params
        .set('level', query.level)
        .set('niveau', query.level);
    }

    if (query.status) {
      params = params
        .set('status', query.status)
        .set('statut', query.status);
    }

    return this.http.get<unknown>(this.formationsBaseUrl, { params }).pipe(
      map((response) => this.normalizeFormationList(response, query.page, query.size)),
      map((response) => this.applyClientSideFilters(response, query))
    );
  }

  getFormationsStats(): Observable<FormationStatsOverviewDto> {
    return this.http.get<unknown>(`${this.formationsBaseUrl}/stats`).pipe(
      map((response) => this.normalizeFormationsStats(response))
    );
  }

  getFormationStatsById(formationId: number): Observable<FormationSingleStatsDto> {
    return this.http.get<unknown>(`${this.formationsBaseUrl}/${formationId}/stats`).pipe(
      map((response) => this.normalizeFormationStatsById(response, formationId))
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
    const linkedGuideId = this.resolveGuideInteractifId(record);
    const author = this.resolveFormationAuthor(record);

    return {
      id: parsedId,
      titre: this.toOptionalText(record['titre']),
      title: this.toOptionalText(record['title']),
      nom: this.toOptionalText(record['nom']),
      description: this.toOptionalText(record['description']),
      coverImageUrl: this.toOptionalText(
        record['coverImageUrl']
        ?? record['coverUrl']
        ?? record['imagePrincipale']
        ?? record['mainImageUrl']
      ),
      imagePrincipale: this.toOptionalText(
        record['imagePrincipale']
        ?? record['mainImageUrl']
        ?? record['coverImageUrl']
      ),
      imageUrl: this.toOptionalText(record['imageUrl'] ?? record['image'] ?? record['thumbnailUrl']),
      photoUrl: this.toOptionalText(record['photoUrl'] ?? record['photo'] ?? record['illustrationUrl']),
      coverVideoUrl: this.toOptionalText(
        record['coverVideoUrl']
        ?? record['videoPrincipale']
        ?? record['mainVideoUrl']
        ?? record['videoUrl']
      ),
      videoPrincipale: this.toOptionalText(
        record['videoPrincipale']
        ?? record['mainVideoUrl']
        ?? record['videoUrl']
      ),
      videoUrl: this.toOptionalText(record['videoUrl'] ?? record['video'] ?? record['videoLink']),
      objectifs: this.toOptionalStringArray(record['objectifs']),
      objectives: this.toOptionalStringArray(record['objectives']),
      contenu: this.toOptionalText(record['contenu']),
      content: this.toOptionalText(record['content']),
      sections: this.toOptionalSections(record['sections']),
      resume: this.toOptionalText(record['resume']),
      summary: this.toOptionalText(record['summary']),
      level: this.toOptionalText(record['level']) || this.toOptionalText(record['niveau']),
      role: this.toOptionalText(record['role']),
      targetUser: this.toOptionalText(record['targetUser']),
      estimatedDuration: this.toOptionalText(record['estimatedDuration'])
        || this.toOptionalText(record['dureeEstimee'])
        || this.durationToText(record['duration']),
      duration: this.toPositiveNumber(record['duration']) ?? undefined,
      statut: this.toOptionalText(record['statut']) || this.toOptionalText(record['status']),
      status: this.toOptionalText(record['status']) || this.toOptionalText(record['statut']),
      quiz: this.toOptionalQuiz(record['quiz']),
      dateCreation: this.toOptionalText(record['dateCreation']),
      createdAt: this.toOptionalText(record['createdAt']),
      dateModification: this.toOptionalText(record['dateModification']),
      updatedAt: this.toOptionalText(record['updatedAt']),
      guideId: linkedGuideId,
      guideInteractifId: linkedGuideId,
      createdBy: author,
      createdById: author?.id,
      createdByNom: author?.nom,
      createdByEmail: author?.email,
      auteur: author,
      auteurId: author?.id,
      auteurEmail: author?.email,
      auteurNom: author?.nom,
      generatedByAi: this.toOptionalBoolean(record['generatedByAi']) ?? this.toOptionalBoolean(record['aiGenerated']) ?? undefined,
      aiGenerated: this.toOptionalBoolean(record['aiGenerated']) ?? this.toOptionalBoolean(record['generatedByAi']) ?? undefined,
      likesCount: this.toNonNegativeInteger(
        record['likesCount']
        ?? record['likeCount']
        ?? record['totalLikes']
      ) ?? undefined,
      favoriteCount: this.toNonNegativeInteger(
        record['favoriteCount']
        ?? record['favoritesCount']
        ?? record['totalFavorites']
      ) ?? undefined,
      likedByCurrentUser: this.toOptionalBoolean(
        record['likedByCurrentUser']
        ?? record['liked']
        ?? record['isLiked']
      ) ?? undefined,
      isFavorite: this.toOptionalBoolean(
        record['isFavorite']
        ?? record['favorite']
        ?? record['favori']
      ) ?? undefined,
      guideProgressPercent: this.toOptionalProgressPercent(
        record['guideProgressPercent']
        ?? record['progressPercent']
        ?? record['guideProgress']
        ?? record['progressionGuide']
      )
    };
  }

  private resolveGuideInteractifId(record: Record<string, unknown>): number | undefined {
    const directCandidates = [
      record['guideInteractifId'],
      record['guideId'],
      record['interactiveGuideId'],
      record['linkedGuideId'],
      record['guide_interactif_id']
    ];

    for (const candidate of directCandidates) {
      const parsed = this.toPositiveNumber(candidate);
      if (typeof parsed === 'number' && parsed > 0) {
        return parsed;
      }
    }

    const nestedCandidates = [
      this.asRecord(record['guideInteractif']),
      this.asRecord(record['guideLink'])
    ];
    for (const nested of nestedCandidates) {
      if (!nested) {
        continue;
      }
      const parsed = this.toPositiveNumber(nested['id'] ?? nested['guideId'] ?? nested['formationGuideId']);
      if (typeof parsed === 'number' && parsed > 0) {
        return parsed;
      }
    }

    return undefined;
  }

  private resolveFormationAuthor(record: Record<string, unknown>): FormationAuthorRef | undefined {
    const nestedAuthor = this.toFormationAuthorRef(
      record['createdBy']
      ?? record['auteur']
      ?? record['author']
      ?? record['creator']
    );

    const authorIdCandidate = this.toPositiveNumber(
      record['createdById']
      ?? record['auteurId']
      ?? record['authorId']
      ?? record['creatorId']
    );
    const authorId = typeof authorIdCandidate === 'number' && authorIdCandidate > 0
      ? authorIdCandidate
      : nestedAuthor?.id;

    const authorName = this.toOptionalText(
      record['createdByNom']
      ?? record['createdByName']
      ?? record['auteurNom']
      ?? record['authorName']
      ?? record['creatorName']
    ) ?? nestedAuthor?.nom;

    const authorEmail = this.toOptionalText(
      record['createdByEmail']
      ?? record['auteurEmail']
      ?? record['authorEmail']
      ?? record['creatorEmail']
    ) ?? nestedAuthor?.email;

    const authorRole = this.toOptionalText(
      record['createdByRole']
      ?? record['auteurRole']
      ?? record['authorRole']
      ?? record['creatorRole']
    ) ?? nestedAuthor?.role;

    if (!authorId && !authorName && !authorEmail && !authorRole) {
      return undefined;
    }

    return {
      id: authorId,
      nom: authorName,
      email: authorEmail,
      role: authorRole
    };
  }

  private toFormationAuthorRef(value: unknown): FormationAuthorRef | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      const cleaned = value.trim();
      if (!cleaned) {
        return null;
      }

      return cleaned.includes('@')
        ? { email: cleaned }
        : { nom: cleaned };
    }

    const record = this.asRecord(value);
    if (!record) {
      return null;
    }

    const parsedId = this.toPositiveNumber(
      record['id']
      ?? record['userId']
      ?? record['utilisateurId']
    );
    const id = typeof parsedId === 'number' && parsedId > 0 ? parsedId : undefined;
    const nom = this.toOptionalText(record['nom'] ?? record['name'] ?? record['username']);
    const email = this.toOptionalText(record['email']);
    const role = this.toOptionalText(record['role']);

    if (!id && !nom && !email && !role) {
      return null;
    }

    return { id, nom, email, role };
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

  private toOptionalBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'oui') {
        return true;
      }
      if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'non') {
        return false;
      }
    }

    return undefined;
  }

  private normalizeListQuery(
    pageOrQuery: number | FormationListQuery,
    sizeValue: number
  ): Required<FormationListQuery> {
    if (typeof pageOrQuery === 'number') {
      return {
        page: Math.max(0, pageOrQuery),
        size: this.normalizePageSize(sizeValue),
        search: '',
        level: '',
        status: ''
      };
    }

    return {
      page: Math.max(0, Number(pageOrQuery.page ?? 0)),
      size: this.normalizePageSize(Number(pageOrQuery.size ?? sizeValue)),
      search: this.toOptionalText(pageOrQuery.search) ?? '',
      level: this.normalizeLevel(pageOrQuery.level),
      status: this.normalizeStatus(pageOrQuery.status)
    };
  }

  private applyClientSideFilters(
    result: FormationListResult,
    query: Required<FormationListQuery>
  ): FormationListResult {
    if (!query.search && !query.level && !query.status) {
      return result;
    }

    const searchLower = this.normalizeText(query.search);
    const filtered = result.items.filter((item) => {
      if (query.search) {
        if (!this.matchesSearch(item, searchLower)) {
          return false;
        }
      }

      if (query.level) {
        const normalizedLevel = this.normalizeLevel(item.level);
        if (normalizedLevel !== query.level) {
          return false;
        }
      }

      if (query.status) {
        const normalizedStatus = this.normalizeStatus(item.status || item.statut);
        if (normalizedStatus !== query.status) {
          return false;
        }
      }

      return true;
    });

    const sorted = query.search
      ? [...filtered].sort((first, second) => {
        const firstScore = this.getSearchScore(first, searchLower);
        const secondScore = this.getSearchScore(second, searchLower);
        if (firstScore !== secondScore) {
          return secondScore - firstScore;
        }
        return second.id - first.id;
      })
      : filtered;

    return {
      ...result,
      items: sorted,
      totalElements: sorted.length
    };
  }

  private normalizeLevel(level: unknown): FormationLevel | '' {
    const value = this.toOptionalText(level)?.toUpperCase() ?? '';
    if (value === 'BEGINNER' || value === 'INTERMEDIATE' || value === 'ADVANCED') {
      return value;
    }
    return '';
  }

  private normalizeStatus(status: unknown): FormationStatus | '' {
    const value = this.toOptionalText(status)?.toUpperCase() ?? '';
    if (value === 'DRAFT' || value === 'PUBLISHED' || value === 'ARCHIVED') {
      return value;
    }
    return '';
  }

  private toOptionalStringArray(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }

    const normalized = value
      .map((entry) => this.toOptionalText(entry))
      .filter((entry): entry is string => !!entry);

    return normalized.length > 0 ? normalized : undefined;
  }

  private toOptionalSections(value: unknown): FormationSummaryDto['sections'] {
    if (!Array.isArray(value)) {
      return undefined;
    }

    const sections = value
      .map((section) => {
        const record = this.asRecord(section);
        if (!record) {
          return null;
        }

        const title = this.toOptionalText(record['title']) || 'Section';
        const content = this.toOptionalText(record['content']) || '';
        if (!content) {
          return null;
        }

        const explicitMediaType = this.toOptionalText(record['mediaType'])?.toUpperCase();
        const fallbackMediaType = this.toOptionalText(record['videoUrl']) || this.toOptionalText(record['video'])
          ? 'VIDEO'
          : 'IMAGE';
        const mediaType: 'IMAGE' | 'VIDEO' = explicitMediaType === 'VIDEO'
          ? 'VIDEO'
          : explicitMediaType === 'IMAGE'
            ? 'IMAGE'
            : fallbackMediaType;
        const mediaUrl = this.toOptionalText(
          record['mediaUrl']
          ?? record['imageUrl']
          ?? record['videoUrl']
          ?? record['video']
          ?? record['url']
        );

        return {
          title,
          content,
          mediaType,
          mediaUrl: mediaUrl || undefined
        };
      })
      .filter((item) => item !== null) as Array<{
        title: string;
        content: string;
        mediaType: 'IMAGE' | 'VIDEO';
        mediaUrl?: string;
      }>;

    return sections.length > 0 ? sections : undefined;
  }

  private toOptionalQuiz(value: unknown): FormationSummaryDto['quiz'] {
    if (!Array.isArray(value)) {
      return undefined;
    }

    const quizItems = value
      .map((item) => {
        const record = this.asRecord(item);
        if (!record) {
          return null;
        }

        const question = this.toOptionalText(record['question']) || '';
        const choices = this.toOptionalStringArray(record['choices']) || [];
        const correctAnswer = this.toOptionalText(record['correctAnswer']) || '';

        if (!question || choices.length === 0 || !correctAnswer) {
          return null;
        }

        return { question, choices, correctAnswer };
      })
      .filter((item): item is { question: string; choices: string[]; correctAnswer: string } => item !== null);

    return quizItems.length > 0 ? quizItems : undefined;
  }

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private matchesSearch(item: FormationSummaryDto, search: string): boolean {
    const title = this.normalizeText(item.titre || item.title || item.nom || '');
    const description = this.normalizeText(item.description || '');
    const combined = `${title} ${description}`.trim();
    const tokens = search.split(' ').filter(Boolean);

    if (title.startsWith(search)) {
      return true;
    }

    if (title.split(' ').some((word) => word.startsWith(search))) {
      return true;
    }

    if (title.includes(search) || description.includes(search)) {
      return true;
    }

    if (tokens.length > 1 && tokens.every((token) => combined.includes(token))) {
      return true;
    }

    return false;
  }

  private getSearchScore(item: FormationSummaryDto, search: string): number {
    const title = this.normalizeText(item.titre || item.title || item.nom || '');
    const description = this.normalizeText(item.description || '');
    let score = 0;

    if (title.startsWith(search)) {
      score += 100;
    } else if (title.split(' ').some((word) => word.startsWith(search))) {
      score += 70;
    } else if (title.includes(search)) {
      score += 40;
    }

    if (description.includes(search)) {
      score += 10;
    }

    return score;
  }

  private durationToText(value: unknown): string | undefined {
    const duration = this.toPositiveNumber(value);
    if (duration === null) {
      return undefined;
    }
    return `${duration} minutes`;
  }

  private toOptionalProgressPercent(value: unknown): number | undefined {
    const parsed = this.toPositiveNumber(value);
    if (parsed === null) {
      return undefined;
    }

    return Math.max(0, Math.min(100, parsed));
  }

  private toNonNegativeInteger(value: unknown): number | null {
    const parsed = this.toPositiveNumber(value);
    if (parsed === null) {
      return null;
    }
    return Math.max(0, Math.floor(parsed));
  }

  private normalizePageSize(value: number): number {
    return Math.min(100, Math.max(1, Number.isFinite(value) ? Math.floor(value) : 10));
  }

  private normalizeFormationsStats(payload: unknown): FormationStatsOverviewDto {
    const record = this.asRecord(payload);
    if (!record) {
      return this.emptyFormationsStats();
    }

    const kpiSource = this.asRecord(record['kpi']) ?? record;

    const totalFormations = this.toPositiveNumber(
      kpiSource['totalFormations']
      ?? kpiSource['formationsTotal']
      ?? kpiSource['total']
    ) ?? 0;

    const totalUsers = this.toPositiveNumber(
      kpiSource['totalUsers']
      ?? kpiSource['usersTotal']
      ?? kpiSource['utilisateursTotal']
    ) ?? 0;

    const totalLikes = this.toPositiveNumber(
      kpiSource['totalLikes']
      ?? kpiSource['likesTotal']
      ?? kpiSource['likes']
    ) ?? 0;

    const publishedFormations = this.toPositiveNumber(
      kpiSource['publishedFormations']
      ?? kpiSource['publishedCount']
      ?? kpiSource['formationsPubliees']
    ) ?? 0;

    const draftFormations = this.toPositiveNumber(
      kpiSource['draftFormations']
      ?? kpiSource['draftCount']
      ?? kpiSource['formationsBrouillon']
    ) ?? 0;

    const topViewed = this.normalizeStatsBarItems(
      record['topViewedFormations']
      ?? record['topViewed']
      ?? record['mostViewed']
      ?? record['formationsMostViewed']
      ?? record['formationsPlusVues']
    );

    const topLiked = this.normalizeStatsBarItems(
      record['topLikedFormations']
      ?? record['topLiked']
      ?? record['mostLiked']
      ?? record['formationsMostLiked']
      ?? record['formationsPlusLikees']
    );

    const guideProgressRecord = this.asRecord(
      record['guideProgressDistribution']
      ?? record['guideProgress']
      ?? record['guideProgression']
      ?? record['guideDistribution']
    );

    const guideCompletedCount = this.toPositiveNumber(
      guideProgressRecord?.['completed']
      ?? guideProgressRecord?.['completedCount']
      ?? guideProgressRecord?.['termine']
      ?? guideProgressRecord?.['finished']
    ) ?? 0;
    const guideInProgressCount = this.toPositiveNumber(
      guideProgressRecord?.['inProgress']
      ?? guideProgressRecord?.['inProgressCount']
      ?? guideProgressRecord?.['enCours']
      ?? guideProgressRecord?.['ongoing']
    ) ?? 0;
    const guideNotStartedCount = this.toPositiveNumber(
      guideProgressRecord?.['notStarted']
      ?? guideProgressRecord?.['notStartedCount']
      ?? guideProgressRecord?.['nonCommence']
      ?? guideProgressRecord?.['pending']
    ) ?? 0;

    const viewsTimeline = this.normalizeStatsLineItems(
      record['viewsEvolution']
      ?? record['viewsTimeline']
      ?? record['viewsOverTime']
      ?? record['evolutionVues']
    );

    return {
      kpi: {
        totalFormations,
        totalUsers,
        totalLikes,
        publishedFormations,
        draftFormations
      },
      topViewed,
      topLiked,
      guideProgress: {
        completed: guideCompletedCount,
        inProgress: guideInProgressCount,
        notStarted: guideNotStartedCount
      },
      viewsTimeline
    };
  }

  private normalizeFormationStatsById(payload: unknown, formationId: number): FormationSingleStatsDto {
    const record = this.asRecord(payload);
    if (!record) {
      return {
        formationId,
        title: `Formation #${formationId}`,
        viewsCount: 0,
        likesCount: 0,
        completionRate: 0,
        averageProgress: 0,
        averageQuizScore: 0,
        viewsEvolution: []
      };
    }

    const parsedId = this.toPositiveNumber(record['formationId'] ?? record['id']) ?? formationId;
    const title = this.toOptionalText(record['title'])
      || this.toOptionalText(record['titre'])
      || this.toOptionalText(record['nom'])
      || `Formation #${parsedId}`;
    const viewsCount = this.toPositiveNumber(
      record['viewsCount']
      ?? record['views']
      ?? record['vues']
    ) ?? 0;
    const likesCount = this.toPositiveNumber(
      record['likesCount']
      ?? record['likes']
      ?? record['likeCount']
    ) ?? 0;
    const completionRate = this.toPositiveNumber(record['completionRate']) ?? 0;
    const averageProgress = this.toPositiveNumber(record['averageProgress']) ?? 0;
    const averageQuizScore = this.toPositiveNumber(record['averageQuizScore']) ?? 0;
    const viewsEvolution = this.normalizeStatsLineItems(
      record['viewsEvolution']
      ?? record['viewsTimeline']
    );

    return {
      formationId: parsedId,
      title,
      viewsCount,
      likesCount,
      completionRate: Math.max(0, Math.min(100, completionRate)),
      averageProgress: Math.max(0, Math.min(100, averageProgress)),
      averageQuizScore: Math.max(0, Math.min(100, averageQuizScore)),
      viewsEvolution
    };
  }

  private normalizeStatsBarItems(rawValue: unknown): FormationStatsBarItemDto[] {
    if (!Array.isArray(rawValue)) {
      return [];
    }

    return rawValue
      .map((item, index) => {
        const record = this.asRecord(item);
        if (!record) {
          return null;
        }

        const formationId = this.toPositiveNumber(record['formationId'] ?? record['id']) ?? (index + 1);
        const title = this.toOptionalText(record['title'])
          || this.toOptionalText(record['titre'])
          || this.toOptionalText(record['nom'])
          || `Formation #${formationId}`;
        const value = this.toPositiveNumber(
          record['value']
          ?? record['count']
          ?? record['viewsCount']
          ?? record['likesCount']
          ?? record['views']
          ?? record['likes']
          ?? record['total']
        ) ?? 0;

        return {
          formationId,
          title,
          value
        };
      })
      .filter((item): item is FormationStatsBarItemDto => item !== null);
  }

  private normalizeStatsLineItems(rawValue: unknown): FormationStatsLinePointDto[] {
    if (!Array.isArray(rawValue)) {
      return [];
    }

    return rawValue
      .map((item, index) => {
        const record = this.asRecord(item);
        if (!record) {
          return null;
        }

        const value = this.toPositiveNumber(
          record['value']
          ?? record['views']
          ?? record['count']
          ?? record['vues']
        ) ?? 0;

        const label = this.toOptionalText(
          record['label']
          ?? record['date']
          ?? record['day']
          ?? record['period']
        ) || `Point ${index + 1}`;

        return { label, value };
      })
      .filter((item): item is FormationStatsLinePointDto => item !== null);
  }

  private emptyFormationsStats(): FormationStatsOverviewDto {
    return {
      kpi: {
        totalFormations: 0,
        totalUsers: 0,
        totalLikes: 0,
        publishedFormations: 0,
        draftFormations: 0
      },
      topViewed: [],
      topLiked: [],
      guideProgress: {
        completed: 0,
        inProgress: 0,
        notStarted: 0
      },
      viewsTimeline: []
    };
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

  private isGuideForeignKeyError(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }

    if (error.status !== 500 && error.status !== 409 && error.status !== 400) {
      return false;
    }

    const rawMessage = this.extractBackendErrorMessage(error.error).toLowerCase();
    if (!rawMessage) {
      return false;
    }

    return rawMessage.includes('cannot delete or update a parent row')
      || rawMessage.includes('foreign key constraint fails')
      || rawMessage.includes('guide_interactif')
      || rawMessage.includes('formation_id');
  }

  private deleteGuideDependenciesAndRetryFormationDelete(
    formationId: number,
    originalError: HttpErrorResponse
  ): Observable<void> {
    return this.deleteGuideDependenciesForFormation(formationId, 0).pipe(
      switchMap(() => this.http.delete<void>(`${this.formationsBaseUrl}/${formationId}`)),
      catchError(() => throwError(() => originalError))
    );
  }

  private deleteGuideDependenciesForFormation(formationId: number, index: number): Observable<void> {
    const endpoints = this.buildGuideDeleteCandidates(formationId);
    if (index >= endpoints.length) {
      return of(void 0);
    }

    return this.http.delete<void>(endpoints[index]).pipe(
      catchError((error) => {
        if (!(error instanceof HttpErrorResponse)) {
          return this.deleteGuideDependenciesForFormation(formationId, index + 1);
        }

        if (error.status === 404 || error.status === 405 || error.status === 400 || error.status === 500) {
          return this.deleteGuideDependenciesForFormation(formationId, index + 1);
        }

        return throwError(() => error);
      })
    );
  }

  private buildGuideDeleteCandidates(formationId: number): string[] {
    return [
      `${this.backendBaseUrl}/api/guides/formations/${formationId}`,
      `${this.backendBaseUrl}/api/guides/formation/${formationId}`,
      `${this.backendBaseUrl}/api/guides/by-formation/${formationId}`,
      `${this.backendBaseUrl}/api/guides/${formationId}/formation`
    ];
  }
}
