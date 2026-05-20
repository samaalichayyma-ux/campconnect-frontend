import { CommonModule } from '@angular/common';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType
} from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import {
  AnalyzeFormationRequestDto,
  AnalyzeFormationResponseDto,
  FormationGenerateRequestDto,
  FormationGenerateResponseDto,
  FormationSectionDto,
  FormationQuizItemDto
} from '../models/formation-ai.model';
import { FormationSummaryDto } from '../models/formation.model';
import { FormationMediaResponseDto } from '../models/formation-media.model';
import { FormationService } from '../services/formation.service';

@Component({
  selector: 'app-formation-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './formation-management.component.html',
  styleUrl: './formation-management.component.css'
})
export class FormationManagementComponent implements OnInit, OnDestroy {
  @ViewChild('mediaInput') mediaInput?: ElementRef<HTMLInputElement>;

  readonly fallbackImageUrl = 'assets/images/default-image.jpg';
  readonly acceptedFileTypes = 'image/*,video/*';
  readonly aiLevelOptions = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
  readonly allowedBusinessRoles = new Set(['ADMINISTRATEUR', 'ADMIN', 'GUIDE', 'CLIENT']);
  private readonly localTitleSuggestions = [
    'Gestion des reservations camping',
    'Securite en camping',
    'Accueil client en plein air',
    'Organisation d activites de plein air',
    'Maintenance des equipements de camping'
  ];
  private titleSuggestionTimeoutId: ReturnType<typeof setTimeout> | null = null;

  formationId: number | null = null;
  mediaList: FormationMediaResponseDto[] = [];
  formations: FormationSummaryDto[] = [];
  generatedSections: FormationSectionDto[] = [];
  generatedQuiz: FormationQuizItemDto[] = [];

  selectedFile: File | null = null;
  selectedFileName = '';
  uploadProgress = 0;
  isUploading = false;
  isCreating = false;
  isGeneratingAi = false;
  isAnalyzingQuality = false;
  isGeneratingQuiz = false;
  isLoading = false;
  isLoadingFormations = false;
  isLoadingSuggestions = false;
  deleteInProgress = new Set<number>();
  showCreateForm = false;
  showTitleSuggestions = false;

  formationIdInput = '';
  newFormationTitle = '';
  newFormationDescription = '';
  newFormationContent = '';
  newFormationSummary = '';
  newFormationObjectives: string[] = [];
  newFormationObjectivesInput = '';
  newFormationLevel = 'BEGINNER';
  estimatedDuration = '';

  aiSubject = '';
  aiLevel = 'BEGINNER';
  connectedUserRole = 'CLIENT';

  titleSuggestions: string[] = [];

  analysisResult: AnalyzeFormationResponseDto | null = null;

  creationMessage = '';
  aiMessage = '';
  analysisMessage = '';
  quizMessage = '';

  isAdminMode = false;

