import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, catchError, forkJoin, of, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { GuideStepTooltipComponent } from '../guide-step-tooltip/guide-step-tooltip.component';
import {
  FormationGuideProgressState,
  FormationGuideStep,
  GuideDefinition,
  GuideMediaLink,
  GuideMediaType,
  GuidePageKey,
  GuideProgressState,
  GuideRewardState
} from '../models/guide-interactif.model';
import { GuideInteractifService } from '../services/guide-interactif.service';
import { FormationMediaService } from '../services/formation-media.service';
import { FormationMediaResponseDto } from '../models/formation-media.model';
import { FormationService } from '../../formations/services/formation.service';
import { FormationAiService } from '../../formations/services/formation-ai.service';
import { FormationSummaryDto } from '../../formations/models/formation.model';
import { FormationSectionDto } from '../../formations/models/ai-response.model';

interface GuideQuizQuestion {
  question: string;
  choices: string[];
  correctAnswer: string;
}

interface GuideQuizEvaluation {
  isCorrect: boolean;
  confidence: number;
  feedback: string;
  providedAnswer: string;
}

interface CelebrationConfettiItem {
  left: string;
  delay: string;
  duration: string;
  color: string;
  size: string;
}

@Component({
  selector: 'app-guide-interactif',
  standalone: true,
  imports: [CommonModule, RouterModule, GuideStepTooltipComponent, AdminIconComponent],
  templateUrl: './formation-detail.component.html',
  styleUrl: './formation-detail.component.css'
})
export class GuideInteractifComponent implements OnInit, OnChanges, OnDestroy {
  @Input() page: GuidePageKey = 'formation-create';
  @Input() embedded = false;
  @Input() autoStart = true;

  readonly pageOptions: Array<{ key: GuidePageKey; label: string; icon: string }> = [
    { key: 'formation-list', label: 'Liste formations', icon: 'list' },
    { key: 'formation-create', label: 'Creation', icon: 'plus' },
    { key: 'formation-detail', label: 'Detail', icon: 'eye' },
    { key: 'formation-edit', label: 'Modification', icon: 'edit' }
  ];

  guideTitle = 'Guide interactif';
  steps = [] as GuideDefinition['steps'];
  progressState: GuideProgressState | null = null;
  rewardState: GuideRewardState;
  isLoading = true;
  showRewardPanel = false;
  formationId: number | null = null;
  formationTitle = '';
  formationGuideProgress: FormationGuideProgressState | null = null;
  formationGuideMessage = '';
  mediaLinks: GuideMediaLink[] = [];
  mediaLinkUrl = '';
  mediaLinkLabel = '';
  mediaLinkType: GuideMediaType = 'IMAGE';
  mediaMessage = '';
  canManageFormations = false;
  isSavingFormationGuide = false;
  formationMediaItems: FormationMediaResponseDto[] = [];
  private formationMediaImages: string[] = [];
  private formationMediaVideos: string[] = [];
  private readonly minimumPlayableVideoSizeBytes = 2048;
  quizQuestions: GuideQuizQuestion[] = [];
  quizSelectedAnswers: Record<number, string> = {};
  quizTypedAnswers: Record<number, string> = {};
  quizEvaluations: Record<number, GuideQuizEvaluation> = {};
  quizEvaluationMessage = '';
  isEvaluatingQuiz = false;
  showCompletionCelebration = false;
  private hasPlayedCompletionCelebration = false;
  readonly celebrationConfetti = this.buildCelebrationConfetti();

  private destroy$ = new Subject<void>();
  private pageRefresh$ = new Subject<void>();
  private routeContextKey = '';

  constructor(
    private guideService: GuideInteractifService,
    private formationMediaService: FormationMediaService,
    private formationService: FormationService,
    private formationAiService: FormationAiService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private authService: AuthService
  ) {
    this.rewardState = this.guideService.getRewardState();
  }

