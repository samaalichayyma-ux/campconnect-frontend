import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  AnalyzeFormationRequestDto,
  AnalyzeFormationResponseDto,
  FormationGenerateRequestDto,
  FormationGenerateResponseDto,
  FormationMediaHintsDto,
  FormationMediaSuggestionItemDto,
  FormationQuizItemDto,
  FormationSectionDto
} from '../models/ai-response.model';
import { FormationLevel, FormationStatus, FormationSummaryDto, FormationUpsertPayload } from '../models/formation.model';
import { FormationAiService } from '../services/formation-ai.service';
import { FormationService } from '../services/formation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FormationMediaGalleryComponent } from '../formation-media-gallery/formation-media-gallery.component';
import { FormationMediaResponseDto } from '../models/formation-media.model';
import { FormationMediaService } from '../services/formation-media.service';
import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { FormationGuideStep, GuidePageKey, GuideRewardTemplate } from '../../guide-interactif/models/guide-interactif.model';
import { GuideInteractifService } from '../../guide-interactif/services/guide-interactif.service';

interface PublicationReadinessItem {
  key: string;
  label: string;
  required: boolean;
  done: boolean;
  hint: string;
}

@Component({
  selector: 'app-formation-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AdminIconComponent,
    FormationMediaGalleryComponent
  ],
  templateUrl: './formation-form.component.html',
  styleUrl: './formation-form.component.css'
})
export class FormationFormComponent implements OnInit {
  readonly levelOptions: Array<{ value: FormationLevel; label: string }> = [
    { value: 'BEGINNER', label: 'Debutant' },
    { value: 'INTERMEDIATE', label: 'Intermediaire' },
    { value: 'ADVANCED', label: 'Avance' }
  ];
  readonly durationOptions = [15, 30, 45];

  formationId: number | null = null;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  canManage = false;
  connectedRole = 'CLIENT';

  titre = '';
  description = '';
  mainImageUrl = '';
  mainVideoUrl = '';
  objectifsInput = '';
  content = '';
  summary = '';
  level: FormationLevel = 'BEGINNER';
  estimatedDuration = '15 minutes';
  status: FormationStatus = 'DRAFT';
  generatedSections: FormationSectionDto[] = [];
  quiz: FormationQuizItemDto[] = [];
  analysisResult: AnalyzeFormationResponseDto | null = null;
  isQuickAiLoading = false;
  isAiGeneratedDraft = false;
  formationMediaOptions: FormationMediaResponseDto[] = [];
  isFormationMediaOptionsLoading = false;
  selectedMediaBindingByStep: Record<number, string> = {};
  guideSteps: FormationGuideStep[] = [];
  isGuideLoading = false;
  isGuideSaving = false;
  isGuideAiGenerating = false;
  guideMessage = '';
  guideErrorMessage = '';
  private isMainVideoManuallyEdited = false;
  private lastAutoSuggestedMainVideo = '';
  private guideStepCounter = 1;
  showAdvancedFields = false;
  showPedagogicEditors = false;
  isAiAssistantGenerating = false;

  pageMessage = '';
  saveMessage = '';
  deleteMessage = '';
  aiContentWarning = '';
  mediaHints: FormationMediaHintsDto = { images: [], videos: [] };

  guidePage: GuidePageKey = 'formation-create';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private formationService: FormationService,
    private formationAiService: FormationAiService,
    private formationMediaService: FormationMediaService,
    private guideService: GuideInteractifService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.canManage = this.canManageFormationRole();
    this.connectedRole = this.authService.getRole() || 'CLIENT';
    if (!this.canManage) {
      this.pageMessage = '403: Acces reserve a l administrateur ou au guide.';
      this.router.navigate(['/public/formations']);
      return;
    }

    const routeId = this.route.snapshot.paramMap.get('id');
    const parsedId = Number(routeId);
    this.formationId = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;
    this.isEditMode = !!this.formationId;
    this.guidePage = this.isEditMode ? 'formation-edit' : 'formation-create';
    this.guideService.startPage(this.guidePage, true);
    this.refreshMediaHints();
    if (this.route.snapshot.queryParamMap.get('created') === '1') {
      this.saveMessage = 'Formation enregistree. Vous pouvez maintenant creer le guide interactif.';
    }

    if (!this.isEditMode) {
      this.applyGuideTemplateIfAvailable();
      this.triggerGuideAiIfRequested();
    }

