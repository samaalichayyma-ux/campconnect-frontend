import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import {
  GuideDefinition,
  FormationGuideProgressState,
  FormationGuideStep,
  GuideMediaLink,
  GuideMediaType,
  GuidePageKey,
  GuideProgressPayload,
  GuideProgressState,
  GuideRewardState,
  GuideRewardTemplate,
  GuideStep
} from '../models/guide-interactif.model';

@Injectable({
  providedIn: 'root'
})
export class GuideInteractifService {
  private readonly apiUrl = 'http://localhost:8082/api/guides';
  private readonly formationsApiUrl = 'http://localhost:8082/api/formations';
  private readonly storageKey = 'campconnect_guide_progress_v2';
  private readonly rewardStorageKey = 'campconnect_guide_reward_v1';
  private readonly mediaStorageKey = 'campconnect_guide_media_links_v1';
  private readonly formationProgressStorageKey = 'campconnect_guide_progress_by_formation_v1';
  private readonly formationGuideStepsStorageKey = 'campconnect_formation_guide_steps_v1';
  private readonly formationGuideProgressStorageKey = 'campconnect_formation_guide_progress_v1';
  private readonly templateDraftStorageKey = 'campconnect_guide_reward_template_draft_v1';
  private readonly aiIntentStorageKey = 'campconnect_guide_reward_ai_intent_v1';
  private readonly completionPoints = 50;
  private readonly scopedProgressKeyPrefix = 'scope:';

  private readonly rewardTemplate: GuideRewardTemplate = {
    title: 'Modele: Introduction au camping',
    description: 'Formation de base pour comprendre le camping et les regles de securite sur le terrain.',
    objectives: [
      'Identifier les bonnes pratiques essentielles de securite',
      'Appliquer une methode simple pour accueillir et orienter les clients',
      'Valider les acquis avec un quiz final'
    ],
    content: [
      '## 1. Contexte',
      'Presentation des enjeux du camping et du role de la preparation.',
      '',
      '## 2. Procedure',
      'Etapes de preparation, accueil, suivi et cloture.',
      '',
      '## 3. Qualite de service',
      'Conseils concrets, erreurs frequentes et checklist finale.'
    ].join('\n'),
    summary: 'Parcours progressif: comprendre, appliquer, verifier.',
    level: 'BEGINNER',
    estimatedDuration: '45 minutes',
    quiz: [
      {
        question: 'Quel est l objectif principal de cette formation ?',
        choices: ['Comprendre les bases du camping', 'Ignorer la securite', 'Supprimer la verification'],
        correctAnswer: 'Comprendre les bases du camping'
      },
      {
        question: 'Quelle action finalise une etape de qualite ?',
        choices: ['Suivre une checklist', 'Ne rien documenter', 'Sauter le quiz'],
        correctAnswer: 'Suivre une checklist'
      },
      {
        question: 'Quel outil aide le suivi des operations ?',
        choices: ['Une checklist claire', 'Un tableau vide', 'Aucun outil'],
        correctAnswer: 'Une checklist claire'
      }
    ]
  };

  private readonly defaults: Record<GuidePageKey, GuideDefinition> = {
    'formation-list': {
      page: 'formation-list',
      title: 'Guide liste des formations',
      steps: [
        { id: 1, title: 'Rechercher', description: 'Saisissez un titre pour filtrer rapidement.', actionHint: 'Essayez un mot-cle du sujet.', actionKey: 'search' },
        { id: 2, title: 'Filtrer', description: 'Affinez par niveau ou statut.', actionHint: 'Combinez les filtres pour aller plus vite.', actionKey: 'filter' },
        { id: 3, title: 'Ouvrir', description: 'Ouvrez une formation pour consulter son detail.', actionHint: 'Cliquez sur "Detail".', actionKey: 'open-detail' }
      ]
    },
    'formation-create': {
      page: 'formation-create',
      title: 'Guide pratique: monter une tente',
      steps: [
        {
          id: 1,
          title: 'Choisir l emplacement',
          description: 'Selectionnez un sol plat, sec et securise avant d installer la tente.',
          actionHint: 'Ajoutez le contexte de terrain dans le titre et la description.',
          actionKey: 'title-entered',
          tutorial: 'Verifier pente, vent et distance des zones a risque.',
          checklist: ['Terrain plat', 'Zone non inondable', 'Distance securite feu']
        },
        {
          id: 2,
          title: 'Deplier la tente',
          description: 'Expliquez l ordre de depliage et la lecture de la notice du modele.',
          actionHint: 'Renseignez clairement les etapes dans le contenu.',
          actionKey: 'description-entered',
          tutorial: 'Commencer par la toile principale, puis preparer les arceaux.',
          checklist: ['Toile et arceaux prets', 'Notice disponible', 'Zone degagee']
        },
        {
          id: 3,
          title: 'Fixer les piquets',
          description: 'Montrez la technique de fixation et la tension progressive des coins.',
          actionHint: 'Ajoutez photo ou video explicative de cette etape.',
          actionKey: 'media-added',
          mediaType: 'VIDEO',
          checklist: ['Coins fixes', 'Piquets en angle', 'Toile tendue']
        },
        {
          id: 4,
          title: 'Verifier la stabilite',
          description: 'Controlez l ancrage final et validez les points de securite.',
          actionHint: 'Generez un quiz de verification puis publiez la formation.',
          actionKey: 'quiz-generated',
          checklist: ['Haubans verifies', 'Entree stable', 'Controle final securite']
        },
        {
          id: 5,
          title: 'Publier la formation',
          description: 'Validez la formation pratique pour les apprenants.',
          actionHint: 'Cliquez sur Publier pour finaliser.',
          actionKey: 'published'
        }
      ]
    },
    'formation-detail': {
      page: 'formation-detail',
      title: 'Guide pratique de la formation',
      steps: [
        {
          id: 1,
          title: 'Lire la theorie',
          description: 'Consultez les explications de la formation (description, objectifs, sections).',
          actionHint: 'Validez cette etape apres lecture complete.',
          actionKey: 'read-content'
        },
        {
          id: 2,
          title: 'Observer les medias',
          description: 'Regardez les images et videos qui montrent le geste pratique.',
          actionHint: 'Verifiez que chaque media aide a comprendre une action.',
          actionKey: 'read-media'
        },
        {
          id: 3,
          title: 'Passer a la pratique',
          description: 'Ouvrez le guide interactif pour executer les actions terrain.',
          actionHint: 'Continuez et validez les etapes une par une.',
          actionKey: 'open-edit'
        }
      ]
    },
    'formation-edit': {
      page: 'formation-edit',
      title: 'Guide modification de formation',
      steps: [
        { id: 1, title: 'Mettre a jour les champs', description: 'Modifiez titre, description et contenu.', actionHint: 'Assurez-vous que le texte reste coherent.', actionKey: 'fields-updated' },
        { id: 2, title: 'Analyser qualite', description: 'Lancez l analyse IA pour ameliorer.', actionHint: 'Corrigez les points faibles proposes.', actionKey: 'quality-analyzed' },
        { id: 3, title: 'Ajouter media', description: 'Ajoutez ou supprimez des medias.', actionHint: 'Gardez uniquement les medias utiles.', actionKey: 'media-added' },
        { id: 4, title: 'Enregistrer', description: 'Sauvegardez les changements.', actionHint: 'Cliquez sur "Enregistrer".', actionKey: 'saved' },
        { id: 5, title: 'Publier', description: 'Publiez la version finale.', actionHint: 'Passez le statut a publie.', actionKey: 'published' }
      ]
    }
  };

  private progress: Record<GuidePageKey, GuideProgressState> = this.loadProgressFromStorage();
  private progressSubject = new BehaviorSubject<Record<GuidePageKey, GuideProgressState>>(this.progress);
  private rewardStateSubject = new BehaviorSubject<GuideRewardState>(this.loadRewardStateFromStorage());
  private mediaLinks: Record<GuidePageKey, GuideMediaLink[]> = this.loadMediaLinksFromStorage();
  private mediaLinksSubject = new BehaviorSubject<Record<GuidePageKey, GuideMediaLink[]>>(this.mediaLinks);
  private formationProgressById: Record<string, number> = this.loadFormationProgressByIdFromStorage();
  private formationGuideStepsById: Record<string, FormationGuideStep[]> = this.loadFormationGuideStepsFromStorage();
  private formationGuideProgressById: Record<string, FormationGuideProgressState> = this.loadFormationGuideProgressFromStorage();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getGuide(page: GuidePageKey): Observable<GuideDefinition> {
    return this.http.get<GuideDefinition>(`${this.apiUrl}/${page}`).pipe(
      map((remoteGuide) => this.mergeGuideWithDefault(page, remoteGuide)),
      catchError(() => of(this.defaults[page]))
    );
  }