  ngOnInit(): void {
    this.canManageFormations = this.canManageRole();

    this.guideService.reward$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.rewardState = state;
      });

    if (this.embedded) {
      this.initGuide();
      return;
    }

    this.syncRouteContext(true);

    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.syncRouteContext();
      });

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.syncRouteContext();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['page'] && !changes['page'].firstChange) {
      this.initGuide();
    }
  }

  ngOnDestroy(): void {
    this.pageRefresh$.next();
    this.pageRefresh$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get currentStep() {
    if (this.steps.length === 0) {
      return null;
    }

    if (!this.progressState) {
      return this.steps[0];
    }

    return this.steps.find((step) => step.id === this.progressState?.activeStep) ?? this.steps[0];
  }

  get isFormationGuideMode(): boolean {
    return Number.isFinite(this.formationId) && (this.formationId ?? 0) > 0;
  }

  get progressPercent(): number {
    if (this.isFormationGuideMode && this.steps.length > 0 && this.progressState) {
      return Math.round((this.progressState.completedStepIds.length / this.steps.length) * 100);
    }
    return this.guideService.getProgressPercent(this.page);
  }

  get isClosed(): boolean {
    return this.progressState?.closed ?? false;
  }

  get canShowReward(): boolean {
    return !this.isClosed && this.showRewardPanel;
  }

  get completionPoints(): number {
    return 50;
  }

  get currentPageLabel(): string {
    return this.pageOptions.find((option) => option.key === this.page)?.label || 'Guide';
  }

  get templatePreview() {
    return this.guideService.getRewardTemplate();
  }

  get currentStepId(): number | null {
    return this.currentStep?.id ?? null;
  }

  get currentStepChecklist(): string[] {
    return Array.isArray(this.currentStep?.checklist) ? this.currentStep.checklist : [];
  }

  get currentStepTutorial(): string {
    return this.currentStep?.tutorial?.trim() || '';
  }

  get currentStepMediaLinks(): GuideMediaLink[] {
    if (this.isFormationGuideMode) {
      return [];
    }

    const stepId = this.currentStepId;
    if (!stepId) {
      return this.mediaLinks;
    }

    const stepSpecificLinks = this.mediaLinks.filter((media) => media.stepId === stepId);
    return stepSpecificLinks.length > 0 ? stepSpecificLinks : this.mediaLinks;
  }

  get formationTitleLabel(): string {
    const cleaned = (this.formationTitle || '').trim();
    if (cleaned.length > 0) {
      return cleaned;
    }

    return this.formationId ? `Formation #${this.formationId}` : 'Formation';
  }

  get formationGuideHeading(): string {
    const label = this.formationTitleLabel;
    const normalized = label.toLowerCase();
    if (normalized === 'modifier formation' || normalized === 'creer formation') {
      return this.formationId ? `Guide interactif - Formation #${this.formationId}` : 'Guide interactif';
    }
    return `Guide interactif - ${label}`;
  }

  get hasQuizQuestions(): boolean {
    return this.quizQuestions.length > 0;
  }

  get answeredQuizCount(): number {
    return this.quizQuestions.filter((_, index) => this.getProvidedQuizAnswer(index).length > 0).length;
  }

  get correctedQuizCount(): number {
    return Object.keys(this.quizEvaluations).length;
  }

  get correctQuizCount(): number {
    return Object.values(this.quizEvaluations).filter((evaluation) => evaluation.isCorrect).length;
  }

  get quizScorePercent(): number {
    if (this.quizQuestions.length === 0) {
      return 0;
    }
    return Math.round((this.correctQuizCount / this.quizQuestions.length) * 100);
  }

  isStepDone(stepId: number): boolean {
    return this.progressState?.completedStepIds.includes(stepId) ?? false;
  }

  isActiveStep(stepId: number): boolean {
    return this.progressState?.activeStep === stepId;
  }

  getStepShortDescription(description: string): string {
    const cleaned = (description || '').replace(/\s+/g, ' ').trim();
    if (cleaned.length <= 180) {
      return cleaned;
    }

    const truncated = cleaned.slice(0, 180).replace(/\s+\S*$/, '').trim();
    return `${truncated}...`;
  }

  selectQuizChoice(questionIndex: number, choice: string): void {
    if (!Number.isFinite(questionIndex) || questionIndex < 0 || questionIndex >= this.quizQuestions.length) {
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
    if (!Number.isFinite(questionIndex) || questionIndex < 0 || questionIndex >= this.quizQuestions.length) {
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
    if (!Number.isFinite(questionIndex) || questionIndex < 0 || questionIndex >= this.quizQuestions.length) {
      return;
    }

    const question = this.quizQuestions[questionIndex];
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
    if (this.quizQuestions.length === 0) {
      return;
    }

    this.isEvaluatingQuiz = true;
    let checkedCount = 0;

    this.quizQuestions.forEach((question, index) => {
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

  getQuizQuestionEvaluation(questionIndex: number): GuideQuizEvaluation | null {
    return this.quizEvaluations[questionIndex] ?? null;
  }

  isQuizChoiceSelected(questionIndex: number, choice: string): boolean {
    return (this.quizSelectedAnswers[questionIndex] || '') === (choice || '').trim();
  }

  completeStep(stepId: number): void {
    if (this.steps.length === 0) {
      return;
    }

    if (this.isFormationGuideMode) {
      this.completeFormationGuideStepByOrder(stepId);
      return;
    }

    this.selectStep(stepId);
    this.completeCurrentStep();
  }

  addFormationGuideStep(): void {
    if (!this.canManageFormations || !this.isFormationGuideMode) {
      return;
    }

    const nextOrder = this.steps.length + 1;
    this.steps = [
      ...this.steps,
      {
        id: nextOrder,
        title: `Etape ${nextOrder}`,
        description: '',
        actionHint: 'Cliquez sur "Valider cette etape" apres execution.',
        mediaType: 'IMAGE',
        mediaUrl: ''
      }
    ];
    this.reindexFormationGuideSteps();
    this.formationGuideMessage = '';
  }

  removeFormationGuideStep(stepId: number): void {
    if (!this.canManageFormations || !this.isFormationGuideMode) {
      return;
    }

    this.steps = this.steps.filter((step) => step.id !== stepId);
    this.reindexFormationGuideSteps();
    this.formationGuideMessage = '';
  }

  onFormationGuideStepOrderChange(stepId: number, rawValue: string | number): void {
    if (!this.canManageFormations || !this.isFormationGuideMode) {
      return;
    }

    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || this.steps.length === 0) {
      return;
    }

    const boundedOrder = Math.max(1, Math.min(this.steps.length, Math.round(parsed)));
    const nextSteps = this.steps.map((step) => ({
      ...step,
      id: step.id === stepId ? boundedOrder : step.id
    }));
    this.steps = this.normalizeFormationGuideStepsForEditor(nextSteps);
  }

  onFormationGuideStepTitleChange(stepId: number, title: string): void {
    if (!this.canManageFormations || !this.isFormationGuideMode) {
      return;
    }

    this.steps = this.steps.map((step) =>
      step.id === stepId
        ? { ...step, title: title.trim() || `Etape ${step.id}` }
        : step
    );
  }

  onFormationGuideStepDescriptionChange(stepId: number, description: string): void {
    if (!this.canManageFormations || !this.isFormationGuideMode) {
      return;
    }

    this.steps = this.steps.map((step) =>
      step.id === stepId
        ? { ...step, description: description.trim() }
        : step
    );
  }

  onFormationGuideStepMediaTypeChange(stepId: number, mediaType: 'IMAGE' | 'VIDEO'): void {
    if (!this.canManageFormations || !this.isFormationGuideMode) {
      return;
    }

    this.steps = this.steps.map((step) =>
      step.id === stepId
        ? { ...step, mediaType, mediaUrl: '' }
        : step
    );
  }

  onFormationGuideStepMediaUrlChange(stepId: number, mediaUrl: string): void {
    if (!this.canManageFormations || !this.isFormationGuideMode) {
      return;
    }

    this.steps = this.steps.map((step) => {
      if (step.id !== stepId) {
        return step;
      }

      const mediaType: 'IMAGE' | 'VIDEO' = (step.mediaType || 'IMAGE') === 'VIDEO' ? 'VIDEO' : 'IMAGE';
      const normalizedUrl = mediaType === 'VIDEO'
        ? this.normalizeVideoUrl(mediaUrl)
        : this.normalizeImageUrl(mediaUrl);

      return {
        ...step,
        mediaType,
        mediaUrl: normalizedUrl
      };
    });
  }

  getFormationStepMediaOptions(step: GuideDefinition['steps'][number]): FormationMediaResponseDto[] {
    const isVideoStep = (step.mediaType || 'IMAGE') === 'VIDEO';
    return this.formationMediaItems.filter((media) => {
      if (isVideoStep) {
        return media.mediaType === 'VIDEO' || (media.mimeType || '').startsWith('video/');
      }
      return media.mediaType === 'IMAGE' || (media.mimeType || '').startsWith('image/');
    });
  }

  applyFormationGuideStepMediaFromLibrary(stepId: number, mediaIdRaw: string): void {
    if (!this.canManageFormations || !this.isFormationGuideMode) {
      return;
    }

    const mediaId = Number.parseInt(mediaIdRaw, 10);
    if (!Number.isFinite(mediaId) || mediaId <= 0) {
      return;
    }

    const selectedMedia = this.formationMediaItems.find((media) => media.id === mediaId);
    if (!selectedMedia) {
      return;
    }

    const normalizedType: 'IMAGE' | 'VIDEO' = selectedMedia.mediaType === 'VIDEO' || (selectedMedia.mimeType || '').startsWith('video/')
      ? 'VIDEO'
      : 'IMAGE';
    const normalizedUrl = normalizedType === 'VIDEO'
      ? this.normalizeVideoUrl(this.formationMediaService.resolveMediaUrl(selectedMedia.mediaUrl))
      : this.normalizeImageUrl(this.formationMediaService.resolveMediaUrl(selectedMedia.mediaUrl));

    if (!normalizedUrl) {
      return;
    }

    this.steps = this.steps.map((step) =>
      step.id === stepId
        ? { ...step, mediaType: normalizedType, mediaUrl: normalizedUrl }
        : step
    );
  }

  saveFormationGuideSteps(): void {
    if (!this.canManageFormations || !this.isFormationGuideMode || !this.formationId || this.isSavingFormationGuide) {
      return;
    }

    this.isSavingFormationGuide = true;
    this.formationGuideMessage = '';

    const payload = this.toFormationGuideStepPayload();
    this.guideService.saveFormationGuideSteps(this.formationId, payload)
      .pipe(takeUntil(this.pageRefresh$), takeUntil(this.destroy$))
      .subscribe({
        next: (savedSteps) => {
          this.steps = this.mapFormationGuideStepsToGuideSteps(savedSteps);
          this.reindexFormationGuideSteps();
          const totalSteps = Math.max(1, this.steps.length);
          this.guideService.loadFormationGuideProgress(this.formationId as number, totalSteps)
            .pipe(takeUntil(this.pageRefresh$), takeUntil(this.destroy$))
            .subscribe({
              next: (progress) => {
                this.applyFormationGuideProgress(progress, totalSteps);
                this.isSavingFormationGuide = false;
                this.formationGuideMessage = 'Guide interactif enregistre avec succes.';
              },
              error: () => {
                this.isSavingFormationGuide = false;
                this.formationGuideMessage = 'Guide enregistre. Progression non synchronisee.';
              }
            });
        },
        error: () => {
          this.isSavingFormationGuide = false;
          this.formationGuideMessage = 'Impossible d enregistrer les etapes du guide.';
        }
      });
  }

  get currentFormationGuideImageUrl(): string {
    const current = this.getCurrentFormationGuideStep();
    if (!current?.imageUrl) {
      return '';
    }
    return this.normalizeImageUrl(current.imageUrl);
  }

  get currentFormationGuideVideoUrl(): SafeResourceUrl | null {
    const current = this.getCurrentFormationGuideStep();
    if (!current?.videoUrl) {
      return null;
    }
    const normalized = this.normalizeVideoUrl(current.videoUrl);
    if (!normalized) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(normalized);
  }

  getGuideStepImageUrl(step: GuideDefinition['steps'][number]): string {
    if ((step.mediaType || '').toUpperCase() !== 'IMAGE') {
      return '';
    }

    return this.normalizeImageUrl(step.mediaUrl || '');
  }

  getGuideStepVideoEmbedUrl(step: GuideDefinition['steps'][number]): SafeResourceUrl | null {
    if ((step.mediaType || '').toUpperCase() !== 'VIDEO') {
      return null;
    }

    const contextText = `${step.title || ''} ${step.description || ''}`.trim();
    const normalizedVideoUrl = this.toYoutubeEmbedUrl(step.mediaUrl || '') || this.getGuideYoutubeFallbackVideo(step.id, contextText);
    if (!normalizedVideoUrl || !this.isEmbeddableVideoUrl(normalizedVideoUrl)) {
      return null;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(normalizedVideoUrl);
  }

  getGuideStepVideoSourceUrl(step: GuideDefinition['steps'][number]): string {
    if ((step.mediaType || '').toUpperCase() !== 'VIDEO') {
      return '';
    }

    return '';
  }

  getGuideMediaImageUrl(media: GuideMediaLink): string {
    if (media.type !== 'IMAGE') {
      return '';
    }
    return this.normalizeImageUrl(media.url);
  }

  getGuideMediaVideoEmbedUrl(media: GuideMediaLink): SafeResourceUrl | null {
    if (media.type !== 'VIDEO') {
      return null;
    }

    const normalizedVideoUrl = this.normalizeVideoUrl(media.url);
    if (!normalizedVideoUrl || !this.isEmbeddableVideoUrl(normalizedVideoUrl)) {
      return null;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(normalizedVideoUrl);
  }

  getGuideMediaVideoSourceUrl(media: GuideMediaLink): string {
    if (media.type !== 'VIDEO') {
      return '';
    }

    const normalizedVideoUrl = this.normalizeVideoUrl(media.url);
    if (!normalizedVideoUrl || this.isEmbeddableVideoUrl(normalizedVideoUrl)) {
      return '';
    }

    return normalizedVideoUrl;
  }

  isGuideMediaVideoInvalid(media: GuideMediaLink): boolean {
    if (media.type !== 'VIDEO') {
      return false;
    }

    const normalizedVideoUrl = this.normalizeVideoUrl(media.url);
    return !normalizedVideoUrl || (!this.getGuideMediaVideoEmbedUrl(media) && !this.getGuideMediaVideoSourceUrl(media));
  }

  nextStep(): void {
    if (this.isFormationGuideMode) {
      this.shiftFormationActiveStep(1);
      return;
    }
    this.guideService.nextStep(this.page);
  }

  previousStep(): void {
    if (this.isFormationGuideMode) {
      this.shiftFormationActiveStep(-1);
      return;
    }
    this.guideService.previousStep(this.page);
  }

  selectStep(stepId: number): void {
    if (this.isFormationGuideMode) {
      this.setFormationActiveStep(stepId);
      return;
    }
    this.guideService.selectStep(this.page, stepId);
  }

  completeCurrentStep(): void {
    if (this.isFormationGuideMode) {
      this.completeFormationGuideCurrentStep();
      return;
    }
    this.guideService.completeCurrentStep(this.page);
  }

  closeGuide(): void {
    if (this.isFormationGuideMode && this.progressState) {
      this.progressState = {
        ...this.progressState,
        closed: true
      };
      return;
    }
    this.guideService.closeGuide(this.page);
  }

  resumeGuide(): void {
    if (this.isFormationGuideMode && this.progressState) {
      this.progressState = {
        ...this.progressState,
        closed: false
      };
      return;
    }
    this.guideService.resumeGuide(this.page);
  }

  restartGuide(): void {
    if (this.isFormationGuideMode && this.formationId) {
      this.guideService.resetFormationGuideProgress(this.formationId, this.formationGuideProgress?.guideId);
      if (this.formationGuideProgress) {
        this.formationGuideProgress = {
          ...this.formationGuideProgress,
          activeStepOrder: 1,
          completedStepOrders: [],
          progressPercent: 0
        };
      }
      this.progressState = {
        page: this.page,
        activeStep: 1,
        completedStepIds: [],
        closed: false,
        updatedAt: new Date().toISOString()
      };
      this.showRewardPanel = false;
      this.showCompletionCelebration = false;
      this.hasPlayedCompletionCelebration = false;
      this.formationGuideMessage = '';
      this.quizEvaluationMessage = '';
      this.quizSelectedAnswers = {};
      this.quizTypedAnswers = {};
      this.quizEvaluations = {};
      return;
    }
    this.guideService.resetProgress(this.page);
    this.showRewardPanel = false;
    this.showCompletionCelebration = false;
    this.hasPlayedCompletionCelebration = false;
    this.clearQuizSessionState();
  }

  addGuideMediaLink(): void {
    if (!this.canManageFormations) {
      this.mediaMessage = 'Mode consultation: seuls ADMIN et GUIDE peuvent modifier les medias du guide.';
      return;
    }

    if (this.isFormationGuideMode) {
      this.mediaMessage = 'Les medias de ce guide sont definis par l administrateur depuis la formation.';
      return;
    }

    const result = this.guideService.addMediaLinkWithStep(
      this.page,
      this.mediaLinkType,
      this.mediaLinkUrl,
      this.mediaLinkLabel,
      this.currentStepId ?? undefined
    );

    this.mediaMessage = result.message;
    if (!result.ok) {
      return;
    }

    this.mediaLinkUrl = '';
    this.mediaLinkLabel = '';
    this.guideService.markAction(this.page, 'media-added');
  }

  removeGuideMediaLink(linkId: string): void {
    if (!this.canManageFormations) {
      this.mediaMessage = 'Mode consultation: seuls ADMIN et GUIDE peuvent modifier les medias du guide.';
      return;
    }

    if (this.isFormationGuideMode) {
      return;
    }
    this.guideService.removeMediaLink(this.page, linkId);
    this.mediaMessage = 'Media explicatif supprime.';
  }

  trackByMediaLinkId(_: number, media: GuideMediaLink): string {
    return media.id;
  }

  getMediaStepLabel(media: GuideMediaLink): string {
    const stepId = media.stepId;
    if (!stepId) {
      return 'Etape generale';
    }

    const matchingStep = this.steps.find((step) => step.id === stepId);
    return matchingStep ? `Etape ${stepId}: ${matchingStep.title}` : `Etape ${stepId}`;
  }

  switchPage(page: GuidePageKey): void {
    if (this.isFormationGuideMode) {
      return;
    }

    if (page === this.page) {
      return;
    }

    if (this.embedded) {
      this.page = page;
      this.initGuide();
      return;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  createFormationWithTemplate(): void {
    if (!this.canManageFormations) {
      return;
    }

    this.guideService.prepareTemplateForCreation();
    this.router.navigate(this.getFormationCreateRoute(), {
      queryParams: {
        sourceGuide: 'template'
      }
    });
  }

  generateFormationWithAi(): void {
    if (!this.canManageFormations) {
      return;
    }

    this.guideService.setPendingAiSubject(this.templatePreview.title);
    this.router.navigate(this.getFormationCreateRoute(), {
      queryParams: {
        ai: 1,
        sourceGuide: 'ai'
      }
    });
  }

  openFormationsList(): void {
    this.router.navigate(this.isAdminContext() ? ['/admin/formations'] : ['/public/formations']);
  }

  openRewardsOverview(): void {
    if (this.isAdminContext()) {
      this.router.navigate(['/admin/profile']);
      return;
    }

    this.router.navigate(['/public/profile']);
  }

  private initGuide(): void {
    this.pageRefresh$.next();
    this.isLoading = true;
    this.showRewardPanel = false;
    this.showCompletionCelebration = false;
    this.formationGuideMessage = '';
    this.clearQuizSessionState();

    if (this.isFormationGuideMode && this.formationId) {
      this.initFormationGuideMode(this.formationId);
      return;
    }

    this.guideService.startPage(this.page, this.autoStart);

    this.guideService.getGuide(this.page)
      .pipe(takeUntil(this.pageRefresh$), takeUntil(this.destroy$))
      .subscribe({
        next: (guide) => {
          this.applyGuideDefinition(guide);
          this.isLoading = false;
        },
        error: () => {
          this.guideTitle = 'Guide interactif';
          this.steps = [];
          this.isLoading = false;
        }
      });

    this.guideService.progress$(this.page)
      .pipe(takeUntil(this.pageRefresh$), takeUntil(this.destroy$))
      .subscribe((progress) => {
        this.progressState = progress;
        this.syncCompletionReward();
        if (this.formationId) {
          this.guideService.saveFormationProgress(this.formationId, this.progressPercent);
        }
      });

    this.guideService.mediaLinks$(this.page)
      .pipe(takeUntil(this.pageRefresh$), takeUntil(this.destroy$))
      .subscribe((links) => {
        this.mediaLinks = links;
      });
  }

  private initFormationGuideMode(formationId: number): void {
    if (!this.canManageFormations) {
      this.formationService.getFormationById(formationId)
        .pipe(takeUntil(this.pageRefresh$), takeUntil(this.destroy$))
        .subscribe({
          next: (formation) => {
            this.formationTitle = this.resolveFormationTitle(formation?.titre, formation?.title, formation?.nom, formationId);
            if (!this.isPublishedFormation(formation?.status, formation?.statut)) {
              this.isLoading = false;
              this.formationGuideMessage = 'Acces reserve aux formations publiees.';
              this.router.navigate(['/public/formations']);
              return;
            }

            this.loadFormationGuideContent(formationId);
          },
          error: () => {
            this.isLoading = false;
            this.formationGuideMessage = 'Impossible de verifier le statut de publication de la formation.';
            this.router.navigate(['/public/formations']);
          }
        });
      return;
    }

    this.loadFormationGuideContent(formationId);
  }

  private loadFormationGuideContent(formationId: number): void {
    forkJoin({
      formation: this.formationService.getFormationById(formationId).pipe(
        takeUntil(this.pageRefresh$),
        catchError(() => of(null))
      ),
      steps: this.guideService.listFormationGuideSteps(formationId),
      media: this.formationMediaService.getFormationMedia(formationId).pipe(
        takeUntil(this.pageRefresh$),
        catchError(() => of([]))
      )
    })
      .pipe(takeUntil(this.pageRefresh$), takeUntil(this.destroy$))
      .subscribe({
        next: ({ formation, steps, media }) => {
          this.formationTitle = this.resolveFormationTitle(
            formation?.titre,
            formation?.title,
            formation?.nom,
            formationId
          );
          this.quizQuestions = this.extractFormationQuizQuestions(formation, this.formationTitle);
          this.formationMediaItems = this.formationMediaService.sortByDisplayOrder(media);
          this.prepareFormationMediaPools(this.formationMediaItems);
          const mappedSteps = this.mapFormationGuideStepsToGuideSteps(steps);
          const resolvedSteps = this.resolveFormationGuideStepsWithFallback(formationId, formation, mappedSteps);
          this.steps = resolvedSteps;
          this.guideTitle = resolvedSteps.length > 0
            ? 'Guide interactif lie a la formation'
            : 'Guide interactif en attente de configuration';

          const totalSteps = Math.max(1, resolvedSteps.length);
          this.applyFormationGuideProgress(
            this.guideService.getFormationGuideProgressState(formationId, totalSteps),
            totalSteps
          );
          this.isLoading = false;

          this.guideService.loadFormationGuideProgress(formationId, totalSteps)
            .pipe(takeUntil(this.pageRefresh$), takeUntil(this.destroy$))
            .subscribe({
              next: (progress) => {
                this.applyFormationGuideProgress(progress, totalSteps);
                this.isLoading = false;
              },
              error: () => {
                this.applyFormationGuideProgress({
                  formationId,
                  activeStepOrder: 1,
                  completedStepOrders: [],
                  progressPercent: 0
                }, totalSteps);
                this.isLoading = false;
              }
            });
        },
        error: () => {
          this.steps = [];
          this.quizQuestions = [];
          this.formationMediaItems = [];
          this.progressState = {
            page: this.page,
            activeStep: 1,
            completedStepIds: [],
            closed: false,
            updatedAt: new Date().toISOString()
          };
          this.isLoading = false;
          this.formationGuideMessage = 'Impossible de charger le guide de cette formation.';
        }
      });
  }

  private isPublishedFormation(status?: string, statut?: string): boolean {
    return [status, statut]
      .map((value) => (typeof value === 'string' ? value.trim().toUpperCase() : ''))
      .some((value) => value === 'PUBLISHED');
  }

  private mapFormationGuideStepsToGuideSteps(steps: FormationGuideStep[]): GuideDefinition['steps'] {
    return steps
      .map((step, index): GuideDefinition['steps'][number] => {
        const order = Number.isFinite(step.order) && step.order > 0 ? Math.round(step.order) : (index + 1);
        const { mediaType, mediaUrl } = this.selectStepMedia(step, order);

        return {
          id: order,
          title: step.title?.trim() || `Etape ${order}`,
          description: step.description?.trim() || '',
          actionHint: 'Cliquez sur "Valider cette etape" apres execution.',
          mediaType,
          mediaUrl
        };
      })
      .sort((first, second) => first.id - second.id)
      .map((step, index) => ({
        ...step,
        id: index + 1
      }));
  }

  private resolveFormationGuideStepsWithFallback(
    formationId: number,
    formation: FormationSummaryDto | null,
    backendSteps: GuideDefinition['steps']
  ): GuideDefinition['steps'] {
    if (this.hasMeaningfulFormationGuideSteps(backendSteps)) {
      return backendSteps;
    }

    const generatedSteps = this.buildGeneratedGuideStepsFromFormation(formationId, formation);
    const mappedGeneratedSteps = this.mapFormationGuideStepsToGuideSteps(generatedSteps);

    if (mappedGeneratedSteps.length > 0) {
      return mappedGeneratedSteps;
    }

    return backendSteps;
  }

  private hasMeaningfulFormationGuideSteps(steps: GuideDefinition['steps']): boolean {
    if (!Array.isArray(steps) || steps.length < 3) {
      return false;
    }

    return steps.every((step) => {
      const title = (step.title || '').trim();
      const description = (step.description || '').trim();
      const hasCustomTitle = title.length > 0 && !/^etape\s+\d+$/i.test(title);
      const hasMedia = !!this.normalizeImageUrl(step.mediaUrl || '') || !!this.normalizeVideoUrl(step.mediaUrl || '');
      return hasCustomTitle && description.length >= 15 && hasMedia;
    });
  }

  private buildGeneratedGuideStepsFromFormation(
    formationId: number,
    formation: FormationSummaryDto | null
  ): FormationGuideStep[] {
    const title = this.resolveFormationTitle(
      formation?.titre,
      formation?.title,
      formation?.nom,
      formationId
    );
    const level = this.normalizeFormationLevel(formation?.level);
    const objectives = this.extractFormationObjectives(formation);
    const sections = this.extractFormationSections(formation);
    const description = this.resolveFormationDescription(formation);
    const coverImageUrl = this.resolveFormationCoverImage(formation);

    const fallback = this.formationAiService.buildMockGeneratedFormation({
      subject: title,
      level,
      targetUser: 'CLIENT'
    });

    const finalObjectives = objectives.length > 0 ? objectives : fallback.objectives;
    const finalSections = sections.length > 0 ? sections : fallback.sections;
    const finalDescription = description || fallback.description;

    return this.formationAiService.generateGuideStepsFromFormation({
      formationId,
      title,
      description: finalDescription,
      objectives: finalObjectives,
      sections: finalSections,
      mainImageUrl: coverImageUrl || undefined
    });
  }

  private extractFormationObjectives(formation: FormationSummaryDto | null): string[] {
    const fromObjectives = Array.isArray(formation?.objectives) ? formation.objectives : [];
    const fromObjectifs = Array.isArray(formation?.objectifs) ? formation.objectifs : [];
    const merged = [...fromObjectives, ...fromObjectifs]
      .map((objective) => (typeof objective === 'string' ? objective.trim() : ''))
      .filter((objective) => objective.length > 0);

    return Array.from(new Set(merged.map((objective) => objective.replace(/\s+/g, ' ').trim())));
  }

  private extractFormationSections(formation: FormationSummaryDto | null): FormationSectionDto[] {
    const directSections = Array.isArray(formation?.sections)
      ? formation.sections
        .map((section, index) => this.normalizeFormationSection(section, index))
        .filter((section) => section.content.length > 0)
      : [];

    if (directSections.length > 0) {
      return directSections;
    }

    const content = this.toText(formation?.content) || this.toText(formation?.contenu);
    if (!content) {
      return [];
    }

    return this.parseFormationSectionsFromContent(content);
  }

  private normalizeFormationSection(section: FormationSectionDto, index: number): FormationSectionDto {
    const title = this.toText(section?.title) || `Etape ${index + 1}`;
    const content = this.toText(section?.content);
    const mediaType: 'IMAGE' | 'VIDEO' = this.toText(section?.mediaType).toUpperCase() === 'VIDEO'
      ? 'VIDEO'
      : 'IMAGE';
    const mediaUrl = mediaType === 'VIDEO'
      ? this.normalizeVideoUrl(this.toText(section?.mediaUrl))
      : this.normalizeImageUrl(this.toText(section?.mediaUrl));

    return {
      title,
      content,
      mediaType,
      mediaUrl: mediaUrl || undefined
    };
  }

  private parseFormationSectionsFromContent(content: string): FormationSectionDto[] {
    const lines = content
      .replace(/\r/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const sections: FormationSectionDto[] = [];

    lines.forEach((line) => {
      const mediaInlineMatch = line.match(/^@media\[(IMAGE|VIDEO)\]\s*=\s*(.+)$/i);
      if (mediaInlineMatch && sections.length > 0) {
        const mediaType: 'IMAGE' | 'VIDEO' = mediaInlineMatch[1].toUpperCase() === 'VIDEO' ? 'VIDEO' : 'IMAGE';
        const mediaUrl = mediaType === 'VIDEO'
          ? this.normalizeVideoUrl(mediaInlineMatch[2])
          : this.normalizeImageUrl(mediaInlineMatch[2]);
        if (mediaUrl) {
          const last = sections[sections.length - 1];
          last.mediaType = mediaType;
          last.mediaUrl = mediaUrl;
        }
        return;
      }

      const matched = line.match(/^([^:.-]{3,})\s*[:.-]\s*(.+)$/);
      if (matched) {
        sections.push({
          title: this.toText(matched[1]) || `Etape ${sections.length + 1}`,
          content: this.toText(matched[2]),
          mediaType: 'IMAGE'
        });
        return;
      }

      sections.push({
        title: `Etape ${sections.length + 1}`,
        content: this.toText(line),
        mediaType: 'IMAGE'
      });
    });

    return sections
      .map((section, index) => this.normalizeFormationSection(section, index))
      .filter((section) => section.content.length > 0);
  }

  private resolveFormationDescription(formation: FormationSummaryDto | null): string {
    return this.toText(formation?.description)
      || this.toText(formation?.summary)
      || this.toText(formation?.resume);
  }

  private resolveFormationCoverImage(formation: FormationSummaryDto | null): string {
    const candidates = [
      this.toText(formation?.coverImageUrl),
      this.toText(formation?.imagePrincipale),
      this.toText(formation?.imageUrl),
      this.toText(formation?.photoUrl)
    ];

    for (const candidate of candidates) {
      const normalized = this.normalizeImageUrl(candidate);
      if (normalized) {
        return normalized;
      }
    }

    return '';
  }

  private normalizeFormationLevel(rawLevel: string | undefined): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' {
    const normalized = this.toText(rawLevel).toUpperCase();
    if (normalized === 'INTERMEDIATE' || normalized === 'ADVANCED') {
      return normalized;
    }
    return 'BEGINNER';
  }

  private selectStepMedia(step: FormationGuideStep, stepOrder: number): { mediaType?: 'IMAGE' | 'VIDEO'; mediaUrl?: string } {
    const declaredImage = this.normalizeImageUrl(step.imageUrl || '');
    const declaredVideo = this.toYoutubeEmbedUrl(step.videoUrl || '');
    const contextText = `${this.formationTitleLabel} ${step.title || ''} ${step.description || ''}`.trim();
    const fallbackYoutubeVideo = this.getGuideYoutubeFallbackVideo(stepOrder, contextText);

    if (declaredImage && declaredVideo) {
      return { mediaType: 'VIDEO', mediaUrl: declaredVideo };
    }

    if (declaredVideo) {
      return { mediaType: 'VIDEO', mediaUrl: declaredVideo };
    }

    if (fallbackYoutubeVideo) {
      return { mediaType: 'VIDEO', mediaUrl: fallbackYoutubeVideo };
    }

    if (declaredImage) {
      return { mediaType: 'IMAGE', mediaUrl: declaredImage };
    }

    if (this.formationMediaImages.length > 0) {
      const image = this.formationMediaImages[(stepOrder - 1) % this.formationMediaImages.length];
      if (image) {
        return { mediaType: 'IMAGE', mediaUrl: image };
      }
    }

    if (this.formationMediaVideos.length > 0) {
      const video = this.toYoutubeEmbedUrl(this.formationMediaVideos[(stepOrder - 1) % this.formationMediaVideos.length] || '');
      if (video) {
        return { mediaType: 'VIDEO', mediaUrl: video };
      }
    }

    return {};
  }

  private toFormationGuideStepPayload(): FormationGuideStep[] {
    return this.normalizeFormationGuideStepsForEditor(this.steps)
      .map((step, index) => {
        const order = index + 1;
        const title = (step.title || '').trim() || `Etape ${order}`;
        const description = (step.description || '').trim();
        const mediaType: 'IMAGE' | 'VIDEO' = (step.mediaType || 'IMAGE') === 'VIDEO' ? 'VIDEO' : 'IMAGE';
        const mediaUrl = (step.mediaUrl || '').trim();

        return {
          id: `${this.formationId}-${order}`,
          formationId: this.formationId ?? undefined,
          order,
          title,
          description,
          imageUrl: mediaType === 'IMAGE' && mediaUrl ? this.normalizeImageUrl(mediaUrl) : undefined,
          videoUrl: mediaType === 'VIDEO' && mediaUrl ? this.normalizeVideoUrl(mediaUrl) : undefined
        };
      });
  }

  private reindexFormationGuideSteps(): void {
    this.steps = this.normalizeFormationGuideStepsForEditor(this.steps);
  }

  private normalizeFormationGuideStepsForEditor(steps: GuideDefinition['steps']): GuideDefinition['steps'] {
    return [...steps]
      .sort((first, second) => first.id - second.id)
      .map((step, index) => ({
        ...step,
        id: index + 1,
        title: (step.title || '').trim() || `Etape ${index + 1}`,
        description: (step.description || '').trim(),
        actionHint: (step.actionHint || '').trim() || 'Cliquez sur "Valider cette etape" apres execution.',
        mediaType: (step.mediaType || 'IMAGE') === 'VIDEO' ? 'VIDEO' : 'IMAGE',
        mediaUrl: (step.mediaUrl || '').trim()
      }));
  }

  private applyFormationGuideProgress(progress: FormationGuideProgressState, totalSteps: number): void {
    const safeTotal = Math.max(1, totalSteps);
    const activeStep = Math.min(safeTotal, Math.max(1, progress.activeStepOrder));
    const completed = progress.completedStepOrders
      .filter((order) => Number.isFinite(order) && order >= 1 && order <= safeTotal)
      .sort((first, second) => first - second);

    this.formationGuideProgress = {
      ...progress,
      activeStepOrder: activeStep,
      completedStepOrders: completed,
      progressPercent: Math.round((completed.length / safeTotal) * 100)
    };

    this.progressState = {
      page: this.page,
      activeStep,
      completedStepIds: completed,
      closed: this.progressState?.closed ?? false,
      updatedAt: new Date().toISOString(),
      backendProgressId: progress.backendProgressId
    };

    if (this.formationId) {
      this.guideService.saveFormationProgress(
        this.formationId,
        this.formationGuideProgress.progressPercent,
        this.formationGuideProgress.guideId
      );
    }
    this.syncCompletionReward();
  }

  private shiftFormationActiveStep(delta: number): void {
    if (!this.progressState || this.steps.length === 0) {
      return;
    }

    const nextStep = Math.min(this.steps.length, Math.max(1, this.progressState.activeStep + delta));
    this.setFormationActiveStep(nextStep);
  }

  private setFormationActiveStep(stepId: number): void {
    if (!this.progressState || this.steps.length === 0) {
      return;
    }

    const boundedStep = Math.min(this.steps.length, Math.max(1, Math.round(stepId)));
    this.progressState = {
      ...this.progressState,
      activeStep: boundedStep,
      updatedAt: new Date().toISOString()
    };

    if (this.formationGuideProgress) {
      this.formationGuideProgress = {
        ...this.formationGuideProgress,
        activeStepOrder: boundedStep
      };
    }
  }

  private completeFormationGuideCurrentStep(): void {
    if (!this.formationId || !this.progressState || this.steps.length === 0) {
      return;
    }

    const currentStepOrder = this.progressState.activeStep;
    this.guideService.completeFormationGuideStep(this.formationId, currentStepOrder, this.steps.length)
      .pipe(takeUntil(this.pageRefresh$), takeUntil(this.destroy$))
      .subscribe({
        next: (progress) => {
          this.applyFormationGuideProgress(progress, this.steps.length);
          this.formationGuideMessage = '';
        },
        error: () => {
          this.formationGuideMessage = 'Progression sauvegardee localement. Synchronisation serveur indisponible.';
          const completedSet = new Set(this.progressState?.completedStepIds ?? []);
          completedSet.add(currentStepOrder);
          const completed = Array.from(completedSet).sort((first, second) => first - second);
          const fallbackProgress: FormationGuideProgressState = {
            formationId: this.formationId ?? 0,
            activeStepOrder: Math.min(this.steps.length, currentStepOrder + 1),
            completedStepOrders: completed,
            progressPercent: Math.round((completed.length / this.steps.length) * 100)
          };
          this.applyFormationGuideProgress(fallbackProgress, this.steps.length);
        }
      });
  }

  private completeFormationGuideStepByOrder(stepOrder: number): void {
    if (!Number.isFinite(stepOrder) || stepOrder <= 0 || this.steps.length === 0) {
      return;
    }

    this.setFormationActiveStep(stepOrder);
    this.completeFormationGuideCurrentStep();
  }

  private clearQuizSessionState(): void {
    this.quizQuestions = [];
    this.quizSelectedAnswers = {};
    this.quizTypedAnswers = {};
    this.quizEvaluations = {};
    this.quizEvaluationMessage = '';
    this.isEvaluatingQuiz = false;
  }

  private extractFormationQuizQuestions(formation: FormationSummaryDto | null, formationTitle: string): GuideQuizQuestion[] {
    const sourceQuiz = Array.isArray(formation?.quiz) ? formation.quiz : [];
    const normalizedSourceQuiz = sourceQuiz
      .map((item) => this.normalizeGuideQuizQuestion(item))
      .filter((item): item is GuideQuizQuestion => item !== null);

    if (normalizedSourceQuiz.length > 0) {
      return normalizedSourceQuiz;
    }

    const fallbackQuiz = this.formationAiService.buildMockGeneratedFormation({
      subject: formationTitle || `Formation #${formation?.id ?? ''}`,
      level: this.normalizeFormationLevel(formation?.level),
      targetUser: 'CLIENT'
    }).quiz;

    return fallbackQuiz
      .map((item) => this.normalizeGuideQuizQuestion(item))
      .filter((item): item is GuideQuizQuestion => item !== null);
  }

  private normalizeGuideQuizQuestion(value: unknown): GuideQuizQuestion | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as { question?: unknown; choices?: unknown; correctAnswer?: unknown };
    const question = this.toText(record.question);
    const choices = Array.isArray(record.choices)
      ? record.choices.map((choice) => this.toText(choice)).filter((choice) => choice.length > 0)
      : [];
    const correctAnswer = this.toText(record.correctAnswer);

    if (!question || choices.length < 2 || !correctAnswer) {
      return null;
    }

    const finalChoices = Array.from(new Set(choices));
    if (!finalChoices.some((choice) => this.toComparableText(choice) === this.toComparableText(correctAnswer))) {
      finalChoices.push(correctAnswer);
    }

    return {
      question,
      choices: finalChoices.slice(0, 6),
      correctAnswer
    };
  }

  private getProvidedQuizAnswer(questionIndex: number): string {
    const typed = (this.quizTypedAnswers[questionIndex] || '').trim();
    if (typed.length > 0) {
      return typed;
    }
    return (this.quizSelectedAnswers[questionIndex] || '').trim();
  }

  private evaluateQuizAnswerWithAi(correctAnswer: string, providedAnswer: string): GuideQuizEvaluation {
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
    return this.toText(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private triggerCompletionCelebration(): void {
    if (this.hasPlayedCompletionCelebration) {
      return;
    }

    this.hasPlayedCompletionCelebration = true;
    this.showCompletionCelebration = true;
    this.playApplauseSound();

    setTimeout(() => {
      this.showCompletionCelebration = false;
    }, 6200);
  }

  private playApplauseSound(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    try {
      const audioContext = new AudioContextCtor();
      const baseTime = audioContext.currentTime + 0.02;
      audioContext.resume().catch(() => undefined);

      for (let burst = 0; burst < 7; burst += 1) {
        const burstDuration = 0.08 + Math.random() * 0.04;
        const frameCount = Math.max(1, Math.floor(audioContext.sampleRate * burstDuration));
        const buffer = audioContext.createBuffer(1, frameCount, audioContext.sampleRate);
        const channel = buffer.getChannelData(0);

        for (let i = 0; i < frameCount; i += 1) {
          const decay = 1 - (i / frameCount);
          channel[i] = (Math.random() * 2 - 1) * decay;
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;

        const bandPass = audioContext.createBiquadFilter();
        bandPass.type = 'bandpass';
        bandPass.frequency.value = 2200 + Math.random() * 1600;
        bandPass.Q.value = 0.9;

        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0.0001, baseTime + burst * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.18, baseTime + burst * 0.11 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, baseTime + burst * 0.11 + burstDuration);

        source.connect(bandPass);
        bandPass.connect(gain);
        gain.connect(audioContext.destination);
        source.start(baseTime + burst * 0.11);
      }

      setTimeout(() => {
        audioContext.close().catch(() => undefined);
      }, 2200);
    } catch {
      // Ignore audio errors: celebration remains visual.
    }
  }

  private buildCelebrationConfetti(): CelebrationConfettiItem[] {
    const palette = ['#5d986c', '#2f6f57', '#c28e2c', '#f4b942', '#79c6a3', '#3f87a6'];
    return Array.from({ length: 28 }, (_, index) => ({
      left: `${3 + ((index * 97) % 92)}%`,
      delay: `${(index % 8) * 0.08}s`,
      duration: `${2.2 + (index % 5) * 0.35}s`,
      color: palette[index % palette.length],
      size: `${7 + (index % 4) * 2}px`
    }));
  }

  private syncCompletionReward(): void {
    if (this.progressPercent < 100) {
      this.showRewardPanel = false;
      this.showCompletionCelebration = false;
      this.hasPlayedCompletionCelebration = false;
      return;
    }

    this.rewardState = this.guideService.claimCompletionReward(this.page, true);
    this.showRewardPanel = true;
    this.triggerCompletionCelebration();
  }

  private applyGuideDefinition(guide: GuideDefinition): void {
    this.guideTitle = guide.title;
    this.steps = guide.steps;
  }

  private getFormationCreateRoute(): string[] {
    return this.isAdminContext()
      ? ['/admin/formations/create']
      : ['/public/formations/create'];
  }

  private isAdminContext(): boolean {
    return this.router.url.startsWith('/admin');
  }

  private getCurrentFormationGuideStep(): FormationGuideStep | null {
    const activeStep = this.progressState?.activeStep;
    if (!activeStep) {
      return null;
    }

    const candidate = this.steps.find((step) => step.id === activeStep);
    if (!candidate) {
      return null;
    }

    const imageUrl = candidate.mediaType === 'IMAGE' ? this.normalizeImageUrl(candidate.mediaUrl || '') : '';
    const videoUrl = candidate.mediaType === 'VIDEO' ? this.normalizeVideoUrl(candidate.mediaUrl || '') : '';

    return {
      id: `guide-step-${candidate.id}`,
      formationId: this.formationId ?? undefined,
      order: candidate.id,
      title: candidate.title,
      description: candidate.description,
      imageUrl: imageUrl || undefined,
      videoUrl: videoUrl || undefined
    };
  }

  private getGuideYoutubeFallbackVideo(stepOrder: number, contextText: string): string {
    const seedSubject = this.toText(contextText) || this.formationTitleLabel;
    const hints = this.formationAiService.suggestMediaHints(seedSubject);
    const candidates = hints.videos
      .map((hint) => this.toYoutubeEmbedUrl(this.toText(hint.url)))
      .filter((url) => !!url);

    if (candidates.length > 0) {
      const safeOrder = Number.isFinite(stepOrder) ? Math.max(1, Math.floor(stepOrder)) : 1;
      return candidates[(safeOrder - 1) % candidates.length];
    }

    return this.toYoutubeEmbedUrl(this.formationAiService.getPrimaryVideoSuggestion(seedSubject))
      || 'https://www.youtube.com/embed/M7lc1UVf-VE';
  }

  private toYoutubeEmbedUrl(rawUrl: string): string {
    const normalized = this.normalizeVideoUrl(rawUrl);
    return /youtube\.com\/embed\//i.test(normalized) ? normalized : '';
  }

  private normalizeImageUrl(rawUrl: string): string {
    if (!rawUrl) {
      return '';
    }
    const cleaned = rawUrl.trim();
    if (!cleaned) {
      return '';
    }
    if (cleaned.startsWith('data:image/')) {
      return cleaned;
    }
    if (/^\/?assets\//i.test(cleaned)) {
      return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
    }
    if (/^https?:\/\//i.test(cleaned)) {
      return cleaned;
    }

    const resolved = this.formationMediaService.resolveMediaUrl(cleaned);
    return /^https?:\/\//i.test(resolved) ? resolved : '';
  }

  private normalizeVideoUrl(rawUrl: string): string {
    const cleaned = rawUrl.trim();
    if (!cleaned) {
      return '';
    }

    const parsedUrl = this.toParsedUrl(cleaned);
    const youtubeVideoId = this.extractYoutubeVideoId(cleaned, parsedUrl);
    if (youtubeVideoId) {
      return `https://www.youtube.com/embed/${youtubeVideoId}`;
    }

    const vimeoVideoId = this.extractVimeoVideoId(cleaned, parsedUrl);
    if (vimeoVideoId) {
      return `https://player.vimeo.com/video/${vimeoVideoId}`;
    }

    if (/^https?:\/\//i.test(cleaned)) {
      return cleaned;
    }

    const resolved = this.formationMediaService.resolveMediaUrl(cleaned);
    return /^https?:\/\//i.test(resolved) ? resolved : '';
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

  private prepareFormationMediaPools(mediaList: FormationMediaResponseDto[]): void {
    const sortedMedia = this.formationMediaService.sortByDisplayOrder(mediaList);
    this.formationMediaImages = sortedMedia
      .filter((media) => this.isImageMedia(media))
      .map((media) => this.normalizeImageUrl(this.formationMediaService.resolveMediaUrl(media.mediaUrl)))
      .filter((url) => !!url);

    this.formationMediaVideos = sortedMedia
      .filter((media) => this.isPlayableVideoMedia(media))
      .map((media) => this.normalizeVideoUrl(this.formationMediaService.resolveMediaUrl(media.mediaUrl)))
      .filter((url) => !!url);
  }

  private isImageMedia(media: FormationMediaResponseDto): boolean {
    return media.mediaType === 'IMAGE' || (media.mimeType || '').toLowerCase().startsWith('image/');
  }

  private isPlayableVideoMedia(media: FormationMediaResponseDto): boolean {
    const mimeType = (media.mimeType || '').toLowerCase();
    const isVideo = media.mediaType === 'VIDEO' || mimeType.startsWith('video/');
    if (!isVideo) {
      return false;
    }

    if (Number.isFinite(media.fileSize) && media.fileSize > 0 && media.fileSize < this.minimumPlayableVideoSizeBytes) {
      return false;
    }

    const resolvedUrl = this.normalizeVideoUrl(this.formationMediaService.resolveMediaUrl(media.mediaUrl));
    return !!resolvedUrl;
  }

  private isEmbeddableVideoUrl(url: string): boolean {
    return /youtube\.com\/embed\//i.test(url);
  }

  private syncRouteContext(forceInit = false): void {
    const pathFormationId = this.parseFormationId(this.route.snapshot.paramMap.get('id'));
    const queryFormationId = this.parseFormationId(this.route.snapshot.queryParamMap.get('formationId'));
    const nextFormationId = pathFormationId ?? queryFormationId;

    let nextPage = this.page;
    if (nextFormationId) {
      nextPage = 'formation-detail';
    } else {
      const routePage = this.route.snapshot.queryParamMap.get('page');
      if (this.guideService.isGuidePageKey(routePage)) {
        nextPage = routePage;
      }
    }

    const nextContextKey = `${nextPage}|${nextFormationId ?? 0}`;
    const hasChanged = nextContextKey !== this.routeContextKey;

    this.page = nextPage;
    this.formationId = nextFormationId;
    if (!this.formationId) {
      this.formationTitle = '';
      this.formationMediaItems = [];
    }

    if (forceInit || hasChanged) {
      this.routeContextKey = nextContextKey;
      this.initGuide();
    }
  }

  private parseFormationId(rawValue: string | null): number | null {
    const parsedValue = Number(rawValue);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
  }

  private resolveFormationTitle(
    titre: string | undefined,
    title: string | undefined,
    nom: string | undefined,
    formationId: number
  ): string {
    const candidate = (titre || title || nom || '').replace(/\s+/g, ' ').trim();
    return candidate || `Formation #${formationId}`;
  }

  private toText(value: unknown): string {
    return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  }

  private canManageRole(): boolean {
    return this.authService.canManageFormations();
  }
}
