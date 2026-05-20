import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { AuthService } from '../../../../core/services/auth.service';
import {
  FormationGenerateRequestDto,
  FormationGenerateResponseDto,
  FormationQuizItemDto,
  FormationSectionDto
} from '../models/ai-response.model';
import { FormationLevel, FormationSummaryDto } from '../models/formation.model';
import { FormationMediaResponseDto } from '../models/formation-media.model';
import { FormationMediaGalleryComponent } from '../formation-media-gallery/formation-media-gallery.component';
import { FormationAiService } from '../services/formation-ai.service';
import { FormationConsultationService } from '../services/formation-consultation.service';
import { FormationLikeService } from '../services/formation-like.service';
import { FormationService } from '../services/formation.service';
import { GuideInteractifService } from '../../guide-interactif/services/guide-interactif.service';
import { FormationGuideStep } from '../../guide-interactif/models/guide-interactif.model';

type FormationCoverTheme = 'tent' | 'safety' | 'cooking' | 'survival' | 'gear' | 'planning' | 'general';

interface FormationQuizEvaluation {
  isCorrect: boolean;
  confidence: number;
  feedback: string;
  providedAnswer: string;
}

@Component({
  selector: 'app-formation-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormationMediaGalleryComponent, AdminIconComponent],
  templateUrl: './formation-detail.component.html',
  styleUrl: './formation-detail.component.css'
})
export class FormationDetailComponent implements OnInit {
  formationId: number | null = null;
  formation: FormationSummaryDto | null = null;
  isLoading = false;
  isDeleting = false;
  isPublishing = false;
  isGeneratingContent = false;
  formationMediaList: FormationMediaResponseDto[] = [];
  likesCount = 0;
  consultationCount = 0;
  likedByCurrentUser = false;
  likePending = false;
  quizSelectedAnswers: Record<number, string> = {};
  quizTypedAnswers: Record<number, string> = {};
  quizEvaluations: Record<number, FormationQuizEvaluation> = {};
  quizEvaluationMessage = '';
  isEvaluatingQuiz = false;
  private aiFallbackContent: FormationGenerateResponseDto | null = null;

  canManage = false;
  pageMessage = '';
  private readonly minimumObjectives = 3;
  private readonly minimumSections = 4;
  private readonly minimumPlayableVideoSizeBytes = 2048;
  private readonly headerDescriptionMaxLength = 180;
  private readonly defaultCoverUrl = '/assets/images/default-image.jpg';
  private readonly themedCoverPools: Record<FormationCoverTheme, string[]> = {
    tent: ['/assets/images/tente.jpeg', '/assets/images/tt.jpg', '/assets/images/photo-1508873696983-2dfd5898f08b.jpeg'],
    safety: ['/assets/images/feu10.jpeg', '/assets/images/feu11.jpeg', '/assets/images/feu9.jpeg'],
    cooking: ['/assets/images/cuisine.jpeg', '/assets/images/cuis3.jpg', '/assets/images/bbq.jpg'],
    survival: ['/assets/images/foret.jpeg', '/assets/images/foret.jpg', '/assets/images/photo-1573111651692-39ec7f38fec9.jpeg'],
    gear: ['/assets/images/glaciere.jpg', '/assets/images/lampe.jpg', '/assets/images/couchage.jpeg'],
    planning: ['/assets/images/photo-1523987355523-c7b5b0dd90a7.jpeg', '/assets/images/photo-1757346086052-b4940a168c3d.jpeg', '/assets/images/default-image.jpg'],
    general: ['/assets/images/camping-bg.jpg', '/assets/images/photo-1627490601633-1b45a55e13b6.jpeg', '/assets/images/photo-1504280390367-361c6d9f38f4.jpeg']
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private formationService: FormationService,
    private formationAiService: FormationAiService,
    private formationConsultationService: FormationConsultationService,
    private formationLikeService: FormationLikeService,
    private guideService: GuideInteractifService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.canManage = this.canManageFormationRole();

    const routeId = this.route.snapshot.paramMap.get('id');
    const parsedId = Number(routeId);
    this.formationId = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;

    if (!this.formationId) {
      this.pageMessage = 'ID formation invalide.';
      return;
    }

    this.guideService.startPage('formation-detail', true);
    this.loadFormation(this.formationId);
    this.loadFormationMedia(this.formationId);
  }

  get displayTitle(): string {
    if (!this.formation) {
      return 'Formation';
    }

    const rawTitle = this.safeText(this.formation.titre)
      || this.safeText(this.formation.title)
      || this.safeText(this.formation.nom)
      || `Formation #${this.formation.id}`;

    return this.normalizeDisplayTitle(rawTitle);
  }

  get displayDescription(): string {
    const description = this.safeText(this.formation?.description);
    if (description.length > 0) {
      return description;
    }
    const fallbackDescription = this.safeText(this.aiFallbackContent?.description);
    if (fallbackDescription.length > 0) {
      return fallbackDescription;
    }
    return 'Description non disponible.';
  }

  get displaySummary(): string {
    return this.safeText(this.formation?.summary)
      || this.safeText(this.formation?.resume)
      || this.safeText(this.aiFallbackContent?.summary);
  }

  get headerDescription(): string {
    const summary = this.displaySummary;
    if (summary.length > 0) {
      return this.truncateText(summary, this.headerDescriptionMaxLength);
    }

    return this.truncateText(this.displayDescription, this.headerDescriptionMaxLength);
  }

  get objectives(): string[] {
    return this.getEffectiveObjectives();
  }

  get whatYouWillLearn(): string[] {
    const directObjectives = this.objectives;
    if (directObjectives.length > 0) {
      return directObjectives;
    }

    return this.formationSteps
      .map((step) => this.safeText(step.title) || this.safeText(step.content))
      .map((value) => this.truncateText(value, 96))
      .filter((value) => value.length > 0)
      .slice(0, 6);
  }

  get objectivesCount(): number {
    return this.objectives.length;
  }

  get rawObjectivesCount(): number {
    return this.getSourceObjectives().length;
  }

  get formationSteps(): FormationSectionDto[] {
    return this.getEffectiveSteps();
  }

  get sectionsCount(): number {
    return this.formationSteps.length;
  }

  get rawSectionsCount(): number {
    return this.getSourceSteps().length;
  }

  get quizItems(): Array<{ question: string; choices: string[]; correctAnswer: string }> {
    return this.getEffectiveQuizItems();
  }

  get quizCount(): number {
    return this.quizItems.length;
  }

  get rawQuizCount(): number {
    return this.getSourceQuizItems().length;
  }

  get answeredQuizCount(): number {
    return this.quizItems.filter((_, index) => this.getProvidedQuizAnswer(index).length > 0).length;
  }

  get correctedQuizCount(): number {
    return Object.keys(this.quizEvaluations).length;
  }

  get correctQuizCount(): number {
    return Object.values(this.quizEvaluations).filter((evaluation) => evaluation.isCorrect).length;
  }

  get quizScorePercent(): number {
    if (this.quizItems.length === 0) {
      return 0;
    }
    return Math.round((this.correctQuizCount / this.quizItems.length) * 100);
  }

  get guideProgressPercent(): number {
    if (!this.formationId) {
      return 0;
    }
    return this.guideService.getFormationProgressPercent(this.formationId);
  }

  get canLikeFormation(): boolean {
    return !this.canManage;
  }

  get showMediaGallery(): boolean {
    return this.canManage || this.formationMediaList.length > 0;
  }

  get likeButtonLabel(): string {
    return this.likedByCurrentUser ? 'Formation deja aimee' : 'J aime cette formation';
  }

  get showEmptyContentActions(): boolean {
    return this.canManage && !this.hasSourcePedagogicContent();
  }

  get statusLabel(): string {
    const status = this.getRawStatusValue().toUpperCase();
    if (status === 'PUBLISHED') {
      return 'Publiee';
    }
    if (status === 'ARCHIVED') {
      return 'Archivee';
    }
    if (status === 'DRAFT') {
      return 'Brouillon';
    }
    return 'Non defini';
  }