    if (this.formationId) {
      this.loadFormation(this.formationId);
      this.loadFormationMediaOptions(this.formationId);
      this.loadGuideSteps(this.formationId);
    }
  }

  get draftForAnalysis(): AnalyzeFormationRequestDto {
    const previewSteps = this.stepPreviewItems;
    return {
      title: this.titre.trim(),
      description: this.description.trim(),
      content: previewSteps.map((step) => `${step.title}: ${step.content}`).join('\n'),
      objectives: this.parseObjectifs(),
      summary: this.summary.trim(),
      quiz: [...this.quiz]
    };
  }

  get parsedObjectivesPreview(): string[] {
    return this.parseObjectifs();
  }

  get stepPreviewItems(): FormationSectionDto[] {
    if (Array.isArray(this.generatedSections) && this.generatedSections.length > 0) {
      return this.generatedSections;
    }

    if (this.content.trim()) {
      this.generatedSections = this.parseStepsFromContent(this.content, []);
      return this.generatedSections;
    }

    return [];
  }

  get canConfigureGuideInteractif(): boolean {
    return Number.isFinite(this.formationId) && (this.formationId ?? 0) > 0;
  }

  get hasMainImage(): boolean {
    return !!this.getResolvedMainImageUrl();
  }

  get mainImagePreviewUrl(): string {
    return this.getResolvedMainImageUrl() || '/assets/images/default-image.jpg';
  }

  get hasMainVideo(): boolean {
    return !!this.getResolvedMainVideoUrl();
  }

  get mainVideoEmbedUrl(): SafeResourceUrl | null {
    const normalizedVideoUrl = this.getResolvedMainVideoUrl();
    if (!normalizedVideoUrl || !this.isEmbeddableVideoUrl(normalizedVideoUrl)) {
      return null;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(normalizedVideoUrl);
  }

  get mainVideoSourceUrl(): string {
    const normalizedVideoUrl = this.getResolvedMainVideoUrl();
    if (!normalizedVideoUrl) {
      return '';
    }

    return this.isEmbeddableVideoUrl(normalizedVideoUrl) ? '' : normalizedVideoUrl;
  }

  get hasPedagogicContentPreview(): boolean {
    return this.parseObjectifs().length > 0
      || this.stepPreviewItems.length > 0
      || this.summary.trim().length > 0;
  }

  get effectiveDurationMinutes(): number | null {
    const parsed = this.parseDurationMinutes(this.estimatedDuration);
    if (parsed === null) {
      return null;
    }

    return this.toClosestDurationSlot(parsed);
  }

  get suggestedDurationLabel(): string {
    return this.formationAiService.suggestRealisticDuration({
      level: this.level,
      description: this.description.trim(),
      objectives: this.parseObjectifs(),
      sections: this.stepPreviewItems.map((step) => ({
        title: this.safeText(step.title),
        content: this.safeText(step.content)
      })),
      summary: this.summary.trim(),
      quiz: [...this.quiz],
      currentDuration: this.estimatedDuration.trim()
    });
  }

  get qualityPreview(): AnalyzeFormationResponseDto {
    return this.formationAiService.runLocalQualityAnalysis(this.draftForAnalysis);
  }

  get qualityLabel(): string {
    const score = this.qualityPreview.score;
    if (score >= 85) {
      return 'Excellent';
    }
    if (score >= 70) {
      return 'Bon';
    }
    if (score >= 55) {
      return 'Moyen';
    }
    return 'A renforcer';
  }

  get publicationChecklist(): PublicationReadinessItem[] {
    const objectivesCount = this.parseObjectifs().length;
    const sectionsCount = this.stepPreviewItems.length;
    const summaryLength = this.summary.trim().length;
    const quizCount = this.quiz.length;
    const durationMinutes = this.parseDurationMinutes(this.estimatedDuration);
    const hasValidDuration = durationMinutes !== null && [15, 30, 45].includes(durationMinutes);
    const hasGuide = this.hasCompleteGuideSteps(this.guideSteps);
    const hasMainImage = this.hasMainImage
      || this.formationMediaOptions.some((media) => media.mediaType === 'IMAGE' || media.mimeType.startsWith('image/'));

    return [
      {
        key: 'title',
        label: 'Titre',
        required: true,
        done: this.titre.trim().length >= 5,
        hint: 'Titre explicite et concret.'
      },
      {
        key: 'description',
        label: 'Description',
        required: true,
        done: this.description.trim().length >= 30,
        hint: 'Description courte, claire et orientee terrain.'
      },
      {
        key: 'level',
        label: 'Niveau',
        required: true,
        done: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(this.level),
        hint: 'Debutant, intermediaire ou avance.'
      },
      {
        key: 'duration',
        label: 'Duree',
        required: true,
        done: hasValidDuration,
        hint: 'La duree doit etre 15, 30 ou 45 minutes.'
      },
      {
        key: 'main-image',
        label: 'Image principale',
        required: true,
        done: hasMainImage,
        hint: 'Ajoutez une image principale unique.'
      },
      {
        key: 'sections',
        label: 'Sections theoriques',
        required: true,
        done: sectionsCount >= 3,
        hint: 'Ajoutez au moins 3 sections claires.'
      },
      {
        key: 'objectives',
        label: 'Objectifs pedagogiques',
        required: true,
        done: objectivesCount >= 3,
        hint: 'Ajoutez au moins 3 objectifs concrets.'
      },
      {
        key: 'summary',
        label: 'Resume',
        required: true,
        done: summaryLength >= 30,
        hint: 'Resume court mais utile (minimum 30 caracteres).'
      },
      {
        key: 'guide',
        label: 'Guide interactif',
        required: true,
        done: hasGuide,
        hint: 'Ajoutez un guide complet avec plusieurs etapes.'
      },
      {
        key: 'quiz',
        label: 'Quiz (optionnel)',
        required: false,
        done: quizCount >= 3,
        hint: 'Recommande: 3 questions ou plus.'
      }
    ];
  }

  get publicationReadinessPercent(): number {
    const checks = this.publicationChecklist;
    if (checks.length === 0) {
      return 0;
    }

    const doneCount = checks.filter((item) => item.done).length;
    return Math.round((doneCount / checks.length) * 100);
  }

  get publicationRequiredMissingLabels(): string[] {
    return this.publicationChecklist
      .filter((item) => item.required && !item.done)
      .map((item) => item.label);
  }

  get canPublishByChecklist(): boolean {
    return this.publicationRequiredMissingLabels.length === 0;
  }

  applySuggestedDuration(): void {
    this.estimatedDuration = this.suggestedDurationLabel;
    this.onContentChange();
  }

  generatePedagogicDraftWithAi(): void {
    if (this.isAiAssistantGenerating) {
      return;
    }

    const subject = this.titre.trim() || this.description.trim();
    if (!subject) {
      this.pageMessage = 'Ajoutez un titre ou une description avant de lancer l IA.';
      return;
    }

    const payload: FormationGenerateRequestDto = {
      subject,
      level: this.level,
      targetUser: this.connectedRole
    };

    this.isAiAssistantGenerating = true;
    this.pageMessage = '';
    this.saveMessage = '';

    this.formationAiService.generateFormationWithFallback(payload).subscribe({
      next: (generated) => {
        this.isAiAssistantGenerating = false;
        this.applyAiGeneration(generated);
        this.showPedagogicEditors = true;
        this.saveMessage = 'Contenu pedagogique propose par IA. Verifiez avant publication.';
        this.guideService.markAction(this.guidePage, 'ai-generated');
      },
      error: () => {
        this.isAiAssistantGenerating = false;
        this.pageMessage = 'Impossible de generer le contenu IA pour le moment.';
      }
    });
  }

  runQualityCheckWithAi(): void {
    this.analysisResult = this.formationAiService.runLocalQualityAnalysis(this.draftForAnalysis);
    this.saveMessage = 'Analyse qualite mise a jour.';
  }

  togglePedagogicEditors(): void {
    this.showPedagogicEditors = !this.showPedagogicEditors;
  }

  toggleAdvancedFields(): void {
    this.showAdvancedFields = !this.showAdvancedFields;
  }

  applySuggestedMedia(suggestion: FormationMediaSuggestionItemDto): void {
    const stepIndex = this.resolveSuggestedMediaTargetStepIndex();
    if (stepIndex === null) {
      this.pageMessage = 'Ajoutez d abord une section de formation pour appliquer une suggestion media IA.';
      return;
    }

    const targetStep = this.generatedSections[stepIndex];
    if (!targetStep) {
      return;
    }

    targetStep.mediaType = suggestion.mediaType;
    targetStep.mediaUrl = suggestion.mediaType === 'VIDEO'
      ? this.normalizeVideoUrl(suggestion.url)
      : this.normalizeImageUrl(suggestion.url);

    if (!targetStep.mediaUrl) {
      this.pageMessage = suggestion.mediaType === 'VIDEO'
        ? 'Lien YouTube suggestion invalide.'
        : 'URL image suggestion invalide.';
      return;
    }

    this.pageMessage = '';
    this.saveMessage = `Suggestion IA appliquee sur la section ${stepIndex + 1}.`;
    this.isAiGeneratedDraft = true;
  }

  onSuggestionImageError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (!target) {
      return;
    }

    const fallbackUrl = '/assets/images/default-image.jpg';
    if (target.src.endsWith(fallbackUrl)) {
      return;
    }

    target.src = fallbackUrl;
  }

  onTitleChange(): void {
    this.saveMessage = '';
    this.pageMessage = '';
    this.refreshAiContentWarningFromDraft();
    this.refreshMediaHints();
    this.syncAutoMainVideoFromTopic();
    this.guideService.markAction(this.guidePage, this.isEditMode ? 'fields-updated' : 'title-entered');
  }

  onDescriptionChange(): void {
    this.saveMessage = '';
    this.pageMessage = '';
    this.refreshAiContentWarningFromDraft();
    this.refreshMediaHints();
    this.syncAutoMainVideoFromTopic();
    this.guideService.markAction(this.guidePage, this.isEditMode ? 'fields-updated' : 'description-entered');
  }

  onMainImageUrlChange(): void {
    this.mainImageUrl = this.normalizeImageUrl(this.mainImageUrl);
    this.saveMessage = '';
    this.pageMessage = '';
  }

  onMainVideoUrlChange(): void {
    this.mainVideoUrl = this.normalizeVideoUrl(this.mainVideoUrl);
    if (!this.mainVideoUrl) {
      this.isMainVideoManuallyEdited = false;
      this.lastAutoSuggestedMainVideo = '';
    } else {
      this.isMainVideoManuallyEdited = this.mainVideoUrl !== this.lastAutoSuggestedMainVideo;
    }
    this.saveMessage = '';
    this.pageMessage = '';
  }

  onContentChange(): void {
    this.saveMessage = '';
    this.generatedSections = this.parseStepsFromContent(this.content, this.generatedSections);
    this.refreshAiContentWarningFromDraft();
    this.guideService.markAction(this.guidePage, this.isEditMode ? 'fields-updated' : 'description-entered');
  }

  applyAiGeneration(generated: FormationGenerateResponseDto): void {
    this.isAiGeneratedDraft = true;
    const currentTitle = this.normalizeDisplayTitle(this.titre.trim());
    const generatedTitle = this.normalizeDisplayTitle(generated.title || '');
    this.titre = currentTitle || generatedTitle;
    this.description = generated.description || this.description;
    this.summary = generated.summary || this.summary;
    this.level = this.normalizeLevel(generated.level);
    this.estimatedDuration = generated.estimatedDuration || this.estimatedDuration;
    this.generatedSections = this.normalizeSteps(Array.isArray(generated.sections) ? generated.sections : []);
    this.quiz = Array.isArray(generated.quiz) ? generated.quiz : this.quiz;
    this.objectifsInput = Array.isArray(generated.objectives) ? generated.objectives.join('\n') : this.objectifsInput;

    if (this.generatedSections.length > 0) {
      this.content = this.generatedSections
        .map((section) => `${section.title} - ${section.content}`)
        .join('\n');
    }
    this.showPedagogicEditors = true;

    this.refreshAiContentWarningFromDraft();
    this.refreshMediaHints();
    if (!this.getResolvedMainImageUrl() && this.mediaHints.images.length > 0) {
      this.mainImageUrl = this.normalizeImageUrl(this.mediaHints.images[0].url);
    }
    this.syncAutoMainVideoFromTopic(true);
  }

  applyAiAnalysis(result: AnalyzeFormationResponseDto): void {
    this.analysisResult = result;
  }

  applyQuiz(quiz: FormationQuizItemDto[]): void {
    this.quiz = quiz;
  }

  onAiAction(actionKey: string): void {
    this.guideService.markAction(this.guidePage, actionKey);
  }

  onStepMediaTypeChange(stepIndex: number, mediaType: 'IMAGE' | 'VIDEO'): void {
    const step = this.generatedSections[stepIndex];
    if (!step) {
      return;
    }

    step.mediaType = mediaType;
    if (mediaType === 'VIDEO') {
      step.mediaUrl = this.normalizeVideoUrl(step.mediaUrl || '');
    }
    this.saveMessage = '';
    this.isAiGeneratedDraft = true;
  }

  onStepMediaUrlChange(stepIndex: number, rawUrl: string): void {
    const step = this.generatedSections[stepIndex];
    if (!step) {
      return;
    }

    if ((step.mediaType || 'IMAGE') === 'VIDEO') {
      step.mediaUrl = this.normalizeVideoUrl(rawUrl);
    } else {
      step.mediaUrl = this.normalizeImageUrl(rawUrl);
    }

    this.saveMessage = '';
    this.isAiGeneratedDraft = true;
  }

  onStepImageSelected(stepIndex: number, event: Event): void {
    const step = this.generatedSections[stepIndex];
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!step || !file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.pageMessage = 'Le fichier selectionne doit etre une image.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        return;
      }
      step.mediaType = 'IMAGE';
      step.mediaUrl = result;
      this.pageMessage = '';
      this.saveMessage = '';
      this.isAiGeneratedDraft = true;
    };
    reader.readAsDataURL(file);

    if (input) {
      input.value = '';
    }
  }

  getStepVideoEmbedUrl(step: FormationSectionDto): SafeResourceUrl | null {
    if ((step.mediaType || '').toUpperCase() !== 'VIDEO') {
      return null;
    }

    const normalizedVideoUrl = this.normalizeVideoUrl(step.mediaUrl || '');
    if (!normalizedVideoUrl) {
      return null;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(normalizedVideoUrl);
  }

  getStepImageUrl(step: FormationSectionDto): string {
    return this.normalizeImageUrl(step.mediaUrl || '');
  }

  onMediaAction(action: 'media-added' | 'media-deleted'): void {
    if (action === 'media-added') {
      this.guideService.markAction(this.guidePage, 'media-added');
    }

    if (this.formationId) {
      this.loadFormationMediaOptions(this.formationId);
    }
  }

  getLinkedMediaChoices(step: FormationSectionDto): FormationMediaResponseDto[] {
    const targetType = (step.mediaType || 'IMAGE').toUpperCase() === 'VIDEO' ? 'VIDEO' : 'IMAGE';
    return this.formationMediaOptions.filter((media) => media.mediaType === targetType);
  }

  getLinkedMediaPreviewUrl(media: FormationMediaResponseDto): string {
    return this.formationMediaService.resolveMediaUrl(media.mediaUrl);
  }

  buildLinkedMediaLabel(media: FormationMediaResponseDto): string {
    const fileName = this.safeText(media.fileName) || `media-${media.id}`;
    const mediaKind = media.mediaType === 'VIDEO' ? 'Video' : 'Image';
    return `${mediaKind}: ${fileName}`;
  }

  bindUploadedMediaToStep(stepIndex: number, mediaIdRaw: string): void {
    const mediaId = Number.parseInt(mediaIdRaw, 10);
    if (!Number.isFinite(mediaId) || mediaId <= 0) {
      this.selectedMediaBindingByStep[stepIndex] = '';
      return;
    }

    const selectedMedia = this.formationMediaOptions.find((media) => media.id === mediaId);
    if (!selectedMedia) {
      return;
    }

    const step = this.generatedSections[stepIndex];
    if (!step) {
      return;
    }

    step.mediaType = selectedMedia.mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE';
    const resolvedMediaUrl = this.formationMediaService.resolveMediaUrl(selectedMedia.mediaUrl);
    step.mediaUrl = step.mediaType === 'VIDEO'
      ? this.normalizeVideoUrl(resolvedMediaUrl)
      : this.normalizeImageUrl(resolvedMediaUrl);

    this.selectedMediaBindingByStep[stepIndex] = String(selectedMedia.id);
    this.saveMessage = '';
    this.pageMessage = '';
    this.isAiGeneratedDraft = true;
  }

  applyMainImageFromMedia(mediaIdRaw: string): void {
    const mediaId = Number.parseInt(mediaIdRaw, 10);
    if (!Number.isFinite(mediaId) || mediaId <= 0) {
      return;
    }

    const selectedMedia = this.formationMediaOptions.find((media) =>
      media.id === mediaId && (media.mediaType === 'IMAGE' || media.mimeType.startsWith('image/'))
    );
    if (!selectedMedia) {
      return;
    }

    this.mainImageUrl = this.normalizeImageUrl(this.formationMediaService.resolveMediaUrl(selectedMedia.mediaUrl));
    this.pageMessage = '';
    this.saveMessage = '';
  }

  applyMainVideoFromMedia(mediaIdRaw: string): void {
    const mediaId = Number.parseInt(mediaIdRaw, 10);
    if (!Number.isFinite(mediaId) || mediaId <= 0) {
      return;
    }

    const selectedMedia = this.formationMediaOptions.find((media) =>
      media.id === mediaId && (media.mediaType === 'VIDEO' || (media.mimeType || '').startsWith('video/'))
    );
    if (!selectedMedia) {
      return;
    }

    this.mainVideoUrl = this.normalizeVideoUrl(this.formationMediaService.resolveMediaUrl(selectedMedia.mediaUrl));
    this.isMainVideoManuallyEdited = !!this.mainVideoUrl;
    this.lastAutoSuggestedMainVideo = '';
    this.pageMessage = '';
    this.saveMessage = '';
  }

  trackByGuideStepId(_index: number, step: FormationGuideStep): string {
    return step.id;
  }

  addGuideStep(): void {
    if (!this.canConfigureGuideInteractif) {
      this.guideErrorMessage = 'Enregistrez d abord la formation pour ajouter des etapes de guide.';
      return;
    }

    const nextOrder = this.guideSteps.length + 1;
    this.guideSteps = [
      ...this.guideSteps,
      this.buildDefaultGuideStep(nextOrder)
    ];
    this.guideMessage = '';
    this.guideErrorMessage = '';
  }

  removeGuideStep(stepId: string): void {
    this.guideSteps = this.guideSteps
      .filter((step) => step.id !== stepId)
      .map((step, index) => ({
        ...step,
        order: index + 1
      }));
    this.guideMessage = '';
    this.guideErrorMessage = '';
  }

  onGuideStepOrderChange(stepId: string, rawValue: string | number): void {
    const parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue)) {
      return;
    }

    const clampedOrder = Math.max(1, Math.min(this.guideSteps.length, Math.round(parsedValue)));
    this.guideSteps = this.guideSteps
      .map((step) => step.id === stepId ? { ...step, order: clampedOrder } : { ...step })
      .sort((first, second) => first.order - second.order)
      .map((step, index) => ({
        ...step,
        order: index + 1
      }));
    this.guideMessage = '';
    this.guideErrorMessage = '';
  }

  onGuideStepImageSelected(stepId: string, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.guideErrorMessage = 'Le fichier du guide doit etre une image.';
      if (input) {
        input.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = typeof reader.result === 'string' ? reader.result : '';
      if (!imageData) {
        return;
      }

      this.guideSteps = this.guideSteps.map((step) => step.id === stepId
        ? { ...step, imageUrl: imageData }
        : step);
      this.guideMessage = '';
      this.guideErrorMessage = '';
    };
    reader.readAsDataURL(file);

    if (input) {
      input.value = '';
    }
  }

  getGuideStepImageUrl(step: FormationGuideStep): string {
    return this.normalizeImageUrl(step.imageUrl || '');
  }

  getGuideStepVideoEmbedUrl(step: FormationGuideStep): SafeResourceUrl | null {
    const normalizedVideoUrl = this.normalizeVideoUrl(step.videoUrl || '');
    if (!normalizedVideoUrl) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(normalizedVideoUrl);
  }

  saveGuideInteractif(): void {
    if (!this.canManage) {
      this.guideErrorMessage = 'Acces reserve a l administrateur ou au guide.';
      this.guideMessage = '';
      return;
    }

    if (!this.formationId || this.isGuideSaving) {
      return;
    }

    const cleanedGuideSteps = this.guideSteps
      .map((step, index) => ({
        ...step,
        formationId: this.formationId ?? undefined,
        order: index + 1,
        title: this.safeText(step.title) || `Etape ${index + 1}`,
        description: this.safeText(step.description),
        imageUrl: this.normalizeImageUrl(step.imageUrl || '') || undefined,
        videoUrl: this.normalizeVideoUrl(step.videoUrl || '') || undefined
      }))
      .filter((step) => this.isMeaningfulGuideStep(step));

    if (cleanedGuideSteps.length === 0) {
      this.guideErrorMessage = 'Ajoutez au moins une etape avant d enregistrer le guide.';
      this.guideMessage = '';
      return;
    }

    this.isGuideSaving = true;
    this.guideMessage = '';
    this.guideErrorMessage = '';

    this.guideService.saveFormationGuideSteps(this.formationId, cleanedGuideSteps).subscribe({
      next: (savedSteps) => {
        this.isGuideSaving = false;
        this.guideSteps = this.normalizeGuideStepsForUi(savedSteps);
        this.guideMessage = 'Guide interactif enregistre pour cette formation.';
        this.guideErrorMessage = '';
        this.guideService.markAction(this.guidePage, 'saved');
      },
      error: () => {
        this.isGuideSaving = false;
        this.guideMessage = '';
        this.guideErrorMessage = 'Impossible d enregistrer le guide interactif.';
      }
    });
  }

  generateGuideInteractifWithAi(): void {
    if (!this.canManage) {
      this.guideErrorMessage = 'Acces reserve a l administrateur ou au guide.';
      this.guideMessage = '';
      return;
    }

    if (!this.formationId) {
      this.guideErrorMessage = 'Enregistrez d abord la formation pour generer le guide interactif.';
      this.guideMessage = '';
      return;
    }

    if (this.isGuideAiGenerating) {
      return;
    }

    this.isGuideAiGenerating = true;
    this.guideErrorMessage = '';
    this.guideMessage = '';

    const generatedSteps = this.formationAiService.generateGuideStepsFromFormation({
      formationId: this.formationId,
      title: this.titre.trim(),
      description: this.description.trim(),
      objectives: this.parseObjectifs(),
      sections: this.stepPreviewItems,
      mainImageUrl: this.getResolvedMainImageUrl()
    });

    this.guideSteps = this.normalizeGuideStepsForUi(generatedSteps);
    this.isGuideAiGenerating = false;
    this.guideMessage = 'Brouillon de guide genere. Verifiez chaque etape.';
    this.guideService.markAction(this.guidePage, 'ai-generated');
    this.saveGuideInteractif();
  }

  openGuideInteractif(): void {
    if (!this.canManage) {
      this.pageMessage = 'Acces reserve a l administrateur ou au guide.';
      return;
    }

    if (!this.formationId) {
      this.pageMessage = 'Enregistrez d abord la formation pour activer le guide interactif associe.';
      return;
    }

    const baseRoute = this.getManagementBaseRoute();
    this.router.navigate([...baseRoute, this.formationId, 'guide']);
  }

  save(statusOverride?: FormationStatus): void {
    if (!this.canManage) {
      this.pageMessage = 'Acces reserve a l administrateur ou au guide.';
      return;
    }

    const title = this.titre.trim();
    const description = this.description.trim();

    if (!title || !description) {
      this.saveMessage = 'Le titre et la description sont obligatoires.';
      return;
    }

    this.isSaving = true;
    this.saveMessage = '';
    this.pageMessage = '';

    const payload = this.buildPayload(statusOverride);

    if (this.formationId) {
      this.formationService.updateFormation(this.formationId, payload).subscribe({
        next: () => {
          this.isSaving = false;
          const listRoute = this.getManagementBaseRoute();
          this.saveMessage = statusOverride === 'PUBLISHED'
            ? 'Formation publiee avec succes.'
            : 'Formation mise a jour avec succes.';
          this.guideService.markAction(this.guidePage, statusOverride === 'PUBLISHED' ? 'published' : 'saved');

          if (statusOverride === 'PUBLISHED') {
            this.router.navigate(listRoute);
            return;
          }

          this.loadFormation(this.formationId as number, false);
        },
        error: (error: HttpErrorResponse) => {
          this.isSaving = false;
          this.pageMessage = this.getErrorMessage(error.status, error.error);
        }
      });
      return;
    }

    this.formationService.createFormation(payload).subscribe({
      next: (response) => {
        this.isSaving = false;
        const listRoute = this.getManagementBaseRoute();

        if (statusOverride === 'PUBLISHED') {
          this.guideService.markAction(this.guidePage, 'published');
          this.saveMessage = 'Formation publiee avec succes.';
          this.router.navigate(listRoute);
          return;
        }

        const createdId = this.extractFormationId(response);
        if (createdId) {
          this.guideService.markAction(this.guidePage, 'saved');
          this.router.navigate([...listRoute, createdId, 'edit'], { queryParams: { created: 1 } });
          return;
        }
        this.saveMessage = 'Formation creee avec succes.';
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving = false;
        this.pageMessage = this.getErrorMessage(error.status, error.error);
      }
    });
  }

  publish(): void {
    if (!this.canManage) {
      this.pageMessage = 'Acces reserve a l administrateur ou au guide.';
      return;
    }

    if (!this.formationId) {
      this.pageMessage = 'Enregistrez d abord la formation, puis ajoutez le guide interactif avant publication.';
      return;
    }

    if (!this.canPublishByChecklist) {
      const missing = this.publicationRequiredMissingLabels.join(', ');
      this.pageMessage = `Formation incomplete. Completez d abord: ${missing}.`;
      return;
    }

    if (!this.hasCompleteGuideSteps(this.guideSteps)) {
      this.pageMessage = 'Formation incomplete. Le guide interactif doit contenir des etapes completes.';
      return;
    }

    this.save('PUBLISHED');
  }

  deleteFormation(): void {
    if (!this.canManage) {
      this.pageMessage = 'Acces reserve a l administrateur ou au guide.';
      return;
    }

    if (!this.formationId || this.isDeleting) {
      return;
    }

    const confirmed = globalThis.confirm(`Voulez-vous vraiment supprimer la formation "${this.titre.trim() || `#${this.formationId}`}" ?`);
    if (!confirmed) {
      return;
    }

    this.isDeleting = true;
    this.deleteMessage = '';
    this.pageMessage = '';

    this.formationService.deleteFormation(this.formationId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.deleteMessage = 'Formation supprimee avec succes.';
        this.router.navigate(this.getManagementBaseRoute());
      },
      error: (error: HttpErrorResponse) => {
        this.isDeleting = false;
        this.pageMessage = this.getErrorMessage(error.status, error.error);
      }
    });
  }

  goToDetail(): void {
    if (!this.formationId) {
      return;
    }
    const baseRoute = this.getManagementBaseRoute();
    this.router.navigate([...baseRoute, this.formationId]);
  }

  private loadGuideSteps(formationId: number): void {
    if (!Number.isFinite(formationId) || formationId <= 0) {
      this.guideSteps = [];
      return;
    }

    this.isGuideLoading = true;
    this.guideErrorMessage = '';
    this.guideMessage = '';

    this.guideService.listFormationGuideSteps(formationId).subscribe({
      next: (steps) => {
        this.isGuideLoading = false;
        this.guideSteps = this.normalizeGuideStepsForUi(steps);
      },
      error: () => {
        this.isGuideLoading = false;
        this.guideSteps = [];
        this.guideErrorMessage = 'Impossible de charger le guide interactif.';
      }
    });
  }

  private loadFormationMediaOptions(formationId: number): void {
    if (!Number.isFinite(formationId) || formationId <= 0) {
      this.formationMediaOptions = [];
      return;
    }

    this.isFormationMediaOptionsLoading = true;
    this.formationMediaService.getFormationMedia(formationId).subscribe({
      next: (mediaList) => {
        this.formationMediaOptions = this.formationMediaService.sortByDisplayOrder(mediaList);
        if (!this.getResolvedMainImageUrl()) {
          const firstImage = this.formationMediaOptions.find((media) =>
            media.mediaType === 'IMAGE' || media.mimeType.startsWith('image/')
          );
          if (firstImage) {
            this.mainImageUrl = this.normalizeImageUrl(this.formationMediaService.resolveMediaUrl(firstImage.mediaUrl));
          }
        }
        this.isFormationMediaOptionsLoading = false;
      },
      error: () => {
        this.formationMediaOptions = [];
        this.isFormationMediaOptionsLoading = false;
      }
    });
  }

  private loadFormation(formationId: number, showPageLoader = true): void {
    if (showPageLoader) {
      this.isLoading = true;
    }
    this.pageMessage = '';

    this.formationService.getFormationById(formationId).subscribe({
      next: (formation) => {
        if (showPageLoader) {
          this.isLoading = false;
        }
        this.patchFromFormation(formation);
      },
      error: (error: HttpErrorResponse) => {
        if (showPageLoader) {
          this.isLoading = false;
        }
        this.pageMessage = this.getErrorMessage(error.status, error.error);
      }
    });
  }

  private patchFromFormation(formation: FormationSummaryDto): void {
    this.titre = this.normalizeDisplayTitle(
      this.safeText(formation.titre) || this.safeText(formation.title) || this.safeText(formation.nom)
    );
    this.description = this.safeText(formation.description);
    this.mainImageUrl = this.normalizeImageUrl(
      this.safeText(formation.coverImageUrl)
      || this.safeText(formation.imagePrincipale)
      || this.safeText(formation.imageUrl)
      || this.safeText(formation.photoUrl)
    );
    this.mainVideoUrl = this.normalizeVideoUrl(
      this.safeText(formation.coverVideoUrl)
      || this.safeText(formation.videoPrincipale)
      || this.safeText(formation.videoUrl)
      || this.readLooseFormationField(formation, 'mainVideoUrl')
      || this.readLooseFormationField(formation, 'video')
    );
    this.isMainVideoManuallyEdited = !!this.mainVideoUrl;
    this.lastAutoSuggestedMainVideo = '';
    const rawStoredContent = this.safeText(formation.content) || this.safeText(formation.contenu);
    this.summary = this.safeText(formation.summary) || this.safeText(formation.resume);

    const objectives = Array.isArray(formation.objectives)
      ? formation.objectives
      : Array.isArray(formation.objectifs)
        ? formation.objectifs
        : [];
    this.objectifsInput = objectives.join('\n');

    const fromSections = Array.isArray(formation.sections) ? formation.sections : [];
    this.generatedSections = fromSections.length > 0
      ? this.normalizeSteps(fromSections)
      : this.parseStepsFromContent(rawStoredContent, []);
    this.content = this.generatedSections.length > 0
      ? this.generatedSections.map((step) => `${step.title} - ${step.content}`).join('\n')
      : this.stripInlineMediaTokens(rawStoredContent);
    this.quiz = Array.isArray(formation.quiz) ? formation.quiz : [];
    this.level = this.normalizeLevel(formation.level);
    this.status = this.normalizeStatus(formation.status || formation.statut);
    this.estimatedDuration = this.safeText(formation.estimatedDuration)
      || this.normalizeDurationText(formation.duration);
    this.isAiGeneratedDraft = Boolean(formation.generatedByAi || formation.aiGenerated);
    this.showPedagogicEditors = this.objectifsInput.trim().length > 0
      || this.content.trim().length > 0
      || this.summary.trim().length > 0;
    this.refreshAiContentWarningFromDraft();
    this.refreshMediaHints();
  }

  private buildPayload(statusOverride?: FormationStatus): FormationUpsertPayload & Record<string, unknown> {
    const status = statusOverride ?? this.status;
    const objectives = this.parseObjectifs();
    const normalizedTitle = this.normalizeDisplayTitle(this.titre.trim());
    const parsedDuration = this.parseDurationMinutes(this.estimatedDuration);
    const normalizedDuration = parsedDuration === null ? null : this.toClosestDurationSlot(parsedDuration);
    const normalizedDurationLabel = normalizedDuration === null ? '' : `${normalizedDuration} minutes`;
    const stepSections = this.stepPreviewItems;
    const mainImage = this.getResolvedMainImageUrl();
    const mainVideo = this.getResolvedMainVideoUrl();
    const normalizedContent = stepSections
      .map((step) => {
        const lines = [`${step.title}: ${step.content}`];
        const mediaType: 'IMAGE' | 'VIDEO' = (step.mediaType || 'IMAGE') === 'VIDEO' ? 'VIDEO' : 'IMAGE';
        const mediaUrl = this.normalizeMediaUrlByType(step.mediaUrl || '', mediaType);
        if (mediaUrl) {
          lines.push(`@media[${mediaType}]=${mediaUrl}`);
        }
        return lines.join('\n');
      })
      .join('\n');

    return {
      titre: normalizedTitle,
      title: normalizedTitle,
      nom: normalizedTitle,
      description: this.description.trim(),
      coverImageUrl: mainImage || undefined,
      imagePrincipale: mainImage || undefined,
      imageUrl: mainImage || undefined,
      photoUrl: mainImage || undefined,
      coverVideoUrl: mainVideo || undefined,
      videoPrincipale: mainVideo || undefined,
      videoUrl: mainVideo || undefined,
      content: normalizedContent,
      contenu: normalizedContent,
      objectives,
      objectifs: objectives,
      sections: stepSections,
      summary: this.summary.trim(),
      resume: this.summary.trim(),
      level: this.level,
      niveau: this.level,
      estimatedDuration: normalizedDurationLabel || this.estimatedDuration.trim(),
      dureeEstimee: normalizedDurationLabel || this.estimatedDuration.trim(),
      duration: normalizedDuration ?? undefined,
      quiz: this.quiz,
      generatedByAi: this.isAiGeneratedDraft,
      aiGenerated: this.isAiGeneratedDraft,
      status,
      statut: status
    };
  }

  private normalizeGuideStepsForUi(steps: FormationGuideStep[]): FormationGuideStep[] {
    const normalized = steps
      .map((step, index) => ({
        id: this.safeText(step.id) || this.nextGuideStepId(),
        formationId: this.formationId ?? undefined,
        order: Number.isFinite(step.order) && step.order > 0 ? Math.round(step.order) : (index + 1),
        title: this.safeText(step.title) || `Etape ${index + 1}`,
        description: this.safeText(step.description),
        imageUrl: this.normalizeImageUrl(this.safeText(step.imageUrl)) || undefined,
        videoUrl: this.normalizeVideoUrl(this.safeText(step.videoUrl)) || undefined
      }))
      .sort((first, second) => first.order - second.order)
      .map((step, index) => ({
        ...step,
        order: index + 1
      }));

    if (normalized.length > 0) {
      return normalized;
    }

    return [];
  }

  private buildDefaultGuideStep(order: number): FormationGuideStep {
    return {
      id: this.nextGuideStepId(),
      formationId: this.formationId ?? undefined,
      order,
      title: `Etape ${order}`,
      description: '',
      imageUrl: '',
      videoUrl: ''
    };
  }

  private nextGuideStepId(): string {
    const currentId = this.guideStepCounter;
    this.guideStepCounter += 1;
    return `guide-step-${Date.now()}-${currentId}`;
  }

  private parseObjectifs(): string[] {
    return this.objectifsInput
      .split(/\r?\n|,/g)
      .map((entry) => entry.replace(/^[-*]\s*/, '').trim())
      .filter((entry) => entry.length > 0);
  }

  private normalizeSteps(steps: FormationSectionDto[]): FormationSectionDto[] {
    return steps
      .map((step, index): FormationSectionDto => {
        const mediaType: 'IMAGE' | 'VIDEO' = (step.mediaType || '').toUpperCase() === 'VIDEO' ? 'VIDEO' : 'IMAGE';
        const mediaUrl = this.normalizeMediaUrlByType(step.mediaUrl || '', mediaType);
        return {
          title: this.normalizeStepTitle(step.title, index),
          content: this.normalizeStepContent(step.content),
          mediaType,
          mediaUrl: mediaUrl || undefined
        };
      })
      .filter((step) => step.content.length > 0);
  }

  private parseStepsFromContent(rawContent: string, previousSections: FormationSectionDto[]): FormationSectionDto[] {
    const raw = rawContent
      .replace(/\r/g, '\n')
      .replace(/\n{2,}/g, '\n')
      .trim();

    if (!raw) {
      return [];
    }

    const mediaByKey = new Map<string, { mediaType: 'IMAGE' | 'VIDEO'; mediaUrl: string }>();
    previousSections.forEach((section, index) => {
      const mediaUrl = this.safeText(section.mediaUrl);
      const mediaType: 'IMAGE' | 'VIDEO' = (section.mediaType || '').toUpperCase() === 'VIDEO' ? 'VIDEO' : 'IMAGE';
      if (!mediaUrl) {
        return;
      }
      const key = this.normalizeForKey(this.safeText(section.title)) || `section-${index + 1}`;
      mediaByKey.set(key, {
        mediaType,
        mediaUrl: this.normalizeMediaUrlByType(mediaUrl, mediaType)
      });
    });

    const lines = raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const parsedSteps: FormationSectionDto[] = [];
    lines.forEach((line) => {
      const mediaInlineMatch = line.match(/^@media\[(IMAGE|VIDEO)\]\s*=\s*(.+)$/i);
      if (mediaInlineMatch && parsedSteps.length > 0) {
        const mediaType: 'IMAGE' | 'VIDEO' = mediaInlineMatch[1].toUpperCase() === 'VIDEO' ? 'VIDEO' : 'IMAGE';
        const mediaUrl = this.normalizeMediaUrlByType(mediaInlineMatch[2], mediaType);
        if (mediaUrl) {
          const lastStep = parsedSteps[parsedSteps.length - 1];
          lastStep.mediaType = mediaType;
          lastStep.mediaUrl = mediaUrl;
        }
        return;
      }

      const step = this.parseStepLine(line, parsedSteps.length);
      if (!step) {
        return;
      }

      parsedSteps.push(step);
    });

    return parsedSteps
      .map((step, index) => {
        const key = this.normalizeForKey(step.title) || `section-${index + 1}`;
        const media = mediaByKey.get(key);
        if (!media) {
          return {
            ...step,
            mediaType: 'IMAGE' as const
          };
        }
        return {
          ...step,
          mediaType: media.mediaType,
          mediaUrl: media.mediaUrl
        };
      });
  }

  private parseStepLine(line: string, index: number): FormationSectionDto | null {
    const cleaned = line
      .replace(/^[-*]\s*/, '')
      .replace(/^#+\s*/, '')
      .trim();

    if (!cleaned) {
      return null;
    }

    const separatorMatch = cleaned.match(/^([^:.\-]{3,})\s*[:.-]\s*(.+)$/);
    if (separatorMatch) {
      const title = this.normalizeStepTitle(separatorMatch[1], index);
      const content = this.normalizeStepContent(separatorMatch[2]);
      return content ? { title, content } : null;
    }

    const sanitized = this.normalizeStepContent(cleaned);
    if (!sanitized) {
      return null;
    }

    return {
      title: `Section ${index + 1}`,
      content: sanitized
    };
  }

  private normalizeStepTitle(rawTitle: string, index = 0): string {
    const cleaned = this.safeText(rawTitle)
      .replace(/^section\s*\d+\s*[-:]\s*/i, '')
      .replace(/^etape\s*\d+\s*[-:]\s*/i, '')
      .replace(/^step\s*\d+\s*[-:]\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) {
      return `Section ${index + 1}`;
    }

    return cleaned.length > 60 ? `${cleaned.slice(0, 57).trim()}...` : cleaned;
  }

  private normalizeStepContent(rawContent: string): string {
    const cleaned = this.safeText(rawContent)
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) {
      return '';
    }

    return cleaned.length > 220 ? `${cleaned.slice(0, 217).trim()}...` : cleaned;
  }

  private normalizeMediaUrlByType(rawUrl: string, mediaType: 'IMAGE' | 'VIDEO'): string {
    if (mediaType === 'VIDEO') {
      return this.normalizeVideoUrl(rawUrl);
    }
    return this.normalizeImageUrl(rawUrl);
  }

  private normalizeImageUrl(rawUrl: string): string {
    const cleaned = this.safeText(rawUrl);
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
    const cleaned = this.safeText(rawUrl);
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

  private normalizeForKey(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
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

  private extractFormationId(response: Record<string, unknown>): number | null {
    const rawId = response['id'] ?? response['formationId'];
    const parsedId = typeof rawId === 'string' ? Number.parseInt(rawId, 10) : rawId;
    return typeof parsedId === 'number' && Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;
  }

  private normalizeLevel(level: unknown): FormationLevel {
    const raw = this.safeText(level).toUpperCase();
    if (raw === 'INTERMEDIATE') {
      return 'INTERMEDIATE';
    }
    if (raw === 'ADVANCED') {
      return 'ADVANCED';
    }
    return 'BEGINNER';
  }

  private normalizeStatus(status: unknown): FormationStatus {
    const raw = this.safeText(status).toUpperCase();
    if (raw === 'PUBLISHED') {
      return 'PUBLISHED';
    }
    if (raw === 'ARCHIVED') {
      return 'ARCHIVED';
    }
    return 'DRAFT';
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

  private safeText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private readLooseFormationField(formation: FormationSummaryDto, fieldName: string): string {
    const record = formation as unknown as Record<string, unknown>;
    return this.safeText(record[fieldName]);
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

  private applyGuideTemplateIfAvailable(): void {
    const template = this.guideService.consumeTemplateForCreation();
    if (!template) {
      return;
    }

    this.applyGuideTemplate(template);
    this.saveMessage = 'Modele de formation charge depuis le guide interactif.';
    this.pageMessage = '';
    this.guideService.markAction(this.guidePage, 'title-entered');
    this.guideService.markAction(this.guidePage, 'description-entered');
  }

  private applyGuideTemplate(template: GuideRewardTemplate): void {
    this.titre = template.title;
    this.description = template.description;
    this.objectifsInput = template.objectives.join('\n');
    this.content = template.content;
    this.summary = template.summary;
    this.level = template.level;
    this.estimatedDuration = template.estimatedDuration;
    this.quiz = template.quiz.map((item) => ({
      question: item.question,
      choices: [...item.choices],
      correctAnswer: item.correctAnswer
    }));
    this.generatedSections = this.parseStepsFromContent(this.content, this.generatedSections);
  }

  private triggerGuideAiIfRequested(): void {
    const aiRequested = this.route.snapshot.queryParamMap.get('ai') === '1';
    const subjectFromGuide = this.guideService.consumePendingAiSubject();

    if (!aiRequested && !subjectFromGuide) {
      return;
    }

    const subject = subjectFromGuide || this.titre.trim() || 'Introduction au camping';
    this.startQuickAiGeneration(subject);
  }

  private startQuickAiGeneration(subject: string): void {
    if (this.isQuickAiLoading) {
      return;
    }

    const payload: FormationGenerateRequestDto = {
      subject: subject.trim() || 'Introduction au camping',
      level: this.level,
      targetUser: this.connectedRole
    };

    this.isQuickAiLoading = true;
    this.pageMessage = '';
    this.saveMessage = 'Generation IA en cours depuis le guide interactif...';

    this.formationAiService.generateFormationWithFallback(payload).subscribe({
      next: (generated) => {
        this.isQuickAiLoading = false;
        this.applyAiGeneration(generated);
        this.pageMessage = '';
        this.saveMessage = 'Contenu IA genere automatiquement depuis le guide interactif.';
        this.guideService.markAction(this.guidePage, 'ai-generated');
      },
      error: () => {
        this.isQuickAiLoading = false;
        this.saveMessage = '';
        this.pageMessage = 'Impossible de generer automatiquement le contenu IA.';
      }
    });
  }

  private parseDurationMinutes(value: string): number | null {
    const compact = value.trim();
    if (!compact) {
      return null;
    }

    const match = compact.match(/\d+/);
    if (!match) {
      return null;
    }

    const parsed = Number.parseInt(match[0], 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private toClosestDurationSlot(value: number): number {
    return this.durationOptions.reduce((closest, candidate) =>
      Math.abs(candidate - value) < Math.abs(closest - value) ? candidate : closest,
    this.durationOptions[0]);
  }

  private getResolvedMainImageUrl(): string {
    const fromInput = this.normalizeImageUrl(this.mainImageUrl);
    if (fromInput) {
      return fromInput;
    }

    const fromGallery = this.formationMediaOptions.find((media) =>
      media.mediaType === 'IMAGE' || media.mimeType.startsWith('image/')
    );

    if (!fromGallery) {
      return '';
    }

    return this.normalizeImageUrl(this.formationMediaService.resolveMediaUrl(fromGallery.mediaUrl));
  }

  private getResolvedMainVideoUrl(): string {
    const fromInput = this.normalizeVideoUrl(this.mainVideoUrl);
    if (fromInput) {
      return fromInput;
    }

    return '';
  }

  private isEmbeddableVideoUrl(url: string): boolean {
    return /youtube\.com\/embed\//i.test(url) || /player\.vimeo\.com\/video\//i.test(url);
  }

  private normalizeDurationText(value: unknown): string {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      return '';
    }
    return `${this.toClosestDurationSlot(value)} minutes`;
  }

  private refreshAiContentWarningFromDraft(): void {
    if (!this.isAiGeneratedDraft) {
      this.aiContentWarning = '';
      return;
    }

    const snapshot: FormationGenerateResponseDto = {
      title: this.titre.trim(),
      description: this.description.trim(),
      objectives: this.parseObjectifs(),
      sections: this.stepPreviewItems.map((step) => ({
        title: this.safeText(step.title),
        content: this.safeText(step.content),
        mediaType: step.mediaType,
        mediaUrl: step.mediaUrl
      })),
      summary: this.summary.trim(),
      quiz: [...this.quiz],
      level: this.level,
      estimatedDuration: this.estimatedDuration.trim()
    };

    this.aiContentWarning = this.formationAiService.getGeneratedContentWarning(snapshot);
  }

  private resolveSuggestedMediaTargetStepIndex(): number | null {
    if (this.generatedSections.length === 0) {
      this.generatedSections = this.parseStepsFromContent(this.content, this.generatedSections);
    }

    if (this.generatedSections.length === 0) {
      return null;
    }

    const firstWithoutMediaIndex = this.generatedSections.findIndex((step) => !this.safeText(step.mediaUrl));
    return firstWithoutMediaIndex >= 0 ? firstWithoutMediaIndex : 0;
  }

  private refreshMediaHints(): void {
    const title = this.titre.trim();
    const shortDescription = this.description.trim().split(/\s+/).slice(0, 12).join(' ');
    const hintTopic = `${title} ${shortDescription}`.trim() || title || this.description.trim() || 'formation camping';
    this.mediaHints = this.formationAiService.suggestMediaHints(hintTopic);
  }

  private syncAutoMainVideoFromTopic(force = false): void {
    const topic = this.titre.trim() || this.description.trim();
    const suggested = this.normalizeVideoUrl(this.formationAiService.getPrimaryVideoSuggestion(topic));
    if (!suggested) {
      return;
    }

    const current = this.normalizeVideoUrl(this.mainVideoUrl);
    const canAutoApply = force
      || !current
      || !this.isMainVideoManuallyEdited
      || current === this.lastAutoSuggestedMainVideo;

    if (!canAutoApply) {
      return;
    }

    this.mainVideoUrl = suggested;
    this.lastAutoSuggestedMainVideo = suggested;
    this.isMainVideoManuallyEdited = false;
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

  private hasCompleteGuideSteps(steps: FormationGuideStep[]): boolean {
    if (!Array.isArray(steps) || steps.length < 3) {
      return false;
    }

    return steps.every((step) => {
      const title = this.safeText(step.title);
      const description = this.safeText(step.description);
      const imageUrl = this.normalizeImageUrl(this.safeText(step.imageUrl));
      const videoUrl = this.normalizeVideoUrl(this.safeText(step.videoUrl));
      const hasCustomTitle = title.length > 0 && !/^etape\s+\d+$/i.test(title);
      return hasCustomTitle && description.length >= 20 && (!!imageUrl || !!videoUrl);
    });
  }

  private hasMeaningfulGuideSteps(steps: FormationGuideStep[]): boolean {
    if (!Array.isArray(steps) || steps.length === 0) {
      return false;
    }

    return steps.some((step) => this.isMeaningfulGuideStep(step));
  }

  private isMeaningfulGuideStep(step: FormationGuideStep): boolean {
    const title = this.safeText(step.title);
    const description = this.safeText(step.description);
    const imageUrl = this.safeText(step.imageUrl);
    const videoUrl = this.safeText(step.videoUrl);
    const hasCustomTitle = title.length > 0 && !/^etape\s+\d+$/i.test(title);
    return hasCustomTitle || description.length > 0 || imageUrl.length > 0 || videoUrl.length > 0;
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