  getGuides(): Observable<GuideDefinition[]> {
    return this.http.get<GuideDefinition[]>(this.apiUrl).pipe(
      catchError(() => of(Object.values(this.defaults)))
    );
  }

  getProgressState(page: GuidePageKey): GuideProgressState {
    return this.progress[page] ?? this.buildDefaultProgress(page);
  }

  progress$(page: GuidePageKey): Observable<GuideProgressState> {
    return this.progressSubject.asObservable().pipe(
      map((allProgress) => allProgress[page] ?? this.buildDefaultProgress(page))
    );
  }

  startPage(page: GuidePageKey, autoOpen = true): void {
    const state = this.getProgressState(page);
    const nextState: GuideProgressState = {
      ...state,
      closed: autoOpen ? false : state.closed
    };
    this.setProgress(page, nextState, false);
    this.refreshProgressFromBackend(page);
  }

  closeGuide(page: GuidePageKey): void {
    const state = this.getProgressState(page);
    this.setProgress(page, { ...state, closed: true }, true);
  }

  resumeGuide(page: GuidePageKey): void {
    const state = this.getProgressState(page);
    this.setProgress(page, { ...state, closed: false }, true);
  }

  resetProgress(page: GuidePageKey): void {
    this.setProgress(page, this.buildDefaultProgress(page), true);
  }

  nextStep(page: GuidePageKey): void {
    const guide = this.defaults[page];
    const state = this.getProgressState(page);
    const nextStep = Math.min(guide.steps.length, state.activeStep + 1);
    this.setProgress(page, { ...state, activeStep: nextStep }, true);
  }

  previousStep(page: GuidePageKey): void {
    const state = this.getProgressState(page);
    const previousStep = Math.max(1, state.activeStep - 1);
    this.setProgress(page, { ...state, activeStep: previousStep }, true);
  }

  selectStep(page: GuidePageKey, stepId: number): void {
    const guide = this.defaults[page];
    const boundedStep = Math.min(guide.steps.length, Math.max(1, stepId));
    const state = this.getProgressState(page);
    this.setProgress(page, { ...state, activeStep: boundedStep }, true);
  }

  completeCurrentStep(page: GuidePageKey): void {
    const guide = this.defaults[page];
    const state = this.getProgressState(page);
    const completed = new Set(state.completedStepIds);
    completed.add(state.activeStep);
    const nextStep = Math.min(guide.steps.length, state.activeStep + 1);
    this.setProgress(page, {
      ...state,
      completedStepIds: Array.from(completed),
      activeStep: nextStep
    }, true);
  }

  markAction(page: GuidePageKey, actionKey: string): void {
    const guide = this.defaults[page];
    const targetStep = guide.steps.find((step) => step.actionKey === actionKey);
    if (!targetStep) {
      return;
    }

    const state = this.getProgressState(page);
    const completed = new Set(state.completedStepIds);
    completed.add(targetStep.id);

    const currentActive = state.activeStep;
    const shouldAdvance = targetStep.id >= currentActive;
    const nextStep = shouldAdvance
      ? Math.min(guide.steps.length, targetStep.id + 1)
      : currentActive;

    this.setProgress(page, {
      ...state,
      activeStep: nextStep,
      completedStepIds: Array.from(completed)
    }, true);
  }

  getProgressPercent(page: GuidePageKey): number {
    const state = this.getProgressState(page);
    const stepCount = this.defaults[page].steps.length;
    if (stepCount === 0) {
      return 0;
    }
    return Math.round((state.completedStepIds.length / stepCount) * 100);
  }

  saveFormationProgress(formationId: number, progressPercent: number, guideId?: number): void {
    if (!Number.isFinite(formationId) || formationId <= 0) {
      return;
    }

    const normalizedProgress = Math.max(0, Math.min(100, Math.round(progressPercent)));
    const scopedKey = this.buildProgressScopeKey(formationId, guideId);
    this.formationProgressById[scopedKey] = normalizedProgress;
    this.persistFormationProgressById();
  }