  get levelLabel(): string {
    const level = this.getRawLevelValue().toUpperCase();
    if (level === 'ADVANCED') {
      return 'Avance';
    }
    if (level === 'INTERMEDIATE') {
      return 'Intermediaire';
    }
    if (level === 'BEGINNER') {
      return 'Debutant';
    }
    return 'Non defini';
  }

  get durationLabel(): string {
    const rawDuration = this.safeText(this.formation?.estimatedDuration)
      || this.readLooseStringField(this.formation, 'dureeEstimee');
    if (rawDuration) {
      return rawDuration;
    }

    if (typeof this.formation?.duration === 'number' && Number.isFinite(this.formation.duration) && this.formation.duration > 0) {
      return `${this.formation.duration} minutes`;
    }

    return 'Non definie';
  }

  get creationDateLabel(): string {
    const rawDate = this.safeText(this.formation?.dateCreation) || this.safeText(this.formation?.createdAt);
    if (!rawDate) {
      return 'Date non definie';
    }

    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return 'Date non definie';
    }

    return parsedDate.toLocaleDateString();
  }

  get statusBadgeClass(): string {
    const status = this.getRawStatusValue().toUpperCase();
    if (status === 'PUBLISHED') {
      return 'badge-published';
    }
    if (status === 'ARCHIVED') {
      return 'badge-archived';
    }
    if (status === 'DRAFT') {
      return 'badge-draft';
    }
    return 'badge-empty';
  }

  get levelBadgeClass(): string {
    const level = this.getRawLevelValue().toUpperCase();
    if (level === 'ADVANCED') {
      return 'badge-advanced';
    }
    if (level === 'INTERMEDIATE') {
      return 'badge-intermediate';
    }
    if (level === 'BEGINNER') {
      return 'badge-beginner';
    }
    return 'badge-empty';
  }

  getStepImageUrl(step: FormationSectionDto, stepIndex = 0): string {
    const mediaType = (step.mediaType || '').toUpperCase();
    if (mediaType === 'VIDEO') {
      return '';
    }

    const directImage = this.normalizeImageUrl(step.mediaUrl || '');
    if (directImage) {
      return directImage;
    }

    return this.getLinkedImageFromFormationMedia(stepIndex);
  }

  get coverImageUrl(): string {
    const explicitCover = this.resolveMainImageFromFormation();
    if (explicitCover) {
      return explicitCover;
    }

    const stepImage = this.formationSteps
      .map((step) => this.getDeclaredStepImageUrl(step))
      .find((url) => !!url);

    if (stepImage) {
      return stepImage;
    }

    const imageMedia = this.formationMediaList.find((media) => this.isImageMedia(media));

    if (imageMedia) {
      return this.normalizeImageUrl(this.formationService.resolveMediaUrl(imageMedia.mediaUrl));
    }

    return this.resolveContextualCover() || this.defaultCoverUrl;
  }

  get hasHeroMedia(): boolean {
    return !!this.coverImageUrl || !!this.getHeroVideoUrl();
  }

  get heroVideoEmbedUrl(): SafeResourceUrl | null {
    const normalizedVideoUrl = this.getHeroVideoUrl();
    if (!normalizedVideoUrl || !this.isEmbeddableVideoUrl(normalizedVideoUrl)) {
      return null;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(normalizedVideoUrl);
  }

  get heroVideoSourceUrl(): string {
    const normalizedVideoUrl = this.getHeroVideoUrl();
    if (!normalizedVideoUrl) {
      return '';
    }

    return this.isEmbeddableVideoUrl(normalizedVideoUrl) ? '' : normalizedVideoUrl;
  }

  get showStandaloneFormationVideo(): boolean {
    return !!this.coverImageUrl && (!!this.heroVideoEmbedUrl || !!this.heroVideoSourceUrl);
  }

  getStepVideoEmbedUrl(step: FormationSectionDto, stepIndex = 0): SafeResourceUrl | null {
    const rawVideoUrl = this.getStepVideoUrl(step, stepIndex);
    if (!rawVideoUrl) {
      return null;
    }

    const normalizedVideoUrl = this.normalizeVideoUrl(rawVideoUrl);
    if (!normalizedVideoUrl || !this.isEmbeddableVideoUrl(normalizedVideoUrl)) {
      return null;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(normalizedVideoUrl);
  }

  getStepVideoSourceUrl(step: FormationSectionDto, stepIndex = 0): string {
    const rawVideoUrl = this.getStepVideoUrl(step, stepIndex);
    if (!rawVideoUrl) {
      return '';
    }

    const normalizedVideoUrl = this.normalizeVideoUrl(rawVideoUrl);
    if (!normalizedVideoUrl) {
      return '';
    }

    return this.isEmbeddableVideoUrl(normalizedVideoUrl) ? '' : normalizedVideoUrl;
  }

  isStepVideoDeclared(step: FormationSectionDto): boolean {
    return (step.mediaType || '').toUpperCase() === 'VIDEO';
  }

  openAddContent(): void {
    this.editFormation();
  }

  generateContentWithAi(): void {
    if (!this.canManage || !this.formationId || !this.formation || this.isGeneratingContent) {
      return;
    }

    this.isGeneratingContent = true;
    this.pageMessage = '';

    const payload = this.buildAiGeneratePayload();

    this.formationAiService.generateFormationWithFallback(payload).subscribe({
      next: (generated) => {
        const updatePayload = this.buildAiUpdatePayload(generated);
        this.formationService.updateFormation(this.formationId as number, updatePayload).subscribe({
          next: () => {
            this.isGeneratingContent = false;
            this.pageMessage = 'Contenu structure ajoute avec IA. Vous pouvez encore le modifier.';
            this.loadFormation(this.formationId as number);
            this.guideService.markAction('formation-detail', 'ai-generated');
          },
          error: (error: HttpErrorResponse) => {
            this.isGeneratingContent = false;
            this.pageMessage = this.getErrorMessage(error.status, error.error);
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        this.isGeneratingContent = false;
        this.pageMessage = this.getErrorMessage(error.status, error.error);
      }
    });
  }

  editFormation(): void {
    if (!this.formationId) {
      return;
    }

    this.guideService.markAction('formation-detail', 'open-edit');
    const baseRoute = this.getManagementBaseRoute();
    this.router.navigate([...baseRoute, this.formationId, 'edit']);
  }

  openGuideInteractif(): void {
    if (!this.formationId) {
      return;
    }

    const target = this.isAdministratorRole()
      ? ['/admin/formations', this.formationId, 'guide']
      : ['/public/formations', this.formationId, 'guide'];

    this.router.navigate(target);
  }

  likeFormation(): void {
    if (!this.formationId || !this.canLikeFormation || this.likePending) {
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.authService.setReturnUrl(this.router.url);
      this.router.navigate(['/login']);
      return;
    }

    if (this.likedByCurrentUser) {
      this.pageMessage = 'Vous avez deja aime cette formation.';
      return;
    }

    this.pageMessage = '';
    const previousCount = this.likesCount;
    this.likedByCurrentUser = true;
    this.likesCount = Math.max(0, previousCount + 1);
    this.likePending = true;

    this.formationLikeService.setLikeState(this.formationId, true).subscribe({
      next: (result) => {
        this.likePending = false;
        if (typeof result.likesCount === 'number' && Number.isFinite(result.likesCount)) {
          this.likesCount = Math.max(0, Math.floor(result.likesCount));
        }
      },
      error: (error: HttpErrorResponse) => {
        this.likePending = false;
        this.likedByCurrentUser = false;
        this.likesCount = previousCount;
        this.pageMessage = this.getLikeErrorMessage(error.status, error.error);
      }
    });
  }

  selectQuizChoice(questionIndex: number, choice: string): void {
    if (!Number.isFinite(questionIndex) || questionIndex < 0 || questionIndex >= this.quizItems.length) {
      return;
    }

    const safeChoice = (choice || '').trim();
    this.quizSelectedAnswers = {
      ...this.quizSelectedAnswers,
      [questionIndex]: safeChoice
    };

    if (this.quizEvaluations[questionIndex]) {
      const { [questionIndex]: _ignored, ...remaining } = this.quizEvaluations;
      this.quizEvaluations = remaining;
    }

    this.quizEvaluationMessage = '';
  }

  updateTypedQuizAnswer(questionIndex: number, rawValue: string): void {
    if (!Number.isFinite(questionIndex) || questionIndex < 0 || questionIndex >= this.quizItems.length) {
      return;
    }

    this.quizTypedAnswers = {
      ...this.quizTypedAnswers,
      [questionIndex]: (rawValue || '').trim()
    };

    if (this.quizEvaluations[questionIndex]) {
      const { [questionIndex]: _ignored, ...remaining } = this.quizEvaluations;
      this.quizEvaluations = remaining;
    }

    this.quizEvaluationMessage = '';
  }

  verifyQuizQuestionWithAi(questionIndex: number): void {
    if (!Number.isFinite(questionIndex) || questionIndex < 0 || questionIndex >= this.quizItems.length) {
      return;
    }

    const question = this.quizItems[questionIndex];
    if (!question) {
      return;
    }

    const providedAnswer = this.getProvidedQuizAnswer(questionIndex);
    if (!providedAnswer) {
      this.quizEvaluationMessage = 'Choisissez une reponse ou saisissez une reponse libre avant verification.';
      return;
    }

    this.isEvaluatingQuiz = true;
    const evaluation = this.evaluateQuizAnswerWithAi(question.correctAnswer, providedAnswer);
    this.quizEvaluations = {
      ...this.quizEvaluations,
      [questionIndex]: evaluation
    };
    this.isEvaluatingQuiz = false;
  }

  verifyAllQuizAnswersWithAi(): void {
    if (this.quizItems.length === 0) {
      return;
    }

    this.isEvaluatingQuiz = true;
    let checkedCount = 0;

    this.quizItems.forEach((question, index) => {
      const providedAnswer = this.getProvidedQuizAnswer(index);
      if (!providedAnswer) {
        return;
      }

      const evaluation = this.evaluateQuizAnswerWithAi(question.correctAnswer, providedAnswer);
      this.quizEvaluations = {
        ...this.quizEvaluations,
        [index]: evaluation
      };
      checkedCount += 1;
    });

    this.isEvaluatingQuiz = false;
    this.quizEvaluationMessage = checkedCount > 0
      ? `Correction IA terminee: ${this.correctQuizCount}/${checkedCount} bonne(s) reponse(s).`
      : 'Aucune reponse a corriger. Choisissez au moins une reponse.';
  }

  getQuizQuestionEvaluation(questionIndex: number): FormationQuizEvaluation | null {
    return this.quizEvaluations[questionIndex] ?? null;
  }

  isQuizChoiceSelected(questionIndex: number, choice: string): boolean {
    return (this.quizSelectedAnswers[questionIndex] || '') === (choice || '').trim();
  }

  createFormationWithAi(): void {
    if (!this.canManage) {
      return;
    }

    const subjectHint = this.displayTitle.trim();
    if (subjectHint.length > 1) {
      this.guideService.setPendingAiSubject(subjectHint);
    }

    const baseRoute = this.getManagementBaseRoute();
    this.router.navigate([...baseRoute, 'create'], {
      queryParams: {
        ai: 1,
        source: 'detail'
      }
    });
  }

  publishFormation(): void {
    if (!this.canManage || !this.formationId || this.isPublishing) {
      return;
    }

    this.isPublishing = true;
    this.pageMessage = '';

    this.guideService.listFormationGuideSteps(this.formationId).subscribe({
      next: (steps) => {
        const missing = this.getMissingPublicationRequirements(steps);
        if (missing.length > 0) {
          this.isPublishing = false;
          this.pageMessage = `Formation incomplete. Completez d abord: ${missing.join(', ')}.`;
          return;
        }

        this.formationService.publishFormation(this.formationId as number).subscribe({
          next: () => {
            this.isPublishing = false;
            if (this.formation) {
              this.formation.status = 'PUBLISHED';
              this.formation.statut = 'PUBLISHED';
            }
            this.guideService.markAction('formation-detail', 'published');
            this.router.navigate(this.getManagementBaseRoute());
          },
          error: (error: HttpErrorResponse) => {
            this.isPublishing = false;
            this.pageMessage = this.getErrorMessage(error.status, error.error);
          }
        });
      },
      error: () => {
        this.isPublishing = false;
        this.pageMessage = 'Impossible de verifier le guide interactif avant publication.';
      }
    });
  }

  deleteFormation(): void {
    if (!this.canManage || !this.formationId || this.isDeleting) {
      return;
    }

    const confirmed = globalThis.confirm(`Voulez-vous vraiment supprimer la formation "${this.displayTitle}" ?`);
    if (!confirmed) {
      return;
    }

    this.isDeleting = true;
    this.pageMessage = '';

    this.formationService.deleteFormation(this.formationId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.router.navigate(this.getManagementBaseRoute());
      },
      error: (error: HttpErrorResponse) => {
        this.isDeleting = false;
        this.pageMessage = this.getErrorMessage(error.status, error.error);
      }
    });
  }

  onMediaAction(action: 'media-added' | 'media-deleted'): void {
    if (this.formationId) {
      this.loadFormationMedia(this.formationId);
    }

    if (action === 'media-added') {
      this.guideService.markAction('formation-detail', 'read-media');
    }
  }

  private buildAiGeneratePayload(): FormationGenerateRequestDto {
    const level = this.normalizeLevel(this.getRawLevelValue() || 'BEGINNER');
    const targetUser = this.safeText(this.formation?.targetUser) || this.safeText(this.formation?.role) || 'CLIENT';

    return {
      subject: this.getFormationSubject(),
      level,
      targetUser
    };
  }

  private buildAiUpdatePayload(generated: FormationGenerateResponseDto): Record<string, unknown> {
    const title = this.normalizeDisplayTitle(this.safeText(generated.title) || this.displayTitle);
    const description = this.safeText(generated.description) || this.displayDescription;
    const objectives = this.ensureMinimumObjectives(
      Array.isArray(generated.objectives)
        ? generated.objectives.map((objective) => this.safeText(objective)).filter((objective) => objective.length > 0)
        : []
    );

    const aiSections = Array.isArray(generated.sections)
      ? generated.sections.map((section, index) => this.normalizeStepSection(section, index))
      : [];
    const sections = this.ensureMinimumSections(aiSections);
    const summary = this.safeText(generated.summary) || this.displaySummary;

    const estimatedDuration = this.normalizeEstimatedDuration(generated.estimatedDuration, sections.length);
    const durationMinutes = this.parseDurationMinutes(estimatedDuration);

    const status = this.normalizeStatus(this.getRawStatusValue());
    const level = this.normalizeLevel(this.safeText(generated.level) || this.getRawLevelValue());

    const quiz = Array.isArray(generated.quiz)
      ? generated.quiz.map((item) => this.normalizeQuizItem(item)).filter((item) => item !== null)
      : this.getSourceQuizItems();

    const content = sections
      .map((section) => {
        const lines = [`${section.title}: ${section.content}`];
        const imageUrl = this.normalizeImageUrl(section.mediaUrl || '');
        if (imageUrl) {
          lines.push(`@media[IMAGE]=${imageUrl}`);
        }
        return lines.join('\n');
      })
      .join('\n');

    return {
      titre: title,
      title,
      nom: title,
      description,
      content,
      contenu: content,
      objectives,
      objectifs: objectives,
      sections,
      summary,
      resume: summary,
      level,
      niveau: level,
      estimatedDuration,
      dureeEstimee: estimatedDuration,
      duration: durationMinutes,
      quiz,
      generatedByAi: true,
      aiGenerated: true,
      status,
      statut: status
    };
  }

  private loadFormation(formationId: number): void {
    this.isLoading = true;
    this.pageMessage = '';

    this.formationService.getFormationById(formationId).subscribe({
      next: (response) => {
        if (!this.canManage && !this.isPublishedFormation(response)) {
          this.isLoading = false;
          this.pageMessage = 'Cette formation est reservee a la gestion interne.';
          this.router.navigate(['/public/formations']);
          return;
        }

        this.isLoading = false;
        this.formation = response;
        this.prepareAiFallbackContent(response);
        this.hydrateEngagementFromFormation(response);
        this.quizSelectedAnswers = {};
        this.quizTypedAnswers = {};
        this.quizEvaluations = {};
        this.quizEvaluationMessage = '';
        this.isEvaluatingQuiz = false;
        this.guideService.markAction('formation-detail', 'read-content');
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.pageMessage = this.getErrorMessage(error.status, error.error);
      }
    });
  }

  private loadFormationMedia(formationId: number): void {
    this.formationService.getFormationMedia(formationId).subscribe({
      next: (response) => {
        this.formationMediaList = this.formationService.sortByDisplayOrder(response);
      },
      error: () => {
        this.formationMediaList = [];
      }
    });
  }

  private getErrorMessage(status: number, errorBody?: unknown): string {
    const backendMessage = this.resolveBackendMessage(errorBody);
    if (backendMessage) {
      return backendMessage;
    }

    switch (status) {
      case 400:
        return '400: Donnees invalides.';
      case 401:
        return '401: Utilisateur non connecte.';
      case 403:
        return '403: Acces refuse.';
      case 404:
        return '404: Formation introuvable.';
      case 500:
        return '500: Erreur serveur.';
      default:
        return 'Une erreur est survenue.';
    }
  }

  private getLikeErrorMessage(status: number, errorBody?: unknown): string {
    const backendMessage = this.resolveBackendMessage(errorBody);
    if (backendMessage) {
      return backendMessage;
    }

    switch (status) {
      case 400:
        return '400: Donnees invalides pour le like.';
      case 401:
        return '401: Connectez-vous pour aimer cette formation.';
      case 403:
        return '403: Action non autorisee.';
      case 404:
        return '404: Endpoint like introuvable.';
      case 500:
        return '500: Erreur serveur pendant le like.';
      default:
        return 'Impossible de mettre a jour le like.';
    }
  }

  private hydrateEngagementFromFormation(formation: FormationSummaryDto): void {
    this.likesCount = this.extractLikeCountFromSummary(formation);
    this.consultationCount = Math.max(
      this.extractConsultationCountFromSummary(formation),
      this.formationConsultationService.getConsultationCount(formation.id)
    );
    this.likedByCurrentUser = this.extractLikedStateFromSummary(formation);
    this.syncLikedStateFromService(formation.id);
  }

  private syncLikedStateFromService(formationId: number): void {
    if (!this.authService.isLoggedIn() || !Number.isFinite(formationId) || formationId <= 0) {
      return;
    }

    this.formationLikeService.getLikedFormationIds().subscribe({
      next: (likedIds) => {
        if (likedIds.has(formationId)) {
          this.likedByCurrentUser = true;
        }
      },
      error: () => {
        // Keep local visual state from summary/local cache when endpoint is unavailable.
      }
    });
  }

  private resolveBackendMessage(errorBody: unknown): string {
    if (typeof errorBody === 'string' && errorBody.trim()) {
      return this.normalizeBackendErrorMessage(errorBody.trim());
    }
    if (!errorBody || typeof errorBody !== 'object') {
      return '';
    }

    const candidate = errorBody as { message?: unknown; error?: unknown; details?: unknown };
    const rawMessage = (typeof candidate.message === 'string' && candidate.message.trim())
      || (typeof candidate.error === 'string' && candidate.error.trim())
      || (typeof candidate.details === 'string' && candidate.details.trim())
      || '';

    return this.normalizeBackendErrorMessage(rawMessage);
  }

  private getSourceObjectives(): string[] {
    const fromObjectives = Array.isArray(this.formation?.objectives) ? this.formation.objectives : [];
    const fromObjectifs = Array.isArray(this.formation?.objectifs) ? this.formation.objectifs : [];
    const merged = [...fromObjectives, ...fromObjectifs]
      .map((item) => this.safeText(item))
      .filter((item) => item.length > 0);

    return this.uniqueValues(merged);
  }

  private getFallbackObjectivesFromAi(): string[] {
    return Array.isArray(this.aiFallbackContent?.objectives)
      ? this.aiFallbackContent.objectives.map((objective) => this.safeText(objective)).filter((objective) => objective.length > 0)
      : [];
  }

  private getSourceQuizItems(): Array<{ question: string; choices: string[]; correctAnswer: string }> {
    const quiz = Array.isArray(this.formation?.quiz) ? this.formation.quiz : [];

    return quiz
      .map((item) => {
        const question = this.safeText(item.question);
        const choices = Array.isArray(item.choices)
          ? item.choices.map((choice) => this.safeText(choice)).filter((choice) => choice.length > 0)
          : [];
        const correctAnswer = this.safeText(item.correctAnswer);

        if (!question) {
          return null;
        }

        return {
          question,
          choices,
          correctAnswer
        };
      })
      .filter((item): item is { question: string; choices: string[]; correctAnswer: string } => item !== null);
  }

  private getFallbackQuizItemsFromAi(): Array<{ question: string; choices: string[]; correctAnswer: string }> {
    const fallbackQuiz = Array.isArray(this.aiFallbackContent?.quiz) ? this.aiFallbackContent.quiz : [];
    return fallbackQuiz
      .map((item) => this.normalizeQuizItem(item))
      .filter((item): item is FormationQuizItemDto => item !== null)
      .map((item) => ({
        question: item.question,
        choices: item.choices,
        correctAnswer: item.correctAnswer
      }));
  }

  private getEffectiveObjectives(): string[] {
    const sourceObjectives = this.getSourceObjectives();
    const fallbackObjectives = this.getFallbackObjectivesFromAi();
    return this.ensureMinimumObjectives([...sourceObjectives, ...fallbackObjectives]);
  }

  private getEffectiveSteps(): FormationSectionDto[] {
    const sourceSteps = this.getSourceSteps();
    const fallbackSections = this.getFallbackSectionsFromAi();
    const merged = [...sourceSteps, ...fallbackSections];
    return this.ensureMinimumSections(merged);
  }

  private getEffectiveQuizItems(): Array<{ question: string; choices: string[]; correctAnswer: string }> {
    const sourceQuiz = this.getSourceQuizItems();
    if (sourceQuiz.length > 0) {
      return sourceQuiz;
    }
    return this.getFallbackQuizItemsFromAi();
  }

  private getProvidedQuizAnswer(questionIndex: number): string {
    const typed = (this.quizTypedAnswers[questionIndex] || '').trim();
    if (typed.length > 0) {
      return typed;
    }
    return (this.quizSelectedAnswers[questionIndex] || '').trim();
  }

  private evaluateQuizAnswerWithAi(correctAnswer: string, providedAnswer: string): FormationQuizEvaluation {
    const expected = this.toComparableText(correctAnswer);
    const provided = this.toComparableText(providedAnswer);
    if (!expected || !provided) {
      return {
        isCorrect: false,
        confidence: 0,
        feedback: 'Reponse vide. Essayez avec une formulation plus precise.',
        providedAnswer
      };
    }

    if (expected === provided) {
      return {
        isCorrect: true,
        confidence: 100,
        feedback: 'Bonne reponse. Validation IA: correspondance exacte.',
        providedAnswer
      };
    }

    const containmentMatch = expected.includes(provided) || provided.includes(expected);
    if (containmentMatch && provided.length >= 4) {
      return {
        isCorrect: true,
        confidence: 86,
        feedback: 'Bonne reponse. Validation IA: formulation equivalente.',
        providedAnswer
      };
    }

    const expectedTokens = this.toComparableTokens(correctAnswer);
    const providedTokens = this.toComparableTokens(providedAnswer);
    const tokenSimilarity = this.computeTokenSimilarity(expectedTokens, providedTokens);
    const lexicalSimilarity = this.computeLexicalSimilarity(expected, provided);
    const confidence = Math.round((tokenSimilarity * 0.65 + lexicalSimilarity * 0.35) * 100);

    if (confidence >= 72) {
      return {
        isCorrect: true,
        confidence,
        feedback: 'Bonne reponse. Validation IA: sens global correct.',
        providedAnswer
      };
    }

    if (confidence >= 46) {
      return {
        isCorrect: false,
        confidence,
        feedback: `Presque. Reponse attendue: "${correctAnswer}".`,
        providedAnswer
      };
    }

    return {
      isCorrect: false,
      confidence,
      feedback: `Reponse incorrecte. Reponse attendue: "${correctAnswer}".`,
      providedAnswer
    };
  }

  private toComparableTokens(value: string): string[] {
    return this.toComparableText(value)
      .split(' ')
      .map((token) => token.trim())
      .filter((token) => token.length > 1);
  }

  private computeTokenSimilarity(expectedTokens: string[], providedTokens: string[]): number {
    if (expectedTokens.length === 0 || providedTokens.length === 0) {
      return 0;
    }

    const expectedSet = new Set(expectedTokens);
    const providedSet = new Set(providedTokens);
    let common = 0;
    expectedSet.forEach((token) => {
      if (providedSet.has(token)) {
        common += 1;
      }
    });

    const precision = common / providedSet.size;
    const recall = common / expectedSet.size;
    if (precision === 0 && recall === 0) {
      return 0;
    }
    return (2 * precision * recall) / (precision + recall);
  }

  private computeLexicalSimilarity(expected: string, provided: string): number {
    const longer = expected.length >= provided.length ? expected : provided;
    const shorter = expected.length >= provided.length ? provided : expected;
    if (!longer || !shorter) {
      return 0;
    }

    if (longer.includes(shorter)) {
      return shorter.length / longer.length;
    }

    let commonChars = 0;
    const available = shorter.split('');
    for (const char of longer) {
      const index = available.indexOf(char);
      if (index >= 0) {
        commonChars += 1;
        available.splice(index, 1);
      }
    }

    return commonChars / longer.length;
  }

  private toComparableText(value: string): string {
    return this.safeText(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private hasSourcePedagogicContent(): boolean {
    const directContent = this.stripInlineMediaTokens(
      this.safeText(this.formation?.content) || this.safeText(this.formation?.contenu)
    );
    const summary = this.safeText(this.formation?.summary) || this.safeText(this.formation?.resume);
    const description = this.safeText(this.formation?.description);

    return description.length > 0
      || this.getSourceObjectives().length > 0
      || this.getSourceSteps().length > 0
      || this.getSourceQuizItems().length > 0
      || directContent.length > 0
      || summary.length > 0;
  }

  private ensureMinimumObjectives(sourceObjectives: string[]): string[] {
    const objectives = [...sourceObjectives];
    const subject = this.getFormationSubject().toLowerCase();
    const fallbackObjectives = [
      `Identifier les pre requis terrain pour ${subject}.`,
      `Executer ${subject} avec une methode simple et securisee.`,
      'Verifier le resultat avec une checklist et corriger les points faibles.',
      'Valider les bonnes pratiques avant la fin du parcours.'
    ];

    for (const fallback of fallbackObjectives) {
      if (objectives.length >= this.minimumObjectives) {
        break;
      }
      objectives.push(fallback);
    }

    return this.uniqueValues(objectives).slice(0, Math.max(this.minimumObjectives, objectives.length));
  }

  private getSourceSteps(): FormationSectionDto[] {
    const rawSections = Array.isArray(this.formation?.sections) ? this.formation.sections : [];
    if (rawSections.length > 0) {
      const normalizedSections = rawSections
        .map((section, index) => this.normalizeStepSection(section, index))
        .filter((section) => section.content.length > 0);

      const content = this.safeText(this.formation?.content) || this.safeText(this.formation?.contenu);
      const stepsFromContent = this.parseStepsFromContent(content);
      if (stepsFromContent.length === normalizedSections.length) {
        return normalizedSections.map((section, index) => {
          const fromContent = stepsFromContent[index];
          if (!fromContent || this.safeText(section.mediaUrl).length > 0) {
            return section;
          }

          const mediaType: 'IMAGE' | 'VIDEO' = this.safeText(fromContent.mediaType).toUpperCase() === 'VIDEO' ? 'VIDEO' : 'IMAGE';
          const mediaUrl = mediaType === 'VIDEO'
            ? this.normalizeVideoUrl(this.safeText(fromContent.mediaUrl))
            : this.normalizeImageUrl(this.safeText(fromContent.mediaUrl));

          if (!mediaUrl) {
            return section;
          }

          return {
            ...section,
            mediaType,
            mediaUrl
          };
        });
      }

      return normalizedSections;
    }

    const content = this.safeText(this.formation?.content) || this.safeText(this.formation?.contenu);
    return this.parseStepsFromContent(content);
  }

  private getFallbackSectionsFromAi(): FormationSectionDto[] {
    const fallbackSections = Array.isArray(this.aiFallbackContent?.sections) ? this.aiFallbackContent.sections : [];
    return fallbackSections
      .map((section, index) => this.normalizeStepSection(section, index))
      .filter((section) => section.content.length > 0);
  }

  private ensureMinimumSections(sourceSections: FormationSectionDto[]): FormationSectionDto[] {
    const sections = [...sourceSections];

    const fallbackSections = this.buildFallbackSections();
    fallbackSections.forEach((section) => {
      if (sections.length < this.minimumSections) {
        sections.push(section);
      }
    });

    return sections
      .map((section, index) => this.normalizeStepSection(section, index))
      .filter((section) => section.content.length > 0)
      .slice(0, Math.max(this.minimumSections, sections.length));
  }

  private buildFallbackSections(): FormationSectionDto[] {
    const subject = this.getFormationSubject().toLowerCase();

    return [
      {
        title: 'Preparation',
        content: `Verifier la meteo, le terrain et le materiel avant de commencer ${subject}.`,
        mediaType: 'IMAGE'
      },
      {
        title: 'Mise en place',
        content: `Appliquer ${subject} etape par etape, sans sauter les controles intermediaires.`,
        mediaType: 'IMAGE'
      },
      {
        title: 'Controle securite',
        content: 'Verifier la stabilite, la securite et la qualite de chaque action realisee.',
        mediaType: 'IMAGE'
      },
      {
        title: 'Validation finale',
        content: 'Completer la checklist finale puis corriger les derniers points faibles.',
        mediaType: 'IMAGE'
      }
    ];
  }

  private prepareAiFallbackContent(formation: FormationSummaryDto): void {
    const subject = this.normalizeDisplayTitle(
      this.safeText(formation.titre)
      || this.safeText(formation.title)
      || this.safeText(formation.nom)
      || `Formation #${formation.id}`
    );
    const level = this.normalizeLevel(this.safeText(formation.level) || this.safeText(formation.role) || 'BEGINNER');

    this.aiFallbackContent = this.formationAiService.buildMockGeneratedFormation({
      subject,
      level,
      targetUser: this.safeText(formation.targetUser) || 'CLIENT'
    });
  }

  private safeText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private stripInlineMediaTokens(rawContent: string): string {
    if (!rawContent) {
      return '';
    }

    return rawContent
      .replace(/\r/g, '\n')
      .split('\n')
      .filter((line) => !/^@media\[(IMAGE|VIDEO)\]\s*=/i.test(line.trim()))
      .join('\n')
      .trim();
  }

  private getRawStatusValue(): string {
    return this.safeText(this.formation?.status)
      || this.safeText(this.formation?.statut);
  }

  private getRawLevelValue(): string {
    return this.safeText(this.formation?.level)
      || this.readLooseStringField(this.formation, 'niveau');
  }

  private normalizeDisplayTitle(value: string): string {
    const compact = value.replace(/\s+/g, ' ').trim();
    if (!compact) {
      return value;
    }

    const deduplicated = compact
      .replace(/^((formation)\s+){2,}/i, 'Formation ')
      .replace(/^formation\s*:\s*formation\b/i, 'Formation')
      .replace(/^formation\s+formation\b/i, 'Formation');

    return deduplicated.replace(/\s+/g, ' ').trim();
  }

  private readLooseStringField(formation: FormationSummaryDto | null, fieldName: string): string {
    const record = formation as unknown as Record<string, unknown> | null;
    return this.safeText(record?.[fieldName]);
  }

  private normalizeStepSection(section: FormationSectionDto, index: number): FormationSectionDto {
    const title = this.normalizeStepTitle(this.safeText(section.title), index);
    const content = this.safeText(section.content).replace(/\s+/g, ' ').trim();
    const mediaType: 'IMAGE' | 'VIDEO' = (this.safeText(section.mediaType) || 'IMAGE').toUpperCase() === 'VIDEO'
      ? 'VIDEO'
      : 'IMAGE';
    const mediaUrl = mediaType === 'VIDEO'
      ? this.normalizeVideoUrl(this.safeText(section.mediaUrl))
      : this.normalizeImageUrl(this.safeText(section.mediaUrl));

    return {
      title,
      content,
      mediaType,
      mediaUrl: mediaUrl || undefined
    };
  }

  private parseStepsFromContent(rawContent: string): FormationSectionDto[] {
    if (!rawContent) {
      return [];
    }

    const lines = rawContent
      .replace(/\r/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const steps: FormationSectionDto[] = [];

    lines.forEach((line) => {
      const mediaInlineMatch = line.match(/^@media\[(IMAGE|VIDEO)\]\s*=\s*(.+)$/i);
      if (mediaInlineMatch && steps.length > 0) {
        const mediaType: 'IMAGE' | 'VIDEO' = mediaInlineMatch[1].toUpperCase() === 'VIDEO' ? 'VIDEO' : 'IMAGE';
        const mediaUrl = mediaType === 'VIDEO'
          ? this.normalizeVideoUrl(mediaInlineMatch[2])
          : this.normalizeImageUrl(mediaInlineMatch[2]);
        if (mediaUrl) {
          const lastStep = steps[steps.length - 1];
          lastStep.mediaType = mediaType;
          lastStep.mediaUrl = mediaUrl;
        }
        return;
      }

      const index = steps.length;
      const matched = line.match(/^([^:.-]{3,})\s*[:.-]\s*(.+)$/);
      if (matched) {
        steps.push({
          title: this.normalizeStepTitle(matched[1], index),
          content: matched[2].replace(/\s+/g, ' ').trim(),
          mediaType: 'IMAGE'
        });
        return;
      }

      steps.push({
        title: `Etape ${index + 1}`,
        content: line.replace(/\s+/g, ' ').trim(),
        mediaType: 'IMAGE'
      });
    });

    return steps;
  }

  private normalizeStepTitle(rawTitle: string, index: number): string {
    const cleaned = rawTitle
      .replace(/^etape\s*\d+\s*[-:]\s*/i, '')
      .replace(/^step\s*\d+\s*[-:]\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned || `Etape ${index + 1}`;
  }

  private normalizeImageUrl(rawUrl: string): string {
    if (!rawUrl) {
      return '';
    }

    const normalizedRawUrl = rawUrl.trim();
    if (!normalizedRawUrl) {
      return '';
    }

    if (normalizedRawUrl.startsWith('data:image/')) {
      return normalizedRawUrl;
    }

    if (/^\/?assets\//i.test(normalizedRawUrl)) {
      return normalizedRawUrl.startsWith('/') ? normalizedRawUrl : `/${normalizedRawUrl}`;
    }

    if (/^https?:\/\//i.test(normalizedRawUrl)) {
      return normalizedRawUrl;
    }

    const resolvedUrl = this.formationService.resolveMediaUrl(normalizedRawUrl);
    return /^https?:\/\//i.test(resolvedUrl) ? resolvedUrl : '';
  }

  private getDeclaredStepImageUrl(step: FormationSectionDto): string {
    const mediaType = (step.mediaType || '').toUpperCase();
    if (mediaType === 'VIDEO') {
      return '';
    }

    return this.normalizeImageUrl(step.mediaUrl || '');
  }

  private normalizeVideoUrl(rawUrl: string): string {
    if (!rawUrl) {
      return '';
    }

    const normalizedRawUrl = rawUrl.trim();
    if (!normalizedRawUrl) {
      return '';
    }

    const parsedUrl = this.toParsedUrl(normalizedRawUrl);
    const youtubeVideoId = this.extractYoutubeVideoId(normalizedRawUrl, parsedUrl);
    if (youtubeVideoId) {
      return `https://www.youtube.com/embed/${youtubeVideoId}`;
    }

    const vimeoVideoId = this.extractVimeoVideoId(normalizedRawUrl, parsedUrl);
    if (vimeoVideoId) {
      return `https://player.vimeo.com/video/${vimeoVideoId}`;
    }

    if (/^https?:\/\//i.test(normalizedRawUrl)) {
      return normalizedRawUrl;
    }

    const resolvedUrl = this.formationService.resolveMediaUrl(normalizedRawUrl);
    return /^https?:\/\//i.test(resolvedUrl) ? resolvedUrl : '';
  }

  private toParsedUrl(rawUrl: string): URL | null {
    try {
      return new URL(rawUrl);
    } catch {
      return null;
    }
  }

  private extractYoutubeVideoId(rawUrl: string, parsedUrl: URL | null): string | null {
    const idPattern = /^[a-zA-Z0-9_-]{6,}$/;
    const normalizeCandidate = (candidate: string | null | undefined): string | null => {
      if (!candidate) {
        return null;
      }
      const cleaned = candidate.trim();
      return idPattern.test(cleaned) ? cleaned : null;
    };

    if (parsedUrl) {
      const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
      if (host === 'youtu.be') {
        return normalizeCandidate(parsedUrl.pathname.split('/').filter(Boolean)[0]);
      }

      if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
        const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
        if (parsedUrl.pathname.startsWith('/watch')) {
          return normalizeCandidate(parsedUrl.searchParams.get('v'));
        }

        if (pathParts[0] === 'embed' || pathParts[0] === 'shorts' || pathParts[0] === 'live') {
          return normalizeCandidate(pathParts[1]);
        }
      }
    }

    const youtubeWatchMatch = rawUrl.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{6,})/i);
    if (youtubeWatchMatch?.[1]) {
      return youtubeWatchMatch[1];
    }

    const youtubeShortMatch = rawUrl.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{6,})/i);
    if (youtubeShortMatch?.[1]) {
      return youtubeShortMatch[1];
    }

    const youtubeEmbedMatch = rawUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/i);
    if (youtubeEmbedMatch?.[1]) {
      return youtubeEmbedMatch[1];
    }

    return null;
  }

  private extractVimeoVideoId(rawUrl: string, parsedUrl: URL | null): string | null {
    const idPattern = /^\d{5,}$/;
    const normalizeCandidate = (candidate: string | null | undefined): string | null => {
      if (!candidate) {
        return null;
      }
      const cleaned = candidate.trim();
      return idPattern.test(cleaned) ? cleaned : null;
    };

    if (parsedUrl) {
      const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      if (host === 'vimeo.com') {
        return normalizeCandidate(pathParts[0]);
      }
      if (host === 'player.vimeo.com' && pathParts[0] === 'video') {
        return normalizeCandidate(pathParts[1]);
      }
    }

    const vimeoMatch = rawUrl.match(/vimeo\.com\/(\d{5,})/i);
    if (vimeoMatch?.[1]) {
      return vimeoMatch[1];
    }

    const vimeoEmbedMatch = rawUrl.match(/player\.vimeo\.com\/video\/(\d{5,})/i);
    if (vimeoEmbedMatch?.[1]) {
      return vimeoEmbedMatch[1];
    }

    return null;
  }

  private getLinkedImageFromFormationMedia(stepIndex: number): string {
    const imageMedia = this.formationMediaList.filter((media) => this.isImageMedia(media));

    if (imageMedia.length === 0) {
      return '';
    }

    const selected = imageMedia[Math.min(stepIndex, imageMedia.length - 1)] ?? imageMedia[0];
    return selected ? this.normalizeImageUrl(this.formationService.resolveMediaUrl(selected.mediaUrl)) : '';
  }

  private getLinkedVideoFromFormationMedia(stepIndex: number): string {
    const videoMedia = this.formationMediaList.filter((media) =>
      this.isPlayableVideoMedia(media)
    );

    if (videoMedia.length === 0) {
      return '';
    }

    const selected = videoMedia[Math.min(stepIndex, videoMedia.length - 1)] ?? videoMedia[0];
    return this.normalizeVideoUrl(this.formationService.resolveMediaUrl(selected.mediaUrl));
  }

  private resolveMainImageFromFormation(): string {
    const candidates = [
      this.safeText(this.formation?.coverImageUrl),
      this.safeText(this.formation?.imagePrincipale),
      this.safeText(this.formation?.imageUrl),
      this.safeText(this.formation?.photoUrl)
    ];

    for (const candidate of candidates) {
      const normalized = this.normalizeImageUrl(candidate);
      if (normalized) {
        return normalized;
      }
    }

    return '';
  }

  private resolveContextualCover(): string {
    if (!this.formation) {
      return '';
    }

    const aiSuggestion = this.getAiSuggestedImageUrl(this.getFormationSubject(), this.formation.id);
    if (aiSuggestion) {
      return aiSuggestion;
    }

    const title = this.displayTitle;
    const description = this.safeText(this.formation.description);
    const summary = this.displaySummary;
    const objectives = this.objectives.join(' ');
    const sections = this.formationSteps
      .map((section) => `${this.safeText(section.title)} ${this.safeText(section.content)}`)
      .join(' ');

    const contextText = `${title} ${description} ${summary} ${objectives} ${sections}`.toLowerCase();
    const pool = this.selectCoverPoolByContext(contextText);
    const index = this.toStableIndex(this.formation.id, pool.length);
    return pool[index] || this.defaultCoverUrl;
  }

  private selectCoverPoolByContext(contextText: string): string[] {
    if (/(tente|piquet|arceau|hauban|montage|campement)/i.test(contextText)) {
      return this.themedCoverPools.tent;
    }
    if (/(securite|risque|urgence|incendie|feu|evacuation|premier secours)/i.test(contextText)) {
      return this.themedCoverPools.safety;
    }
    if (/(cuisine|repas|bbq|barbecue|cuisson|aliment|glaciere|hygiene)/i.test(contextText)) {
      return this.themedCoverPools.cooking;
    }
    if (/(survie|orientation|foret|boussole|abri|randonnee|terrain)/i.test(contextText)) {
      return this.themedCoverPools.survival;
    }
    if (/(materiel|equipement|sac|lampe|couchage|checklist)/i.test(contextText)) {
      return this.themedCoverPools.gear;
    }
    if (/(budget|reservation|choisir|site|compar|planifier|organisation)/i.test(contextText)) {
      return this.themedCoverPools.planning;
    }
    return this.themedCoverPools.general;
  }

  private toStableIndex(seed: number, size: number): number {
    if (size <= 1) {
      return 0;
    }
    const safeSeed = Number.isFinite(seed) ? Math.abs(Math.floor(seed)) : 0;
    return safeSeed % size;
  }

  private getAiSuggestedImageUrl(subject: string, index = 0): string {
    const hints = this.formationAiService.suggestMediaHints(subject);
    const images = hints.images
      .map((hint) => this.normalizeImageUrl(this.safeText(hint.url)))
      .filter((url) => !!url);

    if (images.length === 0) {
      return '';
    }

    const safeIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
    return images[safeIndex % images.length];
  }

  private getAiSuggestedYoutubeVideoUrl(subject: string, index = 0): string {
    const hints = this.formationAiService.suggestMediaHints(subject);
    const suggestions = hints.videos
      .map((hint) => this.toYoutubeEmbedUrl(this.safeText(hint.url)))
      .filter((url) => !!url);

    if (suggestions.length > 0) {
      const safeIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
      return suggestions[safeIndex % suggestions.length];
    }

    return this.toYoutubeEmbedUrl(this.formationAiService.getPrimaryVideoSuggestion(subject))
      || 'https://www.youtube.com/embed/M7lc1UVf-VE';
  }

  private toYoutubeEmbedUrl(rawUrl: string): string {
    const normalized = this.normalizeVideoUrl(rawUrl);
    return /youtube\.com\/embed\//i.test(normalized) ? normalized : '';
  }

  private resolveMainVideoFromFormation(): string {
    const candidates = [
      this.safeText(this.formation?.coverVideoUrl),
      this.safeText(this.formation?.videoPrincipale),
      this.safeText(this.formation?.videoUrl),
      this.readLooseStringField(this.formation, 'mainVideoUrl'),
      this.readLooseStringField(this.formation, 'video')
    ];

    for (const candidate of candidates) {
      const normalized = this.normalizeVideoUrl(candidate);
      if (normalized) {
        return normalized;
      }
    }

    return '';
  }

  private getHeroVideoUrl(): string {
    const subject = this.getFormationSubject();

    const explicitVideo = this.toYoutubeEmbedUrl(this.resolveMainVideoFromFormation());
    if (explicitVideo) {
      return explicitVideo;
    }

    const stepVideo = this.formationSteps
      .map((step, stepIndex) => this.toYoutubeEmbedUrl(this.getStepVideoUrl(step, stepIndex)))
      .find((url) => !!url);
    if (stepVideo) {
      return stepVideo;
    }

    const videoMedia = this.formationMediaList.find((media) =>
      this.isPlayableVideoMedia(media)
    );
    if (videoMedia) {
      const mediaVideo = this.toYoutubeEmbedUrl(this.formationService.resolveMediaUrl(videoMedia.mediaUrl));
      if (mediaVideo) {
        return mediaVideo;
      }
    }

    return this.getAiSuggestedYoutubeVideoUrl(subject, 0);
  }

  private getStepVideoUrl(step: FormationSectionDto, stepIndex: number): string {
    const mediaType = (step.mediaType || '').toUpperCase();
    const directVideoUrl = this.toYoutubeEmbedUrl(step.mediaUrl || '');

    if (mediaType === 'VIDEO') {
      if (directVideoUrl) {
        return directVideoUrl;
      }

      const linkedVideo = this.toYoutubeEmbedUrl(this.getLinkedVideoFromFormationMedia(stepIndex));
      if (linkedVideo) {
        return linkedVideo;
      }

      return this.getAiSuggestedYoutubeVideoUrl(this.getFormationSubject(), stepIndex);
    }

    return '';
  }

  private isPlayableVideoMedia(media: FormationMediaResponseDto): boolean {
    const mediaType = this.safeText(media.mediaType).toUpperCase();
    const mimeType = this.safeText(media.mimeType).toLowerCase();
    const fileName = this.safeText(media.fileName).toLowerCase();
    const mediaUrl = this.safeText(media.mediaUrl).toLowerCase();
    const isVideo = mediaType === 'VIDEO'
      || mimeType.startsWith('video/')
      || /\.(mp4|mov|m3u8|webm)(\?.*)?$/i.test(fileName)
      || /\.(mp4|mov|m3u8|webm)(\?.*)?$/i.test(mediaUrl);
    if (!isVideo) {
      return false;
    }

    if (Number.isFinite(media.fileSize) && media.fileSize > 0 && media.fileSize < this.minimumPlayableVideoSizeBytes) {
      return false;
    }

    const resolvedUrl = this.normalizeVideoUrl(this.formationService.resolveMediaUrl(media.mediaUrl));
    return !!resolvedUrl;
  }

  private isImageMedia(media: FormationMediaResponseDto): boolean {
    const mediaType = this.safeText(media.mediaType).toUpperCase();
    const mimeType = this.safeText(media.mimeType).toLowerCase();
    const fileName = this.safeText(media.fileName).toLowerCase();
    const mediaUrl = this.safeText(media.mediaUrl).toLowerCase();
    return mediaType === 'IMAGE'
      || mimeType.startsWith('image/')
      || /\.(png|jpe?g|gif|webp|bmp|avif|svg)(\?.*)?$/i.test(fileName)
      || /\.(png|jpe?g|gif|webp|bmp|avif|svg)(\?.*)?$/i.test(mediaUrl);
  }

  private isEmbeddableVideoUrl(url: string): boolean {
    return /youtube\.com\/embed\//i.test(url);
  }

  private normalizeLevel(levelRaw: string): FormationLevel {
    const normalized = this.safeText(levelRaw).toUpperCase();
    if (normalized === 'ADVANCED') {
      return 'ADVANCED';
    }
    if (normalized === 'INTERMEDIATE') {
      return 'INTERMEDIATE';
    }
    return 'BEGINNER';
  }

  private normalizeStatus(statusRaw: string): 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' {
    const normalized = this.safeText(statusRaw).toUpperCase();
    if (normalized === 'PUBLISHED') {
      return 'PUBLISHED';
    }
    if (normalized === 'ARCHIVED') {
      return 'ARCHIVED';
    }
    return 'DRAFT';
  }

  private normalizeEstimatedDuration(rawDuration: string, sectionsCount: number): string {
    const parsed = this.parseDurationMinutes(rawDuration);
    const durationSlots = [15, 30, 45];

    if (parsed !== null) {
      const nearest = durationSlots.reduce((closest, candidate) =>
        Math.abs(candidate - parsed) < Math.abs(closest - parsed) ? candidate : closest,
      durationSlots[0]);
      return `${nearest} minutes`;
    }

    if (sectionsCount >= 6) {
      return '45 minutes';
    }
    if (sectionsCount >= 4) {
      return '30 minutes';
    }
    return '15 minutes';
  }

  private parseDurationMinutes(rawDuration: string): number | null {
    const matched = rawDuration.match(/(\d{1,3})/);
    if (!matched) {
      return null;
    }

    const parsed = Number.parseInt(matched[1], 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }

  private normalizeQuizItem(item: FormationQuizItemDto): FormationQuizItemDto | null {
    const question = this.safeText(item.question);
    if (!question) {
      return null;
    }

    const choices = Array.isArray(item.choices)
      ? item.choices.map((choice) => this.safeText(choice)).filter((choice) => choice.length > 0)
      : [];

    return {
      question,
      choices,
      correctAnswer: this.safeText(item.correctAnswer)
    };
  }

  private getFormationSubject(): string {
    const sourceTitle = this.displayTitle
      .replace(/^formation\s*[:\-]?\s*/i, '')
      .replace(/\s*\(.*\)\s*$/g, '')
      .trim();

    return sourceTitle || 'gestion pratique en camping';
  }

  private uniqueValues(values: string[]): string[] {
    const normalizedMap = new Set<string>();
    const result: string[] = [];

    values.forEach((value) => {
      const cleaned = value.replace(/\s+/g, ' ').trim();
      if (!cleaned) {
        return;
      }

      const key = cleaned.toLowerCase();
      if (normalizedMap.has(key)) {
        return;
      }

      normalizedMap.add(key);
      result.push(cleaned);
    });

    return result;
  }

  private truncateText(value: string, maxLength: number): string {
    const cleaned = value.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= maxLength) {
      return cleaned;
    }

    const shortened = cleaned.slice(0, maxLength).replace(/\s+\S*$/, '').trim();
    return `${shortened}...`;
  }

  private extractLikeCountFromSummary(formation: FormationSummaryDto): number {
    const record = formation as unknown as Record<string, unknown>;
    const candidates = [
      formation.likesCount,
      formation.favoriteCount,
      record['likeCount'],
      record['likes'],
      record['favoritesCount'],
      record['totalLikes']
    ];

    for (const candidate of candidates) {
      const parsed = this.toNonNegativeInteger(candidate);
      if (parsed !== null) {
        return parsed;
      }
    }

    return 0;
  }

  private extractConsultationCountFromSummary(formation: FormationSummaryDto): number {
    const record = formation as unknown as Record<string, unknown>;
    const candidates = [
      record['viewsCount'],
      record['viewCount'],
      record['consultationsCount'],
      record['consultationCount'],
      record['views'],
      record['consultations'],
      record['totalViews']
    ];

    for (const candidate of candidates) {
      const parsed = this.toNonNegativeInteger(candidate);
      if (parsed !== null) {
        return parsed;
      }
    }

    return 0;
  }

  private extractLikedStateFromSummary(formation: FormationSummaryDto): boolean {
    const record = formation as unknown as Record<string, unknown>;
    const candidates = [
      formation.likedByCurrentUser,
      formation.isFavorite,
      record['liked'],
      record['isLiked'],
      record['favorite'],
      record['favori']
    ];

    return candidates.some((candidate) => this.toBoolean(candidate));
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'oui';
    }
    return false;
  }

  private toNonNegativeInteger(value: unknown): number | null {
    const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return null;
    }

    return Math.floor(parsed);
  }

  private canManageFormationRole(): boolean {
    return this.authService.canManageFormations();
  }

  private isAdministratorRole(): boolean {
    return this.authService.canAccessAdminPanel(this.authService.getRole());
  }

  private getManagementBaseRoute(): string[] {
    return this.isAdministratorRole() ? ['/admin/formations'] : ['/public/formations'];
  }

  private isPublishedFormation(formation: FormationSummaryDto): boolean {
    const status = this.safeText(formation.status) || this.safeText(formation.statut);
    return status.toUpperCase() === 'PUBLISHED';
  }

  private getMissingPublicationRequirements(guideSteps: FormationGuideStep[]): string[] {
    const missing: string[] = [];
    const title = this.displayTitle.trim();
    const description = this.displayDescription.trim();
    const objectivesCount = this.objectives.length;
    const sectionsCount = this.formationSteps.length;
    const summaryLength = this.displaySummary.trim().length;
    const rawDuration = this.safeText(this.formation?.estimatedDuration) || this.readLooseStringField(this.formation, 'dureeEstimee');
    const parsedDuration = rawDuration ? this.parseDurationMinutes(rawDuration) : (typeof this.formation?.duration === 'number' ? this.formation.duration : null);
    const hasValidDuration = parsedDuration !== null && [15, 30, 45].includes(parsedDuration);

    if (title.length < 5) {
      missing.push('Titre');
    }
    if (description.length < 30) {
      missing.push('Description');
    }
    if (!['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(this.getRawLevelValue().toUpperCase())) {
      missing.push('Niveau');
    }
    if (!hasValidDuration) {
      missing.push('Duree');
    }
    if (!this.coverImageUrl) {
      missing.push('Image principale');
    }
    if (objectivesCount < 3) {
      missing.push('Objectifs pedagogiques');
    }
    if (sectionsCount < 3) {
      missing.push('Sections theoriques');
    }
    if (summaryLength < 30) {
      missing.push('Resume');
    }
    if (!this.hasCompleteGuideSteps(guideSteps)) {
      missing.push('Guide interactif');
    }

    return missing;
  }

  private hasCompleteGuideSteps(steps: FormationGuideStep[]): boolean {
    if (!Array.isArray(steps) || steps.length < 3) {
      return false;
    }

    return steps.every((step) => {
      const title = this.safeText(step.title);
      const description = this.safeText(step.description);
      const hasCustomTitle = title.length > 0 && !/^etape\s+\d+$/i.test(title);
      const hasMedia = this.safeText(step.imageUrl).length > 0 || this.safeText(step.videoUrl).length > 0;
      return hasCustomTitle && description.length >= 20 && hasMedia;
    });
  }

  private hasMeaningfulGuideSteps(steps: FormationGuideStep[]): boolean {
    if (!Array.isArray(steps) || steps.length === 0) {
      return false;
    }

    return steps.some((step) => {
      const title = this.safeText(step.title);
      const description = this.safeText(step.description);
      const imageUrl = this.safeText(step.imageUrl);
      const videoUrl = this.safeText(step.videoUrl);
      const hasCustomTitle = title.length > 0 && !/^etape\s+\d+$/i.test(title);
      return hasCustomTitle || description.length > 0 || imageUrl.length > 0 || videoUrl.length > 0;
    });
  }

  private normalizeBackendErrorMessage(rawMessage: string): string {
    const normalized = rawMessage.toLowerCase();
    if (
      normalized.includes('cannot delete or update a parent row')
      || normalized.includes('foreign key constraint fails')
      || normalized.includes('guide_interactif')
    ) {
      return 'Suppression impossible: cette formation est liee a un guide interactif. Supprimez d abord le guide associe.';
    }

    return rawMessage;
  }
}