  pageMessage = '';
  formationsMessage = '';
  uploadMessage = '';
  deleteMessage = '';
  formationsPage = 0;
  readonly formationsPageSize = 8;
  totalFormations = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private formationService: FormationService
  ) {}

  ngOnInit(): void {
    this.isAdminMode = this.authService.canManageEvents();
    this.syncConnectedUserRole();
    this.resolveFormationId();

    if (this.formationId) {
      this.loadMediaGallery();
    }
  }

  private syncConnectedUserRole(): void {
    const currentRole = this.authService.getRole();
    if (this.allowedBusinessRoles.has(currentRole)) {
      this.connectedUserRole = currentRole;
      return;
    }

    this.connectedUserRole = 'CLIENT';
  }

  ngOnDestroy(): void {
    if (this.titleSuggestionTimeoutId) {
      clearTimeout(this.titleSuggestionTimeoutId);
      this.titleSuggestionTimeoutId = null;
    }
  }

  resolveMediaUrl(mediaUrl: string): string {
    return this.formationService.resolveMediaUrl(mediaUrl);
  }

  isVideo(media: FormationMediaResponseDto): boolean {
    return media.mediaType === 'VIDEO' || media.mimeType.startsWith('video/');
  }

  trackByMediaId(_index: number, media: FormationMediaResponseDto): number {
    return media.id;
  }

  get currentGuideStep(): number {
    if (!this.newFormationTitle.trim()) {
      return 1;
    }
    if (!this.newFormationDescription.trim()) {
      return 2;
    }
    if (!this.newFormationContent.trim()) {
      return 3;
    }
    if (this.generatedQuiz.length === 0) {
      return 4;
    }
    return 5;
  }

  get hasDraftPreview(): boolean {
    return this.newFormationTitle.trim().length > 0
      || this.newFormationDescription.trim().length > 0
      || this.generatedSections.length > 0
      || this.newFormationObjectives.length > 0
      || this.generatedQuiz.length > 0;
  }

  get currentGuideTip(): string {
    switch (this.currentGuideStep) {
      case 1:
        return 'Etape 1: saisissez un titre ou utilisez la generation IA.';
      case 2:
        return 'Etape 2: ajoutez une description pedagogique claire.';
      case 3:
        return 'Etape 3: completez le contenu principal de la formation.';
      case 4:
        return 'Etape 4: ajoutez ou generez un quiz pour valider les acquis.';
      default:
        return 'Etape 5: analysez la qualite, puis validez la creation.';
    }
  }

  isGuideStepCompleted(stepNumber: number): boolean {
    switch (stepNumber) {
      case 1:
        return this.newFormationTitle.trim().length > 0;
      case 2:
        return this.newFormationDescription.trim().length > 0;
      case 3:
        return this.newFormationContent.trim().length > 0;
      case 4:
        return this.generatedQuiz.length > 0;
      case 5:
        return this.analysisResult !== null;
      default:
        return false;
    }
  }

  getLevelLabel(level: string): string {
    switch (level) {
      case 'ADVANCED':
        return 'Avance';
      case 'INTERMEDIATE':
        return 'Intermediaire';
      case 'BEGINNER':
      default:
        return 'Debutant';
    }
  }

  onMediaSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    this.uploadMessage = '';
    this.deleteMessage = '';

    if (!file) {
      this.clearFileSelection();
      return;
    }

    if (!this.isSupportedMediaType(file)) {
      this.clearFileSelection();
      this.uploadMessage = this.getHttpErrorMessage(415, 'upload');
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
  }

  uploadSelectedMedia(): void {
    if (!this.isAdminMode || !this.formationId || !this.selectedFile || this.isUploading) {
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadMessage = '';
    this.deleteMessage = '';

    this.formationService.uploadMedia(this.formationId, this.selectedFile).subscribe({
      next: (event: HttpEvent<FormationMediaResponseDto>) => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total ?? this.selectedFile?.size ?? 0;
          this.uploadProgress = total > 0 ? Math.round((event.loaded / total) * 100) : 0;
        }

        if (event.type === HttpEventType.Response) {
          this.uploadProgress = 100;
          this.isUploading = false;
          this.clearFileSelection();
          this.loadMediaGallery();
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isUploading = false;
        this.uploadMessage = this.getHttpErrorMessage(error.status, 'upload');
      }
    });
  }

  deleteMedia(media: FormationMediaResponseDto): void {
    if (!this.isAdminMode || !this.formationId || this.deleteInProgress.has(media.id)) {
      return;
    }

    this.deleteMessage = '';
    this.uploadMessage = '';
    this.deleteInProgress.add(media.id);

    this.formationService.deleteFormationMedia(this.formationId, media.id).subscribe({
      next: () => {
        this.deleteInProgress.delete(media.id);
        this.mediaList = this.mediaList.filter((item) => item.id !== media.id);
      },
      error: (error: HttpErrorResponse) => {
        this.deleteInProgress.delete(media.id);
        this.deleteMessage = this.getHttpErrorMessage(error.status, 'delete');
      }
    });
  }

  onTitleInput(value: string): void {
    this.newFormationTitle = value;
    this.creationMessage = '';
    this.analysisMessage = '';

    if (this.titleSuggestionTimeoutId) {
      clearTimeout(this.titleSuggestionTimeoutId);
      this.titleSuggestionTimeoutId = null;
    }

    const trimmedValue = value.trim();
    if (trimmedValue.length < 2) {
      this.titleSuggestions = [];
      this.showTitleSuggestions = false;
      this.isLoadingSuggestions = false;
      return;
    }

    this.isLoadingSuggestions = true;
    this.titleSuggestionTimeoutId = setTimeout(() => {
      this.fetchTitleSuggestions(trimmedValue);
    }, 250);
  }

  onTitleFocus(): void {
    if (this.titleSuggestions.length > 0) {
      this.showTitleSuggestions = true;
    }
  }

  onTitleBlur(): void {
    setTimeout(() => {
      this.showTitleSuggestions = false;
    }, 120);
  }

  selectTitleSuggestion(suggestion: string): void {
    this.newFormationTitle = suggestion;
    this.showTitleSuggestions = false;
  }

  generateWithAi(): void {
    const subject = (this.aiSubject.trim() || this.newFormationTitle.trim());
    if (!subject) {
      this.aiMessage = 'Entrez un sujet avant de lancer la generation IA.';
      return;
    }

    if (this.isGeneratingAi) {
      return;
    }

    this.isGeneratingAi = true;
    this.aiMessage = '';
    this.analysisResult = null;
    this.analysisMessage = '';

    const request: FormationGenerateRequestDto = {
      subject,
      level: this.aiLevel,
      targetUser: this.connectedUserRole
    };

    this.formationService.generateFormationWithAi(request).subscribe({
      next: (response: FormationGenerateResponseDto) => {
        this.isGeneratingAi = false;
        this.applyGeneratedFormation(response, false);
      },
      error: () => {
        this.isGeneratingAi = false;
        const fallbackResponse = this.buildMockGeneratedFormation(request);
        this.applyGeneratedFormation(fallbackResponse, true);
      }
    });
  }

  openFormationById(): void {
    const parsedId = Number.parseInt(this.formationIdInput.trim(), 10);
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      this.pageMessage = 'Saisissez un ID formation valide.';
      return;
    }

    const targetRoute = this.isAdminMode
      ? ['/admin/formations', parsedId]
      : ['/public/formations', parsedId];
    this.router.navigate(targetRoute);
  }

  trackByFormationId(_index: number, formation: FormationSummaryDto): number {
    return formation.id;
  }

  get hasPreviousFormationPage(): boolean {
    return this.formationsPage > 0;
  }

  get hasNextFormationPage(): boolean {
    return (this.formationsPage + 1) * this.formationsPageSize < this.totalFormations;
  }

  openFormationFromList(formation: FormationSummaryDto): void {
    if (!formation.id || formation.id <= 0) {
      return;
    }

    this.formationIdInput = String(formation.id);
    this.openFormationById();
  }

  refreshFormations(): void {
    this.loadFormationsFromDatabase(this.formationsPage);
  }

  goToPreviousFormationsPage(): void {
    if (!this.hasPreviousFormationPage || this.isLoadingFormations) {
      return;
    }

    this.loadFormationsFromDatabase(this.formationsPage - 1);
  }

  goToNextFormationsPage(): void {
    if (!this.hasNextFormationPage || this.isLoadingFormations) {
      return;
    }

    this.loadFormationsFromDatabase(this.formationsPage + 1);
  }

  getFormationDisplayTitle(formation: FormationSummaryDto): string {
    return this.safeText(formation.titre)
      || this.safeText(formation.title)
      || this.safeText(formation.nom)
      || `Formation #${formation.id}`;
  }

  getFormationDisplayDate(formation: FormationSummaryDto): string {
    const rawDate = this.safeText(formation.dateCreation) || this.safeText(formation.createdAt);
    if (!rawDate) {
      return '-';
    }

    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime()) ? '-' : parsedDate.toLocaleString();
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.creationMessage = '';
    this.aiMessage = '';
    this.analysisMessage = '';
  }

  analyzeQuality(): void {
    this.syncObjectivesFromInput(this.newFormationObjectivesInput);

    const payload = this.buildAnalyzePayload();
    if (!payload.title || !payload.description) {
      this.analysisMessage = 'Le titre et la description sont obligatoires pour analyser la qualite.';
      this.analysisResult = null;
      return;
    }

    if (this.isAnalyzingQuality) {
      return;
    }

    this.isAnalyzingQuality = true;
    this.analysisMessage = '';

    this.formationService.analyzeFormationDraft(payload).subscribe({
      next: (response: AnalyzeFormationResponseDto) => {
        this.isAnalyzingQuality = false;
        this.analysisResult = {
          score: this.normalizeScore(response.score),
          issues: this.ensureStringArray(response.issues),
          suggestions: this.ensureStringArray(response.suggestions)
        };
      },
      error: () => {
        this.isAnalyzingQuality = false;
        this.analysisResult = this.runLocalQualityAnalysis(payload);
        this.analysisMessage = 'Analyse IA indisponible. Note locale calculee automatiquement.';
      }
    });
  }

  generateQuizForCurrentFormation(): void {
    if (!this.formationId || this.isGeneratingQuiz) {
      return;
    }

    this.isGeneratingQuiz = true;
    this.quizMessage = '';

    this.formationService.generateQuizForFormation(this.formationId).subscribe({
      next: (response) => {
        this.isGeneratingQuiz = false;
        const extractedQuiz = this.extractQuizFromUnknown(response);
        if (extractedQuiz.length === 0) {
          this.generatedQuiz = this.buildFallbackQuizFromDraft();
          this.quizMessage = 'Quiz genere localement (reponse du service vide).';
          return;
        }

        this.generatedQuiz = extractedQuiz;
        this.quizMessage = 'Quiz genere avec succes.';
      },
      error: () => {
        this.isGeneratingQuiz = false;
        this.generatedQuiz = this.buildFallbackQuizFromDraft();
        this.quizMessage = 'Service quiz indisponible. Quiz de secours genere localement.';
      }
    });
  }

  openSimulationMode(): void {
    if (!this.formationId) {
      this.pageMessage = 'Aucune formation chargee pour le mode simulation.';
      return;
    }

    const urlTree = this.router.createUrlTree(['/public/formations', this.formationId]);
    const serializedUrl = this.router.serializeUrl(urlTree);
    window.open(serializedUrl, '_blank', 'noopener');
  }

  createFormation(): void {
    const title = this.newFormationTitle.trim();
    const description = this.newFormationDescription.trim();
    this.syncObjectivesFromInput(this.newFormationObjectivesInput);

    if (!title) {
      this.creationMessage = 'Le titre est obligatoire pour creer une formation.';
      return;
    }

    if (!description) {
      this.creationMessage = 'La description est obligatoire pour creer une formation.';
      return;
    }

    if (this.isCreating) {
      return;
    }

    this.isCreating = true;
    this.creationMessage = '';

    const payload = this.buildCreatePayload(title, description);

    this.formationService.createFormation(payload).subscribe({
      next: (response: Record<string, unknown>) => {
        this.isCreating = false;
        const createdId = this.extractFormationId(response);
        if (createdId) {
          const targetRoute = this.isAdminMode
            ? ['/admin/formations', createdId]
            : ['/public/formations', createdId];
          this.router.navigate(targetRoute);
          return;
        }

        this.creationMessage = 'Formation creee avec succes.';
      },
      error: (error: HttpErrorResponse) => {
        this.isCreating = false;
        this.creationMessage = this.getHttpErrorMessage(error.status, 'create', error.error);
      }
    });
  }

  onImageError(event: Event): void {
    const imageElement = event.target as HTMLImageElement | null;
    if (!imageElement || imageElement.dataset['fallbackApplied'] === 'true') {
      return;
    }

    imageElement.dataset['fallbackApplied'] = 'true';
    imageElement.src = this.fallbackImageUrl;
  }

  formatUploadDate(uploadDate: string): string {
    const parsedDate = new Date(uploadDate);
    return Number.isNaN(parsedDate.getTime()) ? '-' : parsedDate.toLocaleString();
  }

  formatFileSize(fileSize: number): string {
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const unitIndex = Math.min(
      Math.floor(Math.log(fileSize) / Math.log(1024)),
      units.length - 1
    );
    const normalizedValue = fileSize / (1024 ** unitIndex);
    return `${normalizedValue.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }

  private resolveFormationId(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    const queryId = this.route.snapshot.queryParamMap.get('formationId');
    const candidateId = routeId ?? queryId ?? '';
    const parsedId = Number.parseInt(candidateId, 10);

    this.formationId = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;
    this.formationIdInput = this.formationId ? String(this.formationId) : '';
  }

  private loadMediaGallery(): void {
    if (!this.formationId) {
      return;
    }

    this.isLoading = true;
    this.pageMessage = '';
    this.uploadMessage = '';
    this.deleteMessage = '';
    this.quizMessage = '';

    this.formationService.getFormationMedia(this.formationId).subscribe({
      next: (response: FormationMediaResponseDto[]) => {
        this.mediaList = this.formationService.sortByDisplayOrder(response);
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.pageMessage = this.getHttpErrorMessage(error.status, 'load', error.error);
        this.mediaList = [];
        this.isLoading = false;
      }
    });
  }

  private loadFormationsFromDatabase(page = 0): void {
    if (!this.isAdminMode) {
      return;
    }

    this.isLoadingFormations = true;
    this.formationsMessage = '';

    this.formationService.listFormations(page, this.formationsPageSize).subscribe({
      next: (response) => {
        this.formations = response.items;
        this.totalFormations = response.totalElements;
        this.formationsPage = response.page;
        this.isLoadingFormations = false;

        if (response.items.length === 0) {
          this.formationsMessage = 'Aucune formation trouvee en base. Creez votre premiere formation.';
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingFormations = false;
        this.formations = [];
        this.totalFormations = 0;
        this.formationsMessage = this.getHttpErrorMessage(error.status, 'load', error.error);
      }
    });
  }

  private fetchTitleSuggestions(query: string): void {
    this.formationService.suggestFormationTitles(query).subscribe({
      next: (response: string[]) => {
        this.isLoadingSuggestions = false;
        const remoteSuggestions = this.ensureStringArray(response);
        const fallbackSuggestions = this.getLocalTitleSuggestions(query);
        this.titleSuggestions = this.mergeSuggestions(remoteSuggestions, fallbackSuggestions);
        this.showTitleSuggestions = this.titleSuggestions.length > 0;
      },
      error: () => {
        this.isLoadingSuggestions = false;
        this.titleSuggestions = this.getLocalTitleSuggestions(query);
        this.showTitleSuggestions = this.titleSuggestions.length > 0;
      }
    });
  }

  private applyGeneratedFormation(response: FormationGenerateResponseDto, isFallback: boolean): void {
    const safeSections = Array.isArray(response.sections) ? response.sections : [];
    const safeObjectives = this.ensureStringArray(response.objectives);
    const normalizedSections = safeSections
      .map((section) => ({
        title: this.safeText(section.title) || 'Section',
        content: this.safeText(section.content)
      }))
      .filter((section) => section.content.length > 0);

    this.generatedSections = normalizedSections;

    this.newFormationTitle = this.safeText(response.title) || this.newFormationTitle;
    this.newFormationDescription = this.safeText(response.description) || this.newFormationDescription;
    this.newFormationContent = normalizedSections
      .map((section) => {
        return `## ${section.title}\n${section.content}`;
      })
      .join('\n\n')
      .trim();
    this.newFormationSummary = this.safeText(response.summary);
    this.newFormationObjectives = safeObjectives;
    this.newFormationObjectivesInput = safeObjectives.join('\n');
    this.generatedQuiz = this.extractQuizFromUnknown(response.quiz);
    this.newFormationLevel = this.safeText(response.level) || this.aiLevel;
    this.estimatedDuration = this.safeText(response.estimatedDuration);

    this.aiMessage = isFallback
      ? 'Generation IA indisponible pour le moment. Un brouillon pedagogique structure a ete prepare automatiquement.'
      : 'Contenu genere automatiquement avec succes.';
  }

  private buildMockGeneratedFormation(
    request: FormationGenerateRequestDto
  ): FormationGenerateResponseDto {
    const subject = this.normalizeGenerationSubject(this.safeText(request.subject));
    const level = this.safeText(request.level) || 'BEGINNER';
    const targetRole = this.safeText(request.targetUser) || this.connectedUserRole;
    const roleFocus = this.getRolePedagogicFocus(targetRole);
    const levelApproach = this.getLevelApproach(level);

    return {
      title: `Formation ${subject} - ${this.humanizeLevel(level)}`,
      description: `Cette formation aide ${roleFocus} autour de "${subject}" avec une progression ${levelApproach}.`,
      objectives: [
        `Identifier les bases essentielles de ${subject}`,
        'Appliquer une methode operationnelle pas a pas sur le terrain',
        'Verifier les acquis avec une auto-evaluation finale'
      ],
      sections: [
        {
          title: 'Contexte et objectifs',
          content: `Presentation des enjeux de ${subject}, du public cible et des resultats attendus dans CampConnect.`
        },
        {
          title: 'Procedure operationnelle',
          content: 'Deroulement par etapes: preparation, execution, verification et trace des actions effectuees.'
        },
        {
          title: 'Bonnes pratiques et erreurs a eviter',
          content: 'Points de vigilance, incidents frequents, recommandations concretes et liste de controle finale.'
        }
      ],
      summary: 'Parcours structure en 3 blocs: comprendre, appliquer et controler la qualite.',
      quiz: this.buildFallbackQuizFromDraft(subject),
      level,
      estimatedDuration: level === 'ADVANCED' ? '75 minutes' : level === 'INTERMEDIATE' ? '60 minutes' : '45 minutes'
    };
  }

  private buildAnalyzePayload(): AnalyzeFormationRequestDto {
    return {
      title: this.newFormationTitle.trim(),
      description: this.newFormationDescription.trim(),
      content: this.newFormationContent.trim(),
      objectives: [...this.newFormationObjectives],
      summary: this.newFormationSummary.trim(),
      quiz: [...this.generatedQuiz]
    };
  }

  private runLocalQualityAnalysis(payload: AnalyzeFormationRequestDto): AnalyzeFormationResponseDto {
    let score = 100;
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (payload.title.length < 8) {
      score -= 12;
      issues.push('Titre trop court');
      suggestions.push('Ajoutez un titre plus specifique et explicite.');
    }

    if (payload.description.length < 80) {
      score -= 20;
      issues.push('Description trop courte');
      suggestions.push('Ajoutez contexte, public cible et valeur pedagogique.');
    }

    if (payload.content.length < 180) {
      score -= 22;
      issues.push('Contenu pedagogique insuffisant');
      suggestions.push('Detaillez les etapes et ajoutez un exemple concret.');
    }

    if (payload.objectives.length < 2) {
      score -= 16;
      issues.push('Objectifs pedagogiques incomplets');
      suggestions.push('Ajoutez au moins deux objectifs mesurables.');
    }

    if (payload.quiz.length < 3) {
      score -= 18;
      issues.push('Quiz incomplet');
      suggestions.push('Ajoutez au moins 3 questions pour evaluer les acquis.');
    }

    if (issues.length === 0) {
      suggestions.push('Contenu coherent. Vous pouvez publier la formation.');
    }

    return {
      score: this.normalizeScore(score),
      issues,
      suggestions
    };
  }

  private buildCreatePayload(
    title: string,
    description: string
  ): Record<string, unknown> {
    return {
      titre: title,
      description
    };
  }

  syncObjectivesFromInput(value: string): void {
    this.newFormationObjectivesInput = value;
    const parsedObjectives = value
      .split(/\r?\n|,/g)
      .map((entry) => entry.replace(/^[-*]\s*/, '').trim())
      .filter((entry) => entry.length > 0);
    this.newFormationObjectives = Array.from(new Set(parsedObjectives));
  }

  private clearFileSelection(): void {
    this.selectedFile = null;
    this.selectedFileName = '';
    if (this.mediaInput?.nativeElement) {
      this.mediaInput.nativeElement.value = '';
    }
  }

  private isSupportedMediaType(file: File): boolean {
    return file.type.startsWith('image/') || file.type.startsWith('video/');
  }

  private extractFormationId(response: Record<string, unknown>): number | null {
    const rawId = response['id'] ?? response['formationId'];
    const parsedId = typeof rawId === 'string' ? Number.parseInt(rawId, 10) : rawId;
    return typeof parsedId === 'number' && Number.isFinite(parsedId) && parsedId > 0
      ? parsedId
      : null;
  }

  private extractQuizFromUnknown(value: unknown): FormationQuizItemDto[] {
    if (Array.isArray(value)) {
      return value
        .map((entry) => this.toQuizItem(entry))
        .filter((entry): entry is FormationQuizItemDto => entry !== null);
    }

    if (value && typeof value === 'object' && 'quiz' in value) {
      const nestedQuiz = (value as { quiz?: unknown }).quiz;
      return this.extractQuizFromUnknown(nestedQuiz);
    }

    return [];
  }

  private toQuizItem(value: unknown): FormationQuizItemDto | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const candidate = value as {
      question?: unknown;
      choices?: unknown;
      correctAnswer?: unknown;
    };

    const question = this.safeText(candidate.question);
    const choices = this.ensureStringArray(candidate.choices);
    const correctAnswer = this.safeText(candidate.correctAnswer);

    if (!question || choices.length === 0 || !correctAnswer) {
      return null;
    }

    return {
      question,
      choices,
      correctAnswer
    };
  }

  private buildFallbackQuizFromDraft(subject?: string): FormationQuizItemDto[] {
    const normalizedSubject = this.normalizeGenerationSubject(this.safeText(subject))
      || this.newFormationTitle.trim()
      || 'la formation';

    return [
      {
        question: `Quel est l objectif principal de ${normalizedSubject} ?`,
        choices: ['Ameliorer la comprehension', 'Ignorer les bonnes pratiques', 'Supprimer l evaluation'],
        correctAnswer: 'Ameliorer la comprehension'
      },
      {
        question: 'Quelle action valide la fin du parcours ?',
        choices: ['Passer le quiz', 'Ignorer les exercices', 'Supprimer la description'],
        correctAnswer: 'Passer le quiz'
      },
      {
        question: 'Quel element augmente la qualite pedagogique ?',
        choices: ['Objectifs clairs', 'Aucun contenu', 'Titre vide'],
        correctAnswer: 'Objectifs clairs'
      }
    ];
  }

  private getLocalTitleSuggestions(query: string): string[] {
    const normalizedQuery = query.trim().toLowerCase();
    return this.localTitleSuggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(normalizedQuery)
    );
  }

  private mergeSuggestions(primary: string[], secondary: string[]): string[] {
    return Array.from(new Set([...primary, ...secondary])).slice(0, 8);
  }

  private ensureStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((entry) => this.safeText(entry))
      .filter((entry) => entry.length > 0);
  }

  private safeText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private normalizeGenerationSubject(rawValue: string): string {
    const cleaned = rawValue
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ')
      .replace(/[^\p{L}\p{N}\s:'-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) {
      return 'gestion operationnelle camping';
    }

    return cleaned;
  }

  private getRolePedagogicFocus(role: string): string {
    switch (role) {
      case 'ADMINISTRATEUR':
      case 'ADMIN':
        return 'les administrateurs a piloter et controler les operations';
      case 'GUIDE':
        return 'les guides a accompagner efficacement les campeurs';
      case 'CLIENT':
        return 'les clients a comprendre les bonnes pratiques';
      default:
        return 'les utilisateurs a mieux executer leurs taches';
    }
  }

  private getLevelApproach(level: string): string {
    switch (level) {
      case 'ADVANCED':
        return 'avancee, orientee scenarios complexes';
      case 'INTERMEDIATE':
        return 'intermediaire, orientee cas reels';
      default:
        return 'simple et progressive';
    }
  }

  private humanizeLevel(level: string): string {
    switch (level) {
      case 'ADVANCED':
        return 'Niveau avance';
      case 'INTERMEDIATE':
        return 'Niveau intermediaire';
      default:
        return 'Niveau debutant';
    }
  }

  private normalizeScore(rawScore: number): number {
    if (!Number.isFinite(rawScore)) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round(rawScore)));
  }

  private getHttpErrorMessage(
    status: number,
    action: 'load' | 'upload' | 'delete' | 'create' | 'generate' | 'analyze' | 'quiz',
    errorBody?: unknown
  ): string {
    const backendMessage = this.resolveBackendMessage(errorBody);
    if (backendMessage) {
      return backendMessage;
    }

    switch (status) {
      case 401:
        return '401: Session expiree. Merci de vous reconnecter.';
      case 403:
        return '403: Vous n etes pas autorise a gerer ce media.';
      case 404:
        return action === 'delete'
          ? '404: Media introuvable ou deja supprime.'
          : '404: Formation introuvable.';
      case 415:
        return '415: Type de fichier non supporte. Utilisez une image ou une video.';
      case 500:
        return '500: Erreur serveur. Reessayez dans quelques instants.';
      default:
        if (action === 'create') {
          return 'Echec de creation de la formation. Verifiez les champs requis backend.';
        }
        if (action === 'generate') {
          return 'Echec de generation IA.';
        }
        if (action === 'analyze') {
          return 'Echec de l analyse qualite.';
        }
        if (action === 'quiz') {
          return 'Echec de generation du quiz.';
        }
        if (action === 'upload') {
          return 'Echec du televersement du media.';
        }
        if (action === 'delete') {
          return 'Echec de la suppression du media.';
        }
        return 'Echec du chargement de la galerie.';
    }
  }

  private resolveBackendMessage(errorBody: unknown): string {
    if (typeof errorBody === 'string' && errorBody.trim()) {
      return this.normalizeBackendMessage(errorBody.trim());
    }

    if (!errorBody || typeof errorBody !== 'object') {
      return '';
    }

    const candidate = errorBody as {
      message?: unknown;
      error?: unknown;
      details?: unknown;
      title?: unknown;
      errors?: unknown;
    };

    const message = this.safeText(candidate.message)
      || this.safeText(candidate.error)
      || this.safeText(candidate.details)
      || this.safeText(candidate.title);
    const validationError = this.extractValidationError(candidate.errors);

    if (message && validationError) {
      return `${message}: ${validationError}`;
    }
    if (validationError) {
      return validationError;
    }
    return this.normalizeBackendMessage(message);
  }

  private normalizeBackendMessage(rawMessage: string): string {
    const message = rawMessage.trim();
    if (!message) {
      return '';
    }

    if (message.toLowerCase().includes('no static resource')
      && message.toLowerCase().includes('media')) {
      return 'Endpoint media indisponible sur le backend. Verifiez le mapping API des medias de formation.';
    }

    return message;
  }

  private extractValidationError(rawErrors: unknown): string {
    if (!rawErrors || typeof rawErrors !== 'object') {
      return '';
    }

    const errorsRecord = rawErrors as Record<string, unknown>;
    for (const [field, rawValue] of Object.entries(errorsRecord)) {
      const fieldName = this.safeText(field) || 'champ';
      const fieldMessage = this.safeText(rawValue)
        || (Array.isArray(rawValue)
          ? rawValue.map((entry) => this.safeText(entry)).find((entry) => !!entry) || ''
          : '');
      if (fieldMessage) {
        return `${fieldName}: ${fieldMessage}`;
      }
    }

    return '';
  }
}