  getFormationProgressPercent(formationId: number, guideId?: number): number {
    if (!Number.isFinite(formationId) || formationId <= 0) {
      return 0;
    }

    const scopedKey = this.buildProgressScopeKey(formationId, guideId);
    const storedValue = this.formationProgressById[scopedKey]
      ?? this.findScopedFormationProgressPercent(formationId)
      ?? this.getLegacyFormationProgressPercent(formationId);
    if (!Number.isFinite(storedValue)) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round(storedValue)));
  }

  listFormationGuideSteps(formationId: number): Observable<FormationGuideStep[]> {
    if (!Number.isFinite(formationId) || formationId <= 0) {
      return of([]);
    }

    const localSteps = this.getLocalFormationGuideSteps(formationId);
    const candidates = this.buildFormationGuideStepGetCandidates(formationId);

    return this.fetchFormationGuideStepsWithFallback(candidates, formationId, 0).pipe(
      map((remoteSteps) => {
        if (remoteSteps.length === 0) {
          return localSteps;
        }
        this.upsertLocalFormationGuideSteps(formationId, remoteSteps);
        return remoteSteps;
      }),
      catchError(() => of(localSteps))
    );
  }

  saveFormationGuideSteps(formationId: number, steps: FormationGuideStep[]): Observable<FormationGuideStep[]> {
    if (!Number.isFinite(formationId) || formationId <= 0) {
      return of([]);
    }

    const normalizedSteps = this.normalizeFormationGuideStepsInput(formationId, steps);
    const candidates = this.buildFormationGuideStepSaveCandidates(formationId, normalizedSteps);

    return this.sendFormationGuideSaveWithFallback(candidates, formationId, normalizedSteps, 0).pipe(
      map((savedSteps) => {
        this.upsertLocalFormationGuideSteps(formationId, savedSteps);
        return savedSteps;
      }),
      catchError(() => {
        this.upsertLocalFormationGuideSteps(formationId, normalizedSteps);
        return of(normalizedSteps);
      })
    );
  }

  loadFormationGuideProgress(
    formationId: number,
    totalSteps: number
  ): Observable<FormationGuideProgressState> {
    const localProgress = this.getFormationGuideProgressState(formationId, totalSteps);

    if (!Number.isFinite(formationId) || formationId <= 0) {
      return of(localProgress);
    }

    const candidates = this.buildFormationGuideProgressGetCandidates(formationId);
    return this.fetchFormationGuideProgressWithFallback(candidates, formationId, totalSteps, 0).pipe(
      map((remoteProgress) => {
        if (!remoteProgress) {
          return localProgress;
        }
        this.upsertLocalFormationGuideProgress(formationId, remoteProgress);
        this.saveFormationProgress(formationId, remoteProgress.progressPercent, remoteProgress.guideId);
        return remoteProgress;
      }),
      catchError(() => of(localProgress))
    );
  }

  completeFormationGuideStep(
    formationId: number,
    stepOrder: number,
    totalSteps: number
  ): Observable<FormationGuideProgressState> {
    const localProgress = this.computeNextFormationGuideProgress(formationId, stepOrder, totalSteps);
    if (!Number.isFinite(formationId) || formationId <= 0) {
      return of(localProgress);
    }

    const candidates = this.buildFormationGuideProgressSaveCandidates(formationId, localProgress, stepOrder);
    return this.sendFormationGuideProgressWithFallback(candidates, formationId, localProgress, totalSteps, 0).pipe(
      map((remoteProgress) => {
        if (!remoteProgress) {
          this.upsertLocalFormationGuideProgress(formationId, localProgress);
          this.saveFormationProgress(formationId, localProgress.progressPercent, localProgress.guideId);
          return localProgress;
        }
        this.upsertLocalFormationGuideProgress(formationId, remoteProgress);
        this.saveFormationProgress(formationId, remoteProgress.progressPercent, remoteProgress.guideId);
        return remoteProgress;
      }),
      catchError(() => {
        this.upsertLocalFormationGuideProgress(formationId, localProgress);
        this.saveFormationProgress(formationId, localProgress.progressPercent, localProgress.guideId);
        return of(localProgress);
      })
    );
  }

  resetFormationGuideProgress(formationId: number, guideId?: number): void {
    if (!Number.isFinite(formationId) || formationId <= 0) {
      return;
    }

    const scopedKey = this.buildProgressScopeKey(formationId, guideId);
    delete this.formationGuideProgressById[scopedKey];
    this.removeLegacyFormationGuideProgress(formationId);
    this.persistFormationGuideProgressById();
    this.saveFormationProgress(formationId, 0, guideId);
  }

  getFormationGuideProgressState(
    formationId: number,
    totalSteps: number,
    guideId?: number
  ): FormationGuideProgressState {
    const fallback = this.buildDefaultFormationGuideProgress(formationId, totalSteps, guideId);
    if (!Number.isFinite(formationId) || formationId <= 0) {
      return fallback;
    }

    const scopedKey = this.buildProgressScopeKey(formationId, guideId);
    const stored = this.formationGuideProgressById[scopedKey]
      ?? this.findScopedFormationGuideProgress(formationId)
      ?? this.getLegacyFormationGuideProgressState(formationId);
    if (!stored) {
      return fallback;
    }

    return this.normalizeFormationGuideProgress(stored, formationId, totalSteps, guideId);
  }

  reward$(): Observable<GuideRewardState> {
    return this.rewardStateSubject.asObservable();
  }

  getRewardState(): GuideRewardState {
    return this.rewardStateSubject.value;
  }

  claimCompletionReward(page: GuidePageKey, grantPoints = true): GuideRewardState {
    const current = this.getRewardState();
    const rewardedPages = new Set(current.rewardedPages);

    if (!rewardedPages.has(page)) {
      rewardedPages.add(page);
      const nextState: GuideRewardState = {
        badgeExpertFormationUnlocked: true,
        templateUnlocked: true,
        totalPoints: grantPoints ? current.totalPoints + this.completionPoints : current.totalPoints,
        rewardedPages: Array.from(rewardedPages),
        lastUnlockedAt: new Date().toISOString(),
        badgeName: current.badgeName || 'Explorateur du camping',
        lastAwardedPoints: grantPoints ? this.completionPoints : 0,
        rewardSource: 'local'
      };
      this.setRewardState(nextState);
      return nextState;
    }

    if (!current.badgeExpertFormationUnlocked || !current.templateUnlocked) {
      const normalizedState: GuideRewardState = {
        ...current,
        badgeExpertFormationUnlocked: true,
        templateUnlocked: true,
        badgeName: current.badgeName || 'Explorateur du camping',
        rewardSource: current.rewardSource || 'local'
      };
      this.setRewardState(normalizedState);
      return normalizedState;
    }

    return current;
  }

  getRewardTemplate(): GuideRewardTemplate {
    return {
      ...this.rewardTemplate,
      objectives: [...this.rewardTemplate.objectives],
      quiz: this.rewardTemplate.quiz.map((item) => ({
        question: item.question,
        choices: [...item.choices],
        correctAnswer: item.correctAnswer
      }))
    };
  }

  prepareTemplateForCreation(): void {
    const template = this.getRewardTemplate();
    localStorage.setItem(this.templateDraftStorageKey, JSON.stringify(template));
  }

  consumeTemplateForCreation(): GuideRewardTemplate | null {
    const rawData = localStorage.getItem(this.templateDraftStorageKey);
    if (!rawData) {
      return null;
    }

    localStorage.removeItem(this.templateDraftStorageKey);

    try {
      const parsed = JSON.parse(rawData) as GuideRewardTemplate;
      return this.normalizeTemplate(parsed);
    } catch {
      return null;
    }
  }

  setPendingAiSubject(subject: string): void {
    const normalizedSubject = subject.trim();
    if (!normalizedSubject) {
      localStorage.removeItem(this.aiIntentStorageKey);
      return;
    }
    localStorage.setItem(this.aiIntentStorageKey, normalizedSubject);
  }

  consumePendingAiSubject(): string {
    const rawSubject = localStorage.getItem(this.aiIntentStorageKey) || '';
    localStorage.removeItem(this.aiIntentStorageKey);
    return rawSubject.trim();
  }

  isGuidePageKey(value: string | null | undefined): value is GuidePageKey {
    return value === 'formation-list'
      || value === 'formation-create'
      || value === 'formation-detail'
      || value === 'formation-edit';
  }

  mediaLinks$(page: GuidePageKey): Observable<GuideMediaLink[]> {
    return this.mediaLinksSubject.asObservable().pipe(
      map((allMediaLinks) => allMediaLinks[page] ?? [])
    );
  }

  getMediaLinks(page: GuidePageKey): GuideMediaLink[] {
    return [...(this.mediaLinks[page] ?? [])];
  }

  addMediaLink(page: GuidePageKey, type: GuideMediaType, url: string, label: string): { ok: boolean; message: string } {
    return this.addMediaLinkWithStep(page, type, url, label);
  }

  addMediaLinkWithStep(
    page: GuidePageKey,
    type: GuideMediaType,
    url: string,
    label: string,
    stepId?: number
  ): { ok: boolean; message: string } {
    const rawUrl = url.trim();
    const normalizedUrl = this.normalizeMediaUrlByType(rawUrl, type);
    const normalizedLabel = label.trim();

    if (!rawUrl) {
      return { ok: false, message: 'Ajoutez une URL de media.' };
    }

    if (!normalizedUrl) {
      return {
        ok: false,
        message: type === 'VIDEO'
          ? 'URL video invalide. Utilisez YouTube embed/watch/share ou une URL video directe.'
          : 'URL image invalide. Utilisez une URL image http ou https.'
      };
    }

    if (!this.isValidMediaUrl(normalizedUrl)) {
      return { ok: false, message: 'URL invalide. Utilisez une URL http ou https.' };
    }

    const link: GuideMediaLink = {
      id: this.buildMediaLinkId(),
      page,
      stepId: this.toPositiveNumber(stepId) ?? undefined,
      type,
      url: normalizedUrl,
      label: normalizedLabel || this.buildDefaultMediaLabel(type, normalizedUrl),
      createdAt: new Date().toISOString()
    };

    const updatedPageLinks = [link, ...(this.mediaLinks[page] ?? [])];
    this.mediaLinks = {
      ...this.mediaLinks,
      [page]: updatedPageLinks
    };
    this.mediaLinksSubject.next(this.mediaLinks);
    this.persistMediaLinks();

    return { ok: true, message: 'Media explicatif ajoute au guide.' };
  }

  removeMediaLink(page: GuidePageKey, linkId: string): void {
    const current = this.mediaLinks[page] ?? [];
    const filtered = current.filter((item) => item.id !== linkId);

    if (filtered.length === current.length) {
      return;
    }

    this.mediaLinks = {
      ...this.mediaLinks,
      [page]: filtered
    };
    this.mediaLinksSubject.next(this.mediaLinks);
    this.persistMediaLinks();
  }

  private fetchFormationGuideStepsWithFallback(
    candidates: string[],
    formationId: number,
    index: number
  ): Observable<FormationGuideStep[]> {
    const endpoint = candidates[index];
    if (!endpoint) {
      return of([]);
    }

    return this.http.get<unknown>(endpoint).pipe(
      map((response) => this.parseFormationGuideStepsResponse(response, formationId)),
      map((steps) => this.normalizeFormationGuideStepsInput(formationId, steps)),
      switchMap((steps) => {
        if (steps.length > 0 || index >= candidates.length - 1) {
          return of(steps);
        }
        return this.fetchFormationGuideStepsWithFallback(candidates, formationId, index + 1);
      }),
      catchError(() => this.fetchFormationGuideStepsWithFallback(candidates, formationId, index + 1))
    );
  }

  private sendFormationGuideSaveWithFallback(
    candidates: Array<{ method: 'POST' | 'PUT'; url: string; body: unknown }>,
    formationId: number,
    fallbackSteps: FormationGuideStep[],
    index: number
  ): Observable<FormationGuideStep[]> {
    const candidate = candidates[index];
    if (!candidate) {
      return of(fallbackSteps);
    }

    return this.http.request<unknown>(candidate.method, candidate.url, { body: candidate.body }).pipe(
      map((response) => {
        const parsed = this.parseFormationGuideStepsResponse(response, formationId);
        if (parsed.length === 0) {
          return fallbackSteps;
        }
        return this.normalizeFormationGuideStepsInput(formationId, parsed);
      }),
      catchError(() => this.sendFormationGuideSaveWithFallback(candidates, formationId, fallbackSteps, index + 1))
    );
  }

  private fetchFormationGuideProgressWithFallback(
    candidates: string[],
    formationId: number,
    totalSteps: number,
    index: number
  ): Observable<FormationGuideProgressState | null> {
    const endpoint = candidates[index];
    if (!endpoint) {
      return of(null);
    }

    return this.http.get<unknown>(endpoint).pipe(
      map((response) => this.parseFormationGuideProgressResponse(response, formationId, totalSteps)),
      switchMap((progress) => {
        if (progress || index >= candidates.length - 1) {
          return of(progress);
        }
        return this.fetchFormationGuideProgressWithFallback(candidates, formationId, totalSteps, index + 1);
      }),
      catchError(() => this.fetchFormationGuideProgressWithFallback(candidates, formationId, totalSteps, index + 1))
    );
  }

  private sendFormationGuideProgressWithFallback(
    candidates: Array<{ method: 'POST' | 'PUT'; url: string; body: unknown }>,
    formationId: number,
    localProgress: FormationGuideProgressState,
    totalSteps: number,
    index: number
  ): Observable<FormationGuideProgressState | null> {
    const candidate = candidates[index];
    if (!candidate) {
      return of(localProgress);
    }

    return this.http.request<unknown>(candidate.method, candidate.url, { body: candidate.body }).pipe(
      map((response) => {
        const parsed = this.parseFormationGuideProgressResponse(response, formationId, totalSteps);
        return parsed || localProgress;
      }),
      catchError(() => this.sendFormationGuideProgressWithFallback(
        candidates,
        formationId,
        localProgress,
        totalSteps,
        index + 1
      ))
    );
  }

  private buildFormationGuideStepGetCandidates(formationId: number): string[] {
    return [
      `${this.formationsApiUrl}/${formationId}/guide`,
      `${this.formationsApiUrl}/${formationId}/guide/steps`,
      `${this.apiUrl}/formations/${formationId}/steps`,
      `${this.apiUrl}/formation/${formationId}/steps`,
      `${this.apiUrl}/formations/${formationId}`,
      `${this.apiUrl}/formation/${formationId}`,
      `${this.apiUrl}/by-formation/${formationId}`
    ];
  }

  private buildFormationGuideStepSaveCandidates(
    formationId: number,
    steps: FormationGuideStep[]
  ): Array<{ method: 'POST' | 'PUT'; url: string; body: unknown }> {
    const payloadSteps = steps.map((step) => ({
      id: this.toPositiveNumber(step.id) ?? undefined,
      formationId,
      stepOrder: step.order,
      order: step.order,
      title: step.title,
      titre: step.title,
      description: step.description,
      imageUrl: step.imageUrl || null,
      videoUrl: step.videoUrl || null
    }));

    const wrappedPayload = {
      formationId,
      steps: payloadSteps
    };

    return [
      { method: 'POST', url: `${this.formationsApiUrl}/${formationId}/guide`, body: wrappedPayload },
      { method: 'PUT', url: `${this.formationsApiUrl}/${formationId}/guide`, body: wrappedPayload },
      { method: 'POST', url: `${this.formationsApiUrl}/${formationId}/guide/steps`, body: wrappedPayload },
      { method: 'PUT', url: `${this.apiUrl}/formations/${formationId}/steps`, body: wrappedPayload },
      { method: 'POST', url: `${this.apiUrl}/formations/${formationId}/steps`, body: wrappedPayload },
      { method: 'PUT', url: `${this.apiUrl}/formation/${formationId}/steps`, body: wrappedPayload },
      { method: 'POST', url: `${this.apiUrl}/formation/${formationId}/steps`, body: wrappedPayload },
      { method: 'POST', url: `${this.apiUrl}/formations/${formationId}`, body: wrappedPayload },
      { method: 'PUT', url: `${this.apiUrl}/formations/${formationId}`, body: wrappedPayload },
      { method: 'POST', url: `${this.apiUrl}/steps`, body: wrappedPayload },
      { method: 'POST', url: `${this.apiUrl}/formation-steps`, body: wrappedPayload },
      { method: 'POST', url: `${this.apiUrl}/batch-steps`, body: wrappedPayload }
    ];
  }

  private buildFormationGuideProgressGetCandidates(formationId: number): string[] {
    const userId = this.getCurrentUserIdOrNull();
    const userQuery = userId ? `?userId=${userId}` : '';
    return [
      `${this.formationsApiUrl}/${formationId}/guide/progress${userQuery}`,
      `${this.formationsApiUrl}/${formationId}/guide/progress`,
      `${this.apiUrl}/formations/${formationId}/progress${userQuery}`,
      `${this.apiUrl}/formations/${formationId}/progress`,
      `${this.apiUrl}/formation/${formationId}/progress${userQuery}`,
      `${this.apiUrl}/formation/${formationId}/progress`,
      `${this.apiUrl}/progress?formationId=${formationId}`,
      `${this.apiUrl}/progress/${formationId}`
    ];
  }

  private buildFormationGuideProgressSaveCandidates(
    formationId: number,
    progress: FormationGuideProgressState,
    completedStepOrder?: number
  ): Array<{ method: 'POST' | 'PUT'; url: string; body: unknown }> {
    const resolvedGuideId = this.toPositiveNumber(progress.guideId) ?? formationId;
    const resolvedUserId = this.toPositiveNumber(progress.userId) ?? this.getCurrentUserIdOrNull();
    const completedAt = progress.completedAt || new Date().toISOString();
    const stepId = this.toPositiveNumber(completedStepOrder)
      ?? this.toPositiveNumber(progress.completedStepOrders[progress.completedStepOrders.length - 1])
      ?? Math.max(1, progress.activeStepOrder);
    const payload = {
      userId: resolvedUserId ?? undefined,
      formationId,
      guideId: resolvedGuideId,
      stepId,
      completed: true,
      completedAt,
      activeStep: progress.activeStepOrder,
      completedStepIds: progress.completedStepOrders,
      completedStepOrders: progress.completedStepOrders,
      progressPercent: progress.progressPercent
    };

    const candidates: Array<{ method: 'POST' | 'PUT'; url: string; body: unknown }> = [
      {
        method: 'POST',
        url: `${this.formationsApiUrl}/${formationId}/guide/steps/${progress.activeStepOrder}/complete`,
        body: payload
      },
      { method: 'POST', url: `${this.formationsApiUrl}/${formationId}/guide/progress`, body: payload },
      { method: 'POST', url: `${this.apiUrl}/formations/${formationId}/progress`, body: payload },
      { method: 'PUT', url: `${this.apiUrl}/formations/${formationId}/progress`, body: payload },
      { method: 'POST', url: `${this.apiUrl}/progress`, body: payload }
    ];

    if (progress.backendProgressId) {
      candidates.unshift({
        method: 'PUT',
        url: `${this.apiUrl}/progress/${progress.backendProgressId}`,
        body: payload
      });
    }

    return candidates;
  }

  private parseFormationGuideStepsResponse(response: unknown, formationId: number): FormationGuideStep[] {
    const directArray = Array.isArray(response) ? response : null;
    const record = this.asRecord(response);
    const candidateArrays = [
      directArray,
      Array.isArray(record?.['steps']) ? record?.['steps'] : null,
      Array.isArray(record?.['content']) ? record?.['content'] : null,
      Array.isArray(record?.['items']) ? record?.['items'] : null,
      Array.isArray(record?.['guideSteps']) ? record?.['guideSteps'] : null,
      Array.isArray(record?.['data']) ? record?.['data'] : null
    ];

    for (const candidate of candidateArrays) {
      if (!candidate) {
        continue;
      }
      const parsed = this.parseFormationGuideStepArray(candidate, formationId);
      if (parsed.length > 0) {
        return parsed;
      }
    }

    if (record) {
      const parsedSingle = this.parseFormationGuideStepEntry(record, formationId, 0);
      if (parsedSingle) {
        return [parsedSingle];
      }
    }

    return [];
  }

  private parseFormationGuideStepArray(rawSteps: unknown[], formationId: number): FormationGuideStep[] {
    return rawSteps
      .map((entry, index) => this.parseFormationGuideStepEntry(entry, formationId, index))
      .filter((entry): entry is FormationGuideStep => entry !== null)
      .sort((first, second) => first.order - second.order);
  }

  private parseFormationGuideStepEntry(
    value: unknown,
    formationId: number,
    index: number
  ): FormationGuideStep | null {
    const record = this.asRecord(value);
    if (!record) {
      return null;
    }

    const parsedOrder = this.toPositiveNumber(
      record['order']
      ?? record['stepOrder']
      ?? record['displayOrder']
      ?? record['ordre']
      ?? record['position']
    );
    const order = parsedOrder && parsedOrder > 0 ? parsedOrder : (index + 1);

    const title = this.toText(record['title'] || record['titre'] || record['stepTitle']);
    const description = this.toText(record['description'] || record['content'] || record['contenu'] || record['stepDescription']);
    const mediaType = this.toText(record['mediaType']).toUpperCase();
    const mediaUrl = this.toText(record['mediaUrl'] || record['url']);

    const imageUrl = this.normalizeGuideImageUrl(
      this.toText(record['imageUrl'] || record['image'] || record['photoUrl'])
      || (mediaType === 'IMAGE' ? mediaUrl : '')
    );

    const videoUrl = this.normalizeGuideVideoUrl(
      this.toText(record['videoUrl'] || record['video'] || record['videoLink'])
      || (mediaType === 'VIDEO' ? mediaUrl : '')
    );

    if (!title && !description) {
      return null;
    }

    return {
      id: this.toText(record['id'] || record['stepId']) || `${formationId}-${order}`,
      formationId,
      order,
      title: title || `Etape ${order}`,
      description: description || '',
      imageUrl: imageUrl || undefined,
      videoUrl: videoUrl || undefined
    };
  }

  private parseFormationGuideProgressResponse(
    response: unknown,
    formationId: number,
    totalSteps: number
  ): FormationGuideProgressState | null {
    const record = this.asRecord(response);
    if (!record) {
      return null;
    }

    const parsedActiveStepOrder = this.toPositiveNumber(
      record['activeStep']
      ?? record['activeStepOrder']
      ?? record['currentStep']
      ?? record['stepCourante']
    );
    const completedStepOrders = this.toNumberArray(
      record['completedStepOrders']
      ?? record['completedStepIds']
      ?? record['completedSteps']
      ?? record['etapesTerminees']
    );
    const progressPercent = this.toPositiveNumber(record['progressPercent']);

    if (parsedActiveStepOrder === null && !completedStepOrders && progressPercent === null) {
      return null;
    }

    const resolvedGuideId = this.toPositiveNumber(
      record['guideId']
      ?? record['interactiveGuideId']
      ?? record['guideInteractifId']
      ?? record['formationGuideId']
    ) ?? formationId;

    const resolvedUserId = this.toPositiveNumber(
      record['userId']
      ?? record['utilisateurId']
      ?? record['createdById']
    ) ?? this.getCurrentUserIdOrNull();

    return this.normalizeFormationGuideProgress({
      formationId,
      guideId: resolvedGuideId,
      userId: resolvedUserId ?? undefined,
      activeStepOrder: parsedActiveStepOrder && parsedActiveStepOrder > 0 ? parsedActiveStepOrder : 1,
      completedStepOrders: completedStepOrders ?? [],
      progressPercent: progressPercent ?? 0,
      completedAt: this.toText(record['completedAt'] || record['updatedAt']) || undefined,
      backendProgressId: this.toPositiveNumber(record['progressId'] ?? record['id']) ?? undefined
    }, formationId, totalSteps, resolvedGuideId);
  }

  private normalizeFormationGuideStepsInput(
    formationId: number,
    steps: FormationGuideStep[]
  ): FormationGuideStep[] {
    const normalizedSteps: FormationGuideStep[] = [];

    steps.forEach((step, index) => {
      const title = this.toText(step.title);
      const description = this.toText(step.description);
      const imageUrl = this.normalizeGuideImageUrl(this.toText(step.imageUrl));
      const videoUrl = this.normalizeGuideVideoUrl(this.toText(step.videoUrl));
      const parsedOrder = this.toPositiveNumber(step.order);
      const order = parsedOrder && parsedOrder > 0 ? parsedOrder : (index + 1);

      if (!title && !description) {
        return;
      }

      normalizedSteps.push({
        id: this.toText(step.id) || `${formationId}-${order}`,
        formationId,
        order,
        title: title || `Etape ${order}`,
        description: description || '',
        imageUrl: imageUrl || undefined,
        videoUrl: videoUrl || undefined
      });
    });

    return normalizedSteps
      .sort((first, second) => first.order - second.order)
      .map((step, index): FormationGuideStep => ({
        id: this.toText(step.id) || `${formationId}-${index + 1}`,
        formationId,
        order: index + 1,
        title: this.toText(step.title) || `Etape ${index + 1}`,
        description: this.toText(step.description),
        imageUrl: this.normalizeGuideImageUrl(this.toText(step.imageUrl)) || undefined,
        videoUrl: this.normalizeGuideVideoUrl(this.toText(step.videoUrl)) || undefined
      }));
  }

  private computeNextFormationGuideProgress(
    formationId: number,
    stepOrder: number,
    totalSteps: number
  ): FormationGuideProgressState {
    const safeTotalSteps = Math.max(1, totalSteps);
    const boundedStepOrder = Math.min(safeTotalSteps, Math.max(1, stepOrder));
    const current = this.getFormationGuideProgressState(formationId, safeTotalSteps);
    const completedSet = new Set(current.completedStepOrders);
    completedSet.add(boundedStepOrder);

    const completedStepOrders = Array.from(completedSet)
      .filter((order) => order >= 1 && order <= safeTotalSteps)
      .sort((first, second) => first - second);
    const progressPercent = Math.round((completedStepOrders.length / safeTotalSteps) * 100);
    const nextActive = completedStepOrders.length >= safeTotalSteps
      ? safeTotalSteps
      : Math.min(safeTotalSteps, boundedStepOrder + 1);

    return {
      formationId,
      guideId: current.guideId ?? formationId,
      userId: current.userId ?? this.getCurrentUserIdOrNull() ?? undefined,
      activeStepOrder: nextActive,
      completedStepOrders,
      progressPercent,
      completedAt: new Date().toISOString(),
      backendProgressId: current.backendProgressId
    };
  }

  private buildDefaultFormationGuideProgress(
    formationId: number,
    totalSteps: number,
    guideId?: number
  ): FormationGuideProgressState {
    const safeTotalSteps = Math.max(1, totalSteps);
    const resolvedGuideId = guideId && guideId > 0 ? guideId : formationId;
    const savedPercent = this.getFormationProgressPercent(formationId, resolvedGuideId);
    return {
      formationId,
      guideId: resolvedGuideId,
      userId: this.getCurrentUserIdOrNull() ?? undefined,
      activeStepOrder: 1,
      completedStepOrders: [],
      progressPercent: Math.max(0, Math.min(100, savedPercent)),
      completedAt: undefined,
      backendProgressId: undefined
    };
  }

  private normalizeFormationGuideProgress(
    progress: FormationGuideProgressState,
    formationId: number,
    totalSteps: number,
    guideId?: number
  ): FormationGuideProgressState {
    const safeTotalSteps = Math.max(1, totalSteps);
    const completedSet = new Set(
      progress.completedStepOrders
        .map((order) => this.toPositiveNumber(order))
        .filter((order): order is number => order !== null && order >= 1 && order <= safeTotalSteps)
    );
    const completedStepOrders = Array.from(completedSet).sort((first, second) => first - second);
    const computedPercent = Math.round((completedStepOrders.length / safeTotalSteps) * 100);
    const providedPercent = this.toPositiveNumber(progress.progressPercent);
    const boundedPercent = Math.max(
      computedPercent,
      Math.min(100, providedPercent ?? computedPercent)
    );
    const parsedActiveStepOrder = this.toPositiveNumber(progress.activeStepOrder);
    const activeStepOrder = parsedActiveStepOrder && parsedActiveStepOrder > 0 ? parsedActiveStepOrder : 1;
    const resolvedGuideId = this.toPositiveNumber(progress.guideId) ?? guideId ?? formationId;
    const resolvedUserId = this.toPositiveNumber(progress.userId) ?? this.getCurrentUserIdOrNull() ?? undefined;

    return {
      formationId,
      guideId: resolvedGuideId,
      userId: resolvedUserId,
      activeStepOrder: Math.min(safeTotalSteps, Math.max(1, activeStepOrder)),
      completedStepOrders,
      progressPercent: boundedPercent,
      completedAt: this.toText(progress.completedAt) || undefined,
      backendProgressId: this.toPositiveNumber(progress.backendProgressId) ?? undefined
    };
  }

  private getLocalFormationGuideSteps(formationId: number): FormationGuideStep[] {
    const stored = this.formationGuideStepsById[String(formationId)] ?? [];
    return this.normalizeFormationGuideStepsInput(formationId, stored);
  }

  private upsertLocalFormationGuideSteps(formationId: number, steps: FormationGuideStep[]): void {
    this.formationGuideStepsById[String(formationId)] = this.normalizeFormationGuideStepsInput(formationId, steps);
    this.persistFormationGuideStepsById();
  }

  private upsertLocalFormationGuideProgress(formationId: number, progress: FormationGuideProgressState): void {
    const resolvedGuideId = this.toPositiveNumber(progress.guideId) ?? formationId;
    const normalized = this.normalizeFormationGuideProgress(
      progress,
      formationId,
      Math.max(1, progress.completedStepOrders.length || progress.activeStepOrder || 1),
      resolvedGuideId
    );
    const scopedKey = this.buildProgressScopeKey(formationId, resolvedGuideId, normalized.userId);
    this.formationGuideProgressById[scopedKey] = normalized;
    this.removeLegacyFormationGuideProgress(formationId);
    this.persistFormationGuideProgressById();
  }

  private normalizeGuideImageUrl(rawUrl: string): string {
    const cleaned = rawUrl.trim();
    if (!cleaned) {
      return '';
    }

    if (cleaned.startsWith('data:image/')) {
      return cleaned;
    }

    if (/^https?:\/\//i.test(cleaned)) {
      return cleaned;
    }

    return this.resolveBackendMediaUrl(cleaned);
  }

  private normalizeGuideVideoUrl(rawUrl: string): string {
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

    return this.resolveBackendMediaUrl(cleaned);
  }

  private normalizeMediaUrlByType(rawUrl: string, type: GuideMediaType): string {
    return type === 'VIDEO'
      ? this.normalizeGuideVideoUrl(rawUrl)
      : this.normalizeGuideImageUrl(rawUrl);
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

  private resolveBackendMediaUrl(rawUrl: string): string {
    const cleaned = rawUrl.trim();
    if (!cleaned) {
      return '';
    }

    try {
      const origin = new URL(this.formationsApiUrl).origin;
      if (cleaned.startsWith('/')) {
        return `${origin}${cleaned}`;
      }
      return `${origin}/${cleaned.replace(/^\/+/, '')}`;
    } catch {
      return '';
    }
  }

  private setProgress(page: GuidePageKey, nextState: GuideProgressState, syncBackend: boolean): void {
    this.progress = {
      ...this.progress,
      [page]: {
        ...nextState,
        page,
        updatedAt: new Date().toISOString()
      }
    };
    this.progressSubject.next(this.progress);
    this.persistProgress();

    if (syncBackend) {
      this.syncProgressToBackend(this.progress[page]);
    }
  }

  private mergeGuideWithDefault(page: GuidePageKey, remoteGuide: GuideDefinition): GuideDefinition {
    if (!remoteGuide || !Array.isArray(remoteGuide.steps) || remoteGuide.steps.length === 0) {
      return this.defaults[page];
    }

    return {
      page,
      title: remoteGuide.title || this.defaults[page].title,
      steps: remoteGuide.steps.map((step, index) => this.normalizeGuideStep(step, index))
    };
  }

  private normalizeGuideStep(step: GuideStep, index: number): GuideStep {
    const normalizedChecklist = Array.isArray(step.checklist)
      ? step.checklist
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => item.trim())
      : undefined;

    return {
      id: Number(step.id || index + 1),
      title: (step.title || `Etape ${index + 1}`).trim(),
      description: (step.description || '').trim(),
      actionHint: (step.actionHint || '').trim(),
      actionKey: typeof step.actionKey === 'string' ? step.actionKey.trim() : undefined,
      mediaType: step.mediaType === 'VIDEO' ? 'VIDEO' : step.mediaType === 'IMAGE' ? 'IMAGE' : undefined,
      mediaUrl: typeof step.mediaUrl === 'string' && step.mediaUrl.trim().length > 0 ? step.mediaUrl.trim() : undefined,
      tutorial: typeof step.tutorial === 'string' && step.tutorial.trim().length > 0 ? step.tutorial.trim() : undefined,
      checklist: normalizedChecklist && normalizedChecklist.length > 0 ? normalizedChecklist : undefined
    };
  }

  private syncProgressToBackend(progress: GuideProgressState): void {
    const payload: GuideProgressPayload = {
      page: progress.page,
      activeStep: progress.activeStep,
      completedStepIds: progress.completedStepIds,
      closed: progress.closed
    };

    if (progress.backendProgressId) {
      this.http.put<unknown>(`${this.apiUrl}/progress/${progress.backendProgressId}`, payload).subscribe({
        next: (response) => this.applyBackendProgressResponse(progress.page, response, progress.backendProgressId),
        error: () => undefined
      });
      return;
    }

    this.http.post<unknown>(`${this.apiUrl}/progress`, payload).subscribe({
      next: (response) => {
        this.applyBackendProgressResponse(progress.page, response);
      },
      error: () => undefined
    });
  }

  private buildDefaultProgress(page: GuidePageKey): GuideProgressState {
    return {
      page,
      activeStep: 1,
      completedStepIds: [],
      closed: false,
      updatedAt: new Date().toISOString()
    };
  }

  private loadProgressFromStorage(): Record<GuidePageKey, GuideProgressState> {
    const fallback = {
      'formation-list': this.buildDefaultProgress('formation-list'),
      'formation-create': this.buildDefaultProgress('formation-create'),
      'formation-detail': this.buildDefaultProgress('formation-detail'),
      'formation-edit': this.buildDefaultProgress('formation-edit')
    } satisfies Record<GuidePageKey, GuideProgressState>;

    const rawData = localStorage.getItem(this.storageKey);
    if (!rawData) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(rawData) as Partial<Record<GuidePageKey, GuideProgressState>>;
      const next = { ...fallback };

      (Object.keys(fallback) as GuidePageKey[]).forEach((page) => {
        const candidate = parsed[page];
        if (!candidate) {
          return;
        }

        next[page] = {
          page,
          activeStep: Number(candidate.activeStep) > 0 ? Number(candidate.activeStep) : 1,
          completedStepIds: Array.isArray(candidate.completedStepIds)
            ? candidate.completedStepIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
            : [],
          closed: Boolean(candidate.closed),
          updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date().toISOString(),
          backendProgressId: Number(candidate.backendProgressId) > 0 ? Number(candidate.backendProgressId) : undefined
        };
      });

      return next;
    } catch {
      return fallback;
    }
  }

  private persistProgress(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
  }

  private loadRewardStateFromStorage(): GuideRewardState {
    const fallback: GuideRewardState = {
      badgeExpertFormationUnlocked: false,
      templateUnlocked: false,
      totalPoints: 0,
      rewardedPages: [],
      lastUnlockedAt: '',
      badgeName: 'Explorateur du camping',
      lastAwardedPoints: 0,
      rewardSource: 'local'
    };

    const rawData = localStorage.getItem(this.rewardStorageKey);
    if (!rawData) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(rawData) as Partial<GuideRewardState>;
      const rewardedPages = Array.isArray(parsed.rewardedPages)
        ? parsed.rewardedPages.filter((page): page is GuidePageKey => this.isGuidePageKey(page))
        : [];

      return {
        badgeExpertFormationUnlocked: Boolean(parsed.badgeExpertFormationUnlocked),
        templateUnlocked: Boolean(parsed.templateUnlocked),
        totalPoints: Number.isFinite(Number(parsed.totalPoints)) ? Math.max(0, Number(parsed.totalPoints)) : 0,
        rewardedPages,
        lastUnlockedAt: typeof parsed.lastUnlockedAt === 'string' ? parsed.lastUnlockedAt : '',
        badgeName: typeof parsed.badgeName === 'string' && parsed.badgeName.trim()
          ? parsed.badgeName.trim()
          : 'Explorateur du camping',
        lastAwardedPoints: Number.isFinite(Number(parsed.lastAwardedPoints))
          ? Math.max(0, Number(parsed.lastAwardedPoints))
          : 0,
        rewardSource: parsed.rewardSource === 'backend' ? 'backend' : 'local'
      };
    } catch {
      return fallback;
    }
  }

  private setRewardState(state: GuideRewardState): void {
    this.rewardStateSubject.next(state);
    localStorage.setItem(this.rewardStorageKey, JSON.stringify(state));
  }

  private normalizeTemplate(template: GuideRewardTemplate): GuideRewardTemplate {
    const safeQuiz = Array.isArray(template.quiz)
      ? template.quiz.map((item) => ({
        question: typeof item.question === 'string' ? item.question.trim() : '',
        choices: Array.isArray(item.choices) ? item.choices.filter((choice) => typeof choice === 'string') : [],
        correctAnswer: typeof item.correctAnswer === 'string' ? item.correctAnswer.trim() : ''
      })).filter((item) => item.question && item.choices.length > 0 && item.correctAnswer)
      : [];

    return {
      title: typeof template.title === 'string' ? template.title.trim() : '',
      description: typeof template.description === 'string' ? template.description.trim() : '',
      objectives: Array.isArray(template.objectives)
        ? template.objectives.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
        : [],
      content: typeof template.content === 'string' ? template.content.trim() : '',
      summary: typeof template.summary === 'string' ? template.summary.trim() : '',
      level: template.level === 'ADVANCED' || template.level === 'INTERMEDIATE' ? template.level : 'BEGINNER',
      estimatedDuration: typeof template.estimatedDuration === 'string' ? template.estimatedDuration.trim() : '',
      quiz: safeQuiz
    };
  }

  private loadMediaLinksFromStorage(): Record<GuidePageKey, GuideMediaLink[]> {
    const fallback: Record<GuidePageKey, GuideMediaLink[]> = {
      'formation-list': [],
      'formation-create': [],
      'formation-detail': [],
      'formation-edit': []
    };

    const rawData = localStorage.getItem(this.mediaStorageKey);
    if (!rawData) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(rawData) as Partial<Record<GuidePageKey, GuideMediaLink[]>>;
      const result = { ...fallback };

      (Object.keys(fallback) as GuidePageKey[]).forEach((page) => {
        const pageLinks = parsed[page];
        if (!Array.isArray(pageLinks)) {
          return;
        }

        result[page] = pageLinks
          .map((item) => this.normalizeMediaLink(item, page))
          .filter((item): item is GuideMediaLink => !!item);
      });

      return result;
    } catch {
      return fallback;
    }
  }

  private normalizeMediaLink(value: unknown, page: GuidePageKey): GuideMediaLink | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const candidate = value as Partial<GuideMediaLink>;
    const type: GuideMediaType = candidate.type === 'VIDEO' ? 'VIDEO' : 'IMAGE';
    const rawUrl = typeof candidate.url === 'string' ? candidate.url.trim() : '';
    const url = this.normalizeMediaUrlByType(rawUrl, type);
    if (!url || !this.isValidMediaUrl(url)) {
      return null;
    }

    const label = typeof candidate.label === 'string' ? candidate.label.trim() : '';

    return {
      id: typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id.trim() : this.buildMediaLinkId(),
      page,
      stepId: this.toPositiveNumber(candidate.stepId) ?? undefined,
      type,
      url,
      label: label || this.buildDefaultMediaLabel(type, url),
      createdAt: typeof candidate.createdAt === 'string' && candidate.createdAt.trim()
        ? candidate.createdAt
        : new Date().toISOString()
    };
  }

  private persistMediaLinks(): void {
    localStorage.setItem(this.mediaStorageKey, JSON.stringify(this.mediaLinks));
  }

  private loadFormationProgressByIdFromStorage(): Record<string, number> {
    const rawData = localStorage.getItem(this.formationProgressStorageKey);
    if (!rawData) {
      return {};
    }

    try {
      const parsed = JSON.parse(rawData) as Record<string, unknown>;
      const output: Record<string, number> = {};

      Object.entries(parsed).forEach(([key, value]) => {
        const normalizedKey = this.normalizeScopedStorageKey(key);
        if (!normalizedKey) {
          return;
        }
        const numericValue = this.toPositiveNumber(value);
        if (numericValue === null) {
          return;
        }
        output[normalizedKey] = Math.max(0, Math.min(100, numericValue));
      });

      return output;
    } catch {
      return {};
    }
  }

  private persistFormationProgressById(): void {
    localStorage.setItem(this.formationProgressStorageKey, JSON.stringify(this.formationProgressById));
  }

  private loadFormationGuideStepsFromStorage(): Record<string, FormationGuideStep[]> {
    const rawData = localStorage.getItem(this.formationGuideStepsStorageKey);
    if (!rawData) {
      return {};
    }

    try {
      const parsed = JSON.parse(rawData) as Record<string, unknown>;
      const output: Record<string, FormationGuideStep[]> = {};

      Object.entries(parsed).forEach(([formationId, stepsValue]) => {
        if (!Array.isArray(stepsValue)) {
          return;
        }
        const numericFormationId = this.toPositiveNumber(formationId);
        if (!numericFormationId) {
          return;
        }
        output[String(numericFormationId)] = this.normalizeFormationGuideStepsInput(
          numericFormationId,
          stepsValue as FormationGuideStep[]
        );
      });

      return output;
    } catch {
      return {};
    }
  }

  private persistFormationGuideStepsById(): void {
    localStorage.setItem(this.formationGuideStepsStorageKey, JSON.stringify(this.formationGuideStepsById));
  }

  private loadFormationGuideProgressFromStorage(): Record<string, FormationGuideProgressState> {
    const rawData = localStorage.getItem(this.formationGuideProgressStorageKey);
    if (!rawData) {
      return {};
    }

    try {
      const parsed = JSON.parse(rawData) as Record<string, unknown>;
      const output: Record<string, FormationGuideProgressState> = {};

      Object.entries(parsed).forEach(([storageKey, value]) => {
        const normalizedKey = this.normalizeScopedStorageKey(storageKey);
        if (!normalizedKey) {
          return;
        }

        const numericFormationId = this.extractFormationIdFromStorageKey(normalizedKey)
          ?? this.toPositiveNumber(storageKey);
        const record = this.asRecord(value);
        if (!numericFormationId || !record) {
          return;
        }

        const guideId = this.extractGuideIdFromStorageKey(normalizedKey)
          ?? this.toPositiveNumber(record['guideId'])
          ?? numericFormationId;
        const userId = this.extractUserIdFromStorageKey(normalizedKey)
          ?? this.toPositiveNumber(record['userId'])
          ?? undefined;

        output[normalizedKey] = this.normalizeFormationGuideProgress({
          formationId: numericFormationId,
          guideId,
          userId,
          activeStepOrder: this.toPositiveNumber(record['activeStepOrder']) ?? 1,
          completedStepOrders: this.toNumberArray(record['completedStepOrders']) ?? [],
          progressPercent: this.toPositiveNumber(record['progressPercent']) ?? 0,
          completedAt: this.toText(record['completedAt'] || record['updatedAt']) || undefined,
          backendProgressId: this.toPositiveNumber(record['backendProgressId']) ?? undefined
        }, numericFormationId, 100, guideId);
      });

      return output;
    } catch {
      return {};
    }
  }

  private persistFormationGuideProgressById(): void {
    localStorage.setItem(this.formationGuideProgressStorageKey, JSON.stringify(this.formationGuideProgressById));
  }

  private buildProgressScopeKey(formationId: number, guideId?: number, userId?: number): string {
    const safeFormationId = Math.max(1, Math.floor(formationId));
    const safeGuideId = this.toPositiveNumber(guideId) ?? safeFormationId;
    const userScope = this.resolveUserScope(userId);
    return `${this.scopedProgressKeyPrefix}${userScope}|f:${safeFormationId}|g:${safeGuideId}`;
  }

  private resolveUserScope(userId?: number): string {
    const resolvedUserId = this.toPositiveNumber(userId) ?? this.getCurrentUserIdOrNull();
    if (resolvedUserId && resolvedUserId > 0) {
      return `u:${resolvedUserId}`;
    }

    const email = this.authService.getUserEmail().trim().toLowerCase();
    if (email) {
      return `e:${email}`;
    }

    return 'anon';
  }

  private hasStableUserScope(): boolean {
    return this.resolveUserScope() !== 'anon';
  }

  private getCurrentUserIdOrNull(): number | null {
    const userId = this.authService.getUserId();
    return Number.isFinite(userId) && userId > 0 ? userId : null;
  }

  private normalizeScopedStorageKey(rawKey: string): string | null {
    const cleanedKey = this.toText(rawKey);
    if (!cleanedKey) {
      return null;
    }

    if (cleanedKey.startsWith(this.scopedProgressKeyPrefix)) {
      return cleanedKey;
    }

    const numericFormationId = this.toPositiveNumber(cleanedKey);
    if (!numericFormationId) {
      return null;
    }

    return String(numericFormationId);
  }

  private extractFormationIdFromStorageKey(storageKey: string): number | null {
    const match = storageKey.match(/\|f:(\d+)\|/i);
    if (!match?.[1]) {
      return null;
    }
    return this.toPositiveNumber(match[1]);
  }

  private extractGuideIdFromStorageKey(storageKey: string): number | null {
    const match = storageKey.match(/\|g:(\d+)$/i);
    if (!match?.[1]) {
      return null;
    }
    return this.toPositiveNumber(match[1]);
  }

  private extractUserIdFromStorageKey(storageKey: string): number | null {
    const match = storageKey.match(/^scope:u:(\d+)\|/i);
    if (!match?.[1]) {
      return null;
    }
    return this.toPositiveNumber(match[1]);
  }

  private getLegacyFormationProgressPercent(formationId: number): number | undefined {
    if (this.hasStableUserScope()) {
      return undefined;
    }

    const legacyKey = String(formationId);
    const storedValue = this.formationProgressById[legacyKey];
    if (!Number.isFinite(storedValue)) {
      return undefined;
    }
    return Math.max(0, Math.min(100, Math.round(storedValue)));
  }

  private findScopedFormationProgressPercent(formationId: number): number | undefined {
    const userScope = this.resolveUserScope();
    if (!userScope || userScope === 'anon') {
      return undefined;
    }

    const prefix = `${this.scopedProgressKeyPrefix}${userScope}|f:${Math.floor(formationId)}|g:`;
    const values = Object.entries(this.formationProgressById)
      .filter(([key]) => key.startsWith(prefix))
      .map(([, value]) => value)
      .filter((value) => Number.isFinite(value));

    if (values.length === 0) {
      return undefined;
    }

    return Math.max(...values.map((value) => Math.max(0, Math.min(100, Math.round(value)))));
  }

  private getLegacyFormationGuideProgressState(formationId: number): FormationGuideProgressState | null {
    if (this.hasStableUserScope()) {
      return null;
    }

    const legacyKey = String(formationId);
    const stored = this.formationGuideProgressById[legacyKey];
    if (!stored) {
      return null;
    }
    return stored;
  }

  private findScopedFormationGuideProgress(formationId: number): FormationGuideProgressState | null {
    const userScope = this.resolveUserScope();
    if (!userScope || userScope === 'anon') {
      return null;
    }

    const prefix = `${this.scopedProgressKeyPrefix}${userScope}|f:${Math.floor(formationId)}|g:`;
    const matches = Object.entries(this.formationGuideProgressById)
      .filter(([key]) => key.startsWith(prefix))
      .map(([, value]) => value);

    if (matches.length === 0) {
      return null;
    }

    return matches.reduce((best, current) => {
      if (!best) {
        return current;
      }
      return current.progressPercent > best.progressPercent ? current : best;
    }, null as FormationGuideProgressState | null);
  }

  private removeLegacyFormationGuideProgress(formationId: number): void {
    const legacyKey = String(formationId);
    if (this.formationGuideProgressById[legacyKey]) {
      delete this.formationGuideProgressById[legacyKey];
    }
  }

  private isValidMediaUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private buildMediaLinkId(): string {
    return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  }

  private buildDefaultMediaLabel(type: GuideMediaType, urlValue: string): string {
    try {
      const parsedUrl = new URL(urlValue);
      const pathName = parsedUrl.pathname.split('/').filter(Boolean).pop() || parsedUrl.hostname;
      return `${type === 'VIDEO' ? 'Video' : 'Image'}: ${decodeURIComponent(pathName)}`;
    } catch {
      return type === 'VIDEO' ? 'Video explicative' : 'Image explicative';
    }
  }

  private refreshProgressFromBackend(page: GuidePageKey): void {
    const endpoints = [
      `${this.apiUrl}/progress`,
      `${this.apiUrl}/progress/${page}`,
      `${this.apiUrl}/${page}/progress`
    ];

    this.fetchProgressFromCandidates(endpoints, page, 0);
  }

  private fetchProgressFromCandidates(endpoints: string[], page: GuidePageKey, index: number): void {
    const endpoint = endpoints[index];
    if (!endpoint) {
      return;
    }

    const request = endpoint.endsWith('/progress')
      ? this.http.get<unknown>(endpoint, { params: { page } })
      : this.http.get<unknown>(endpoint);

    request.subscribe({
      next: (response) => {
        const normalized = this.parseBackendProgressPayload(response, page);
        if (normalized) {
          this.setProgress(page, normalized, false);
          this.updateRewardFromBackend(response, page);
        }
      },
      error: () => {
        if (index < endpoints.length - 1) {
          this.fetchProgressFromCandidates(endpoints, page, index + 1);
        }
      }
    });
  }

  private applyBackendProgressResponse(page: GuidePageKey, response: unknown, knownId?: number): void {
    const normalized = this.parseBackendProgressPayload(response, page, knownId);
    if (normalized) {
      this.setProgress(page, normalized, false);
    } else if (knownId) {
      const current = this.getProgressState(page);
      this.setProgress(page, { ...current, backendProgressId: knownId }, false);
    } else {
      const createdId = this.readBackendProgressId(response);
      if (createdId) {
        const current = this.getProgressState(page);
        this.setProgress(page, { ...current, backendProgressId: createdId }, false);
      }
    }

    this.updateRewardFromBackend(response, page);
  }

  private parseBackendProgressPayload(
    response: unknown,
    page: GuidePageKey,
    knownId?: number
  ): GuideProgressState | null {
    const record = this.asRecord(response);
    if (!record) {
      return null;
    }

    const activeStep = this.toPositiveNumber(record['activeStep'])
      ?? this.toPositiveNumber(record['currentStep'])
      ?? this.toPositiveNumber(record['stepCourante'])
      ?? this.toPositiveNumber(record['lastCompletedStep']);
    const completedStepIds = this.toNumberArray(record['completedStepIds'])
      ?? this.toNumberArray(record['completedSteps'])
      ?? this.toNumberArray(record['etapesTerminees']);

    if (activeStep === null && !completedStepIds) {
      return null;
    }

    return {
      page,
      activeStep: activeStep ?? 1,
      completedStepIds: completedStepIds ?? [],
      closed: Boolean(record['closed']),
      updatedAt: typeof record['updatedAt'] === 'string' ? record['updatedAt'] : new Date().toISOString(),
      backendProgressId: knownId ?? this.readBackendProgressId(response) ?? undefined
    };
  }

  private updateRewardFromBackend(response: unknown, page: GuidePageKey): void {
    const record = this.asRecord(response);
    if (!record) {
      return;
    }

    const explicitBadge = this.toText(record['badge'])
      || this.toText(record['badgeName'])
      || this.toText(record['badgeLabel']);
    const totalPoints = this.toPositiveNumber(record['totalPoints']);
    const awardedPoints = this.toPositiveNumber(record['awardedPoints'])
      ?? this.toPositiveNumber(record['pointsAwarded']);
    const progressPercent = this.toPositiveNumber(record['progressPercent']);

    const shouldUnlock = Boolean(record['rewardUnlocked'])
      || Boolean(record['rewardClaimed'])
      || Boolean(record['badgeUnlocked'])
      || (progressPercent !== null && progressPercent >= 100)
      || (explicitBadge && explicitBadge.length > 0);

    if (!shouldUnlock && totalPoints === null && awardedPoints === null) {
      return;
    }

    const current = this.getRewardState();
    const rewardedPages = new Set(current.rewardedPages);
    rewardedPages.add(page);

    const nextState: GuideRewardState = {
      badgeExpertFormationUnlocked: shouldUnlock || current.badgeExpertFormationUnlocked,
      templateUnlocked: shouldUnlock || current.templateUnlocked,
      totalPoints: totalPoints ?? current.totalPoints,
      rewardedPages: Array.from(rewardedPages),
      lastUnlockedAt: shouldUnlock ? new Date().toISOString() : current.lastUnlockedAt,
      badgeName: explicitBadge || current.badgeName || 'Explorateur du camping',
      lastAwardedPoints: awardedPoints ?? current.lastAwardedPoints ?? 0,
      rewardSource: 'backend'
    };

    this.setRewardState(nextState);
  }

  private readBackendProgressId(response: unknown): number | null {
    const record = this.asRecord(response);
    if (!record) {
      return null;
    }
    return this.toPositiveNumber(record['id']) ?? this.toPositiveNumber(record['progressId']);
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

  private toNumberArray(value: unknown): number[] | null {
    if (!Array.isArray(value)) {
      return null;
    }

    const parsed = value
      .map((item) => this.toPositiveNumber(item))
      .filter((item): item is number => item !== null && item > 0);

    return parsed;
  }

  private toText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }
}
