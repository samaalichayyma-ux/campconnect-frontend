import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { AuthService } from '../../../../core/services/auth.service';
import { GuideInteractifService } from '../../guide-interactif/services/guide-interactif.service';
import {
  FormationLevel,
  FormationListQuery,
  FormationStatus,
  FormationSummaryDto
} from '../models/formation.model';
import { FormationConsultationService } from '../services/formation-consultation.service';
import { FormationLikeService } from '../services/formation-like.service';
import { FormationMediaService } from '../services/formation-media.service';
import { FormationService } from '../services/formation.service';

interface FormationCardMediaFlags {
  hasImage: boolean;
  hasVideo: boolean;
  coverImageUrl?: string;
}

type FormationSidebarCategory =
  | 'ALL'
  | 'CAMPING_BEGINNER'
  | 'SAFETY'
  | 'SURVIVAL'
  | 'TENT_SETUP'
  | 'CAMPING_COOKING';

type AdvancedFilterKey = 'withVideo' | 'withGuide' | 'withQuiz' | 'popularOnly';

interface AdvancedFilterState {
  withVideo: boolean;
  withGuide: boolean;
  withQuiz: boolean;
  popularOnly: boolean;
}

interface SidebarCategoryOption {
  value: FormationSidebarCategory;
  label: string;
  icon: string;
}

interface SidebarAdvancedFilterOption {
  key: AdvancedFilterKey;
  label: string;
  icon: string;
}

type FormationCoverTheme = 'tent' | 'safety' | 'cooking' | 'survival' | 'gear' | 'planning' | 'general';

@Component({
  selector: 'app-formation-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AdminIconComponent],
  templateUrl: './formation-list.component.html',
  styleUrl: './formation-list.component.css'
})
export class FormationListComponent implements OnInit, OnDestroy {
  formations: FormationSummaryDto[] = [];
  visibleFormations: FormationSummaryDto[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  page = 0;
  readonly pageSize = 9;
  totalElements = 0;

  search = '';
  selectedLevel: FormationLevel | '' = '';
  selectedStatus: FormationStatus | '' = '';
  showLikedOnly = false;
  canManage = false;
  canSeeStats = false;
  selectedCategory: FormationSidebarCategory = 'ALL';
  advancedFilters: AdvancedFilterState = {
    withVideo: false,
    withGuide: false,
    withQuiz: false,
    popularOnly: false
  };
  private recentConsultedByFormationId = new Map<number, number>();

  readonly levelOptions: Array<{ value: FormationLevel | ''; label: string }> = [
    { value: '', label: 'Tous les niveaux' },
    { value: 'BEGINNER', label: 'Debutant' },
    { value: 'INTERMEDIATE', label: 'Intermediaire' },
    { value: 'ADVANCED', label: 'Avance' }
  ];

  readonly categoryOptions: SidebarCategoryOption[] = [
    { value: 'ALL', label: 'Toutes', icon: 'formations' },
    { value: 'CAMPING_BEGINNER', label: 'Camping debutant', icon: 'leaf' },
    { value: 'SAFETY', label: 'Securite', icon: 'assurances' },
    { value: 'SURVIVAL', label: 'Survie', icon: 'target' },
    { value: 'TENT_SETUP', label: 'Montage tente', icon: 'tent' },
    { value: 'CAMPING_COOKING', label: 'Cuisine camping', icon: 'restaurants' }
  ];

  readonly advancedFilterOptions: SidebarAdvancedFilterOption[] = [
    { key: 'withVideo', label: 'Avec video', icon: 'events' },
    { key: 'withGuide', label: 'Avec guide interactif', icon: 'guides' },
    { key: 'withQuiz', label: 'Avec quiz', icon: 'check' },
    { key: 'popularOnly', label: 'Populaires', icon: 'star' }
  ];

  readonly statusOptions: Array<{ value: FormationStatus | ''; label: string }> = [
    { value: '', label: 'Tous les statuts' },
    { value: 'DRAFT', label: 'Brouillon' },
    { value: 'PUBLISHED', label: 'Publiee' },
    { value: 'ARCHIVED', label: 'Archivee' }
  ];

  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private cardMediaFlags = new Map<number, FormationCardMediaFlags>();
  private loadingMediaFlags = new Set<number>();
  private cardCoverByFormation = new Map<number, string>();
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
  private likedFormationIds = new Set<number>();
  private likeCountByFormation = new Map<number, number>();
  private likePendingByFormation = new Set<number>();
  private consultationCountByFormation = new Map<number, number>();

  constructor(
    private formationService: FormationService,
    private formationConsultationService: FormationConsultationService,
    private formationLikeService: FormationLikeService,
    private formationMediaService: FormationMediaService,
    private authService: AuthService,
    private router: Router,
    private guideService: GuideInteractifService
  ) {}

  ngOnInit(): void {
    this.canManage = this.canManageFormationRole();
    this.canSeeStats = this.canManage;
    this.guideService.startPage('formation-list', true);
    this.loadRecentConsultedState();
    this.loadLikedFormationIds();
    this.loadFormations(0);
  }

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
  }

  loadFormations(page = this.page): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const enforcePublishedForUser = !this.canManage;
    const hasLocalSidebarFiltering = this.hasLocalSidebarFiltering();
    const hasFiltering = enforcePublishedForUser
      || !!this.search.trim()
      || !!this.selectedLevel
      || !!this.selectedStatus
      || this.showLikedOnly
      || hasLocalSidebarFiltering;
    const effectivePage = hasFiltering ? 0 : page;
    const effectiveSize = hasFiltering ? 100 : this.pageSize;

    const query: FormationListQuery = {
      page: effectivePage,
      size: effectiveSize,
      search: this.search.trim(),
      level: this.selectedLevel,
      status: enforcePublishedForUser ? 'PUBLISHED' : this.selectedStatus
    };

    this.formationService.listFormations(query).subscribe({
      next: (response) => {
        this.formations = this.applyRoleVisibilityFilter(response.items);
        this.totalElements = hasFiltering ? this.formations.length : response.totalElements;
        this.page = hasFiltering ? 0 : response.page;
        this.loading = false;
        this.hydrateLikeDataFromSummaries(this.formations);
        this.hydrateConsultationDataFromSummaries(this.formations);
        this.refreshCardCovers(this.formations);
        this.prefetchCardMetadata(this.formations);
        this.refreshVisibleFormations();
        if (hasFiltering) {
          this.totalElements = this.visibleFormations.length;
        }

        if (this.formations.length === 0 && !this.showLikedOnly) {
          this.errorMessage = 'Aucune formation trouvee avec ces filtres.';
        }
      },
      error: (error: HttpErrorResponse) => {
        this.formations = [];
        this.visibleFormations = [];
        this.totalElements = 0;
        this.loading = false;
        this.errorMessage = this.getErrorMessage(error.status, error.error);
      }
    });
  }

  applyFilters(): void {
    this.page = 0;
    if (this.search.trim()) {
      this.guideService.markAction('formation-list', 'search');
    }
    if (this.selectedLevel || this.selectedStatus) {
      this.guideService.markAction('formation-list', 'filter');
    }
    this.loadFormations(0);
  }

  onSearchInput(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(() => {
      this.applyFilters();
    }, 220);
  }

  clearFilters(): void {
    this.search = '';
    this.selectedLevel = '';
    this.selectedStatus = '';
    this.showLikedOnly = false;
    this.selectedCategory = 'ALL';
    this.advancedFilters = {
      withVideo: false,
      withGuide: false,
      withQuiz: false,
      popularOnly: false
    };
    this.page = 0;
    this.loadFormations(0);
  }

  setCategoryFilter(category: FormationSidebarCategory): void {
    const nextCategory: FormationSidebarCategory = this.selectedCategory === category ? 'ALL' : category;
    if (this.selectedCategory === nextCategory) {
      return;
    }

    this.selectedCategory = nextCategory;
    this.page = 0;
    this.loadFormations(0);
  }

  toggleAdvancedFilter(key: AdvancedFilterKey): void {
    this.advancedFilters = {
      ...this.advancedFilters,
      [key]: !this.advancedFilters[key]
    };
    this.page = 0;
    this.loadFormations(0);
  }

  isAdvancedFilterActive(key: AdvancedFilterKey): boolean {
    return this.advancedFilters[key];
  }

  get completedFormationsCount(): number {
    return this.formations.filter((formation) => this.getGuideProgressPercent(formation) >= 100).length;
  }

  get completedGuidesCount(): number {
    return this.formations.filter((formation) => this.hasGuideAvailable(formation) && this.getGuideProgressPercent(formation) >= 100).length;
  }

  get currentProgressPercent(): number {
    const withGuide = this.formations.filter((formation) => this.hasGuideAvailable(formation));
    if (withGuide.length === 0) {
      return 0;
    }

    const progressSum = withGuide.reduce((sum, formation) => sum + this.getGuideProgressPercent(formation), 0);
    return Math.round(progressSum / withGuide.length);
  }

  get unlockedBadges(): string[] {
    const badges: string[] = [];
    if (this.totalConsultationsCount >= 10) {
      badges.push('Explorateur');
    }
    if (this.completedFormationsCount >= 2) {
      badges.push('Expert Camping');
    }
    if (this.completedGuidesCount >= 2) {
      badges.push('Guide Terrain');
    }
    return badges;
  }

  get totalConsultationsCount(): number {
    return this.formations.reduce((sum, formation) => sum + this.getConsultationCount(formation), 0);
  }

  get aiRecommendations(): FormationSummaryDto[] {
    const ranked = [...this.formations]
      .map((formation) => ({
        formation,
        score: this.computeRecommendationScore(formation)
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 4);

    return ranked.map((entry) => entry.formation);
  }

  get ongoingGuideFormation(): FormationSummaryDto | null {
    const candidates = this.formations
      .filter((formation) => this.hasGuideAvailable(formation))
      .map((formation) => ({
        formation,
        progress: this.getGuideProgressPercent(formation)
      }))
      .filter((entry) => entry.progress > 0 && entry.progress < 100)
      .sort((left, right) => right.progress - left.progress);

    return candidates[0]?.formation ?? null;
  }

  get recentConsultedFormations(): FormationSummaryDto[] {
    const ordered = [...this.formations]
      .map((formation) => ({
        formation,
        updatedAt: this.recentConsultedByFormationId.get(formation.id) ?? 0
      }))
      .filter((entry) => entry.updatedAt > 0)
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, 4)
      .map((entry) => entry.formation);

    if (ordered.length > 0) {
      return ordered;
    }

    const topConsultedIds = this.formationConsultationService.getTopConsulted(4).map((entry) => entry.formationId);
    return topConsultedIds
      .map((formationId) => this.formations.find((formation) => formation.id === formationId) ?? null)
      .filter((formation): formation is FormationSummaryDto => formation !== null);
  }

  toggleLikedOnly(): void {
    if (!this.authService.isLoggedIn()) {
      this.authService.setReturnUrl(this.router.url);
      this.router.navigate(['/login']);
      return;
    }

    this.showLikedOnly = !this.showLikedOnly;
    this.page = 0;
    this.loadFormations(0);
  }

  get canGoPrevious(): boolean {
    if (this.showLikedOnly) {
      return false;
    }
    return this.page > 0;
  }

  get canGoNext(): boolean {
    if (this.showLikedOnly) {
      return false;
    }
    return (this.page + 1) * this.pageSize < this.totalElements;
  }

  get canShowPagination(): boolean {
    return !this.showLikedOnly && !this.loading && this.totalElements > this.pageSize;
  }

  get displayedTotal(): number {
    return this.showLikedOnly ? this.visibleFormations.length : this.totalElements;
  }

  goPrevious(): void {
    if (!this.canGoPrevious || this.loading) {
      return;
    }
    this.loadFormations(this.page - 1);
  }

  goNext(): void {
    if (!this.canGoNext || this.loading) {
      return;
    }
    this.loadFormations(this.page + 1);
  }

  trackByFormationId(_index: number, formation: FormationSummaryDto): number {
    return formation.id;
  }

  createFormation(): void {
    if (!this.canManage) {
      return;
    }
    const baseRoute = this.getManagementBaseRoute();
    this.router.navigate([...baseRoute, 'create']);
  }

  openStatsDashboard(): void {
    if (!this.canSeeStats) {
      return;
    }
    const target = this.isAdministratorRole()
      ? ['/admin/formations/statistiques']
      : ['/public/formations/statistiques'];
    this.router.navigate(target);
  }

  openGuideForFormation(formation: FormationSummaryDto): void {
    const target = this.isAdministratorRole()
      ? ['/admin/formations', formation.id, 'guide']
      : ['/public/formations', formation.id, 'guide'];

    this.router.navigate(target);
  }

  openDetail(formation: FormationSummaryDto): void {
    const target = this.isAdministratorRole()
      ? ['/admin/formations', formation.id]
      : ['/public/formations', formation.id];
    this.guideService.markAction('formation-list', 'open-detail');
    this.router.navigate(target);
  }

  trackConsultationHover(formation: FormationSummaryDto): void {
    if (this.canManage) {
      return;
    }

    const currentCount = this.getConsultationCount(formation);
    const title = this.getTitle(formation);
    this.formationConsultationService.trackHoverConsultation(formation.id, title);
    this.consultationCountByFormation.set(formation.id, currentCount + 1);
    this.markRecentConsulted(formation.id);
  }

  editFormation(formation: FormationSummaryDto): void {
    if (!this.canManage) {
      return;
    }
    const baseRoute = this.getManagementBaseRoute();
    this.router.navigate([...baseRoute, formation.id, 'edit']);
  }

  publishFormation(formation: FormationSummaryDto): void {
    if (!this.canManage) {
      return;
    }

    const missing = this.getMissingPublishSummaryFields(formation);
    if (missing.length > 0) {
      this.errorMessage = `Formation incomplete. Completez d abord: ${missing.join(', ')}.`;
      this.successMessage = '';
      return;
    }

    this.successMessage = '';
    this.errorMessage = '';

    this.formationService.publishFormation(formation.id).subscribe({
      next: () => {
        this.successMessage = `Formation #${formation.id} publiee avec succes.`;
        formation.status = 'PUBLISHED';
        formation.statut = 'PUBLISHED';
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.getErrorMessage(error.status, error.error);
      }
    });
  }

  deleteFormation(formation: FormationSummaryDto): void {
    if (!this.canManage) {
      return;
    }

    const confirmed = globalThis.confirm(`Voulez-vous vraiment supprimer la formation "${this.getTitle(formation)}" ?`);
    if (!confirmed) {
      return;
    }

    this.successMessage = '';
    this.errorMessage = '';

    this.formationService.deleteFormation(formation.id).subscribe({
      next: () => {
        this.successMessage = `Formation #${formation.id} supprimee avec succes.`;
        this.formations = this.formations.filter((item) => item.id !== formation.id);
        this.totalElements = Math.max(0, this.totalElements - 1);
        this.cardMediaFlags.delete(formation.id);
        this.loadingMediaFlags.delete(formation.id);
        this.cardCoverByFormation.delete(formation.id);
        this.likedFormationIds.delete(formation.id);
        this.likeCountByFormation.delete(formation.id);
        this.likePendingByFormation.delete(formation.id);
        this.consultationCountByFormation.delete(formation.id);
        this.refreshCardCovers(this.formations);
        this.refreshVisibleFormations();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.getErrorMessage(error.status, error.error);
      }
    });
  }

  isLiked(formation: FormationSummaryDto): boolean {
    return this.likedFormationIds.has(formation.id);
  }

  isLikePending(formationId: number): boolean {
    return this.likePendingByFormation.has(formationId);
  }

  getLikeCount(formation: FormationSummaryDto): number {
    const fromMap = this.likeCountByFormation.get(formation.id);
    if (typeof fromMap === 'number' && Number.isFinite(fromMap) && fromMap >= 0) {
      return fromMap;
    }

    return this.extractLikeCountFromSummary(formation);
  }

  getConsultationCount(formation: FormationSummaryDto): number {
    const fromMap = this.consultationCountByFormation.get(formation.id);
    if (typeof fromMap === 'number' && Number.isFinite(fromMap) && fromMap >= 0) {
      return fromMap;
    }

    return this.extractConsultationCountFromSummary(formation);
  }

  toggleLike(formation: FormationSummaryDto, event: globalThis.Event): void {
    event.stopPropagation();

    if (this.canManage) {
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.authService.setReturnUrl(this.router.url);
      this.router.navigate(['/login']);
      return;
    }

    if (this.likePendingByFormation.has(formation.id)) {
      return;
    }

    const wasLiked = this.isLiked(formation);
    if (wasLiked) {
      this.successMessage = '';
      this.errorMessage = 'Vous avez deja aime cette formation.';
      return;
    }

    this.successMessage = '';
    this.errorMessage = '';

    const previousCount = this.getLikeCount(formation);
    const nextCount = Math.max(0, previousCount + 1);

    this.applyLikeVisualState(formation.id, true, nextCount);
    this.likePendingByFormation.add(formation.id);
    this.refreshVisibleFormations();

    this.formationLikeService.setLikeState(formation.id, true).subscribe({
      next: (result) => {
        if (typeof result.likesCount === 'number' && Number.isFinite(result.likesCount)) {
          this.likeCountByFormation.set(formation.id, Math.max(0, Math.floor(result.likesCount)));
        }

        this.likePendingByFormation.delete(formation.id);
        this.refreshVisibleFormations();
      },
      error: (error: HttpErrorResponse) => {
        this.likePendingByFormation.delete(formation.id);
        this.applyLikeVisualState(formation.id, false, previousCount);
        this.refreshVisibleFormations();
        this.errorMessage = this.getLikeErrorMessage(error.status, error.error);
      }
    });
  }

  getTitle(formation: FormationSummaryDto): string {
    const rawTitle = this.safeText(formation.titre)
      || this.safeText(formation.title)
      || this.safeText(formation.nom)
      || `Formation #${formation.id}`;
    return this.normalizeDisplayTitle(rawTitle);
  }

  getShortTitle(formation: FormationSummaryDto): string {
    const title = this.getTitle(formation);
    return title.length > 72 ? `${title.slice(0, 69).trim()}...` : title;
  }

  getDescription(formation: FormationSummaryDto): string {
    const description = this.safeText(formation.description);
    if (!description) {
      return 'Description non disponible.';
    }
    return description.length > 180 ? `${description.slice(0, 180).trim()}...` : description;
  }

  getLevelLabel(formation: FormationSummaryDto): string {
    const levelValue = this.safeText(formation.level)
      || this.readLooseStringField(formation, 'niveau');
    const normalized = levelValue.toUpperCase();
    if (normalized === 'ADVANCED') {
      return 'Avance';
    }
    if (normalized === 'INTERMEDIATE') {
      return 'Intermediaire';
    }
    if (normalized === 'BEGINNER') {
      return 'Debutant';
    }
    return 'Non defini';
  }

  getStatusLabel(formation: FormationSummaryDto): string {
    const statusValue = this.safeText(formation.status)
      || this.safeText(formation.statut);
    const normalized = statusValue.toUpperCase();
    if (normalized === 'PUBLISHED') {
      return 'Publiee';
    }
    if (normalized === 'ARCHIVED') {
      return 'Archivee';
    }
    if (normalized === 'DRAFT') {
      return 'Brouillon';
    }
    return 'Non defini';
  }

  getDurationLabel(formation: FormationSummaryDto): string {
    const rawDuration = this.safeText(formation.estimatedDuration)
      || this.readLooseStringField(formation, 'dureeEstimee');
    if (rawDuration) {
      return rawDuration;
    }

    if (typeof formation.duration === 'number' && Number.isFinite(formation.duration) && formation.duration > 0) {
      return `${formation.duration} minutes`;
    }

    return 'Non definie';
  }

  getLevelBadgeClass(formation: FormationSummaryDto): string {
    const levelValue = this.safeText(formation.level)
      || this.readLooseStringField(formation, 'niveau');
    const normalized = levelValue.toUpperCase();
    if (normalized === 'ADVANCED') {
      return 'badge-advanced';
    }
    if (normalized === 'INTERMEDIATE') {
      return 'badge-intermediate';
    }
    if (normalized === 'BEGINNER') {
      return 'badge-beginner';
    }
    return 'badge-empty';
  }

  getStatusBadgeClass(formation: FormationSummaryDto): string {
    const statusValue = this.safeText(formation.status)
      || this.safeText(formation.statut);
    const normalized = statusValue.toUpperCase();
    if (normalized === 'PUBLISHED') {
      return 'badge-published';
    }
    if (normalized === 'ARCHIVED') {
      return 'badge-archived';
    }
    if (normalized === 'DRAFT') {
      return 'badge-draft';
    }
    return 'badge-empty';
  }

  getCreationDate(formation: FormationSummaryDto): string {
    const rawDate = this.safeText(formation.dateCreation) || this.safeText(formation.createdAt);
    if (!rawDate) {
      return '-';
    }
    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime()) ? '-' : parsedDate.toLocaleDateString();
  }

  hasGuideAvailable(formation: FormationSummaryDto): boolean {
    const candidateGuideId = typeof formation.guideInteractifId === 'number'
      ? formation.guideInteractifId
      : formation.guideId;
    if (typeof candidateGuideId === 'number' && Number.isFinite(candidateGuideId) && candidateGuideId > 0) {
      return true;
    }

    const record = formation as unknown as Record<string, unknown>;
    const hasGuideFlag = this.toBoolean(record['hasGuide'])
      || this.toBoolean(record['guideAvailable'])
      || this.toBoolean(record['hasInteractiveGuide'])
      || this.toBoolean(record['guideInteractifDisponible']);
    if (hasGuideFlag) {
      return true;
    }

    const nestedGuideCandidates = [
      this.asLooseRecord(record['guide']),
      this.asLooseRecord(record['guideInteractif']),
      this.asLooseRecord(record['guideLink'])
    ].filter((entry): entry is Record<string, unknown> => entry !== null);

    for (const nestedGuide of nestedGuideCandidates) {
      const nestedId = this.toNonNegativeInteger(nestedGuide['id'] ?? nestedGuide['guideId'] ?? nestedGuide['formationGuideId']);
      if (nestedId !== null && nestedId > 0) {
        return true;
      }
    }

    return false;
  }

  private getMissingPublishSummaryFields(formation: FormationSummaryDto): string[] {
    const missing: string[] = [];
    const title = this.getTitle(formation);
    const description = this.safeText(formation.description);
    const level = (this.safeText(formation.level) || this.readLooseStringField(formation, 'niveau')).toUpperCase();
    const durationText = this.getDurationLabel(formation);
    const durationMatch = durationText.match(/(\d+)/);
    const duration = durationMatch?.[1] ? Number.parseInt(durationMatch[1], 10) : null;
    const objectives = Array.isArray(formation.objectives)
      ? formation.objectives
      : Array.isArray(formation.objectifs)
        ? formation.objectifs
        : [];
    const sections = Array.isArray(formation.sections) ? formation.sections : [];
    const summary = this.safeText(formation.summary) || this.safeText(formation.resume);
    const hasMainImage = !!this.resolveMainImageFromSummary(formation) || !!this.resolveFormationCover(formation);

    if (title.length < 5) {
      missing.push('Titre');
    }
    if (description.length < 30) {
      missing.push('Description');
    }
    if (!['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(level)) {
      missing.push('Niveau');
    }
    if (duration === null || ![15, 30, 45].includes(duration)) {
      missing.push('Duree');
    }
    if (!hasMainImage) {
      missing.push('Image principale');
    }
    if (objectives.length < 3) {
      missing.push('Objectifs pedagogiques');
    }
    if (sections.length < 3) {
      missing.push('Sections theoriques');
    }
    if (summary.length < 30) {
      missing.push('Resume');
    }
    if (!this.hasGuideAvailable(formation)) {
      missing.push('Guide interactif');
    }

    return missing;
  }

  getMediaBadgeLabel(formation: FormationSummaryDto): string {
    const mediaFlags = this.cardMediaFlags.get(formation.id);
    if (!mediaFlags) {
      return '';
    }

    if (mediaFlags.hasImage && mediaFlags.hasVideo) {
      return 'Contient image/video';
    }
    if (mediaFlags.hasVideo) {
      return 'Contient video';
    }
    if (mediaFlags.hasImage) {
      return 'Contient image';
    }
    return '';
  }

  hasCardCover(formation: FormationSummaryDto): boolean {
    return this.safeText(this.cardCoverByFormation.get(formation.id)).length > 0;
  }

  getCardCoverUrl(formation: FormationSummaryDto): string {
    return this.safeText(this.cardCoverByFormation.get(formation.id));
  }

  isAiGenerated(formation: FormationSummaryDto): boolean {
    if (formation.generatedByAi === true || formation.aiGenerated === true) {
      return true;
    }

    const record = formation as unknown as Record<string, unknown>;
    const looseFlags = [record['generatedByAi'], record['aiGenerated'], record['isAiGenerated'], record['source']];
    return looseFlags.some((value) => this.toBoolean(value) || this.safeText(value).toLowerCase() === 'ai');
  }

  getGuideProgressPercent(formation: FormationSummaryDto): number {
    if (typeof formation.guideProgressPercent === 'number' && Number.isFinite(formation.guideProgressPercent)) {
      return Math.max(0, Math.min(100, Math.round(formation.guideProgressPercent)));
    }

    return this.guideService.getFormationProgressPercent(formation.id);
  }

  private getErrorMessage(status: number, errorBody?: unknown): string {
    const backendMessage = this.resolveBackendMessage(errorBody);
    if (backendMessage) {
      return backendMessage;
    }

    switch (status) {
      case 0:
        return 'Connexion API impossible. Utilisez http://localhost:4200 et verifiez le backend sur http://localhost:8082.';
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
        return 'Impossible de charger les formations.';
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
        return '401: Connectez-vous pour aimer une formation.';
      case 403:
        return '403: Vous n avez pas le droit de faire cette action.';
      case 404:
        return '404: Endpoint like introuvable.';
      case 500:
        return '500: Erreur serveur pendant le like.';
      default:
        return 'Impossible de mettre a jour les favoris.';
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

  private readLooseStringField(formation: FormationSummaryDto, fieldName: string): string {
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

  private canManageFormationRole(): boolean {
    return this.authService.canManageFormations();
  }

  private isAdministratorRole(): boolean {
    return this.authService.canAccessAdminPanel(this.authService.getRole());
  }

  private getManagementBaseRoute(): string[] {
    return this.isAdministratorRole() ? ['/admin/formations'] : ['/public/formations'];
  }

  private prefetchCardMetadata(formations: FormationSummaryDto[]): void {
    formations.forEach((formation) => this.loadMediaFlags(formation.id));
  }

  private loadLikedFormationIds(): void {
    if (!this.authService.isLoggedIn()) {
      this.likedFormationIds.clear();
      this.refreshVisibleFormations();
      return;
    }

    this.formationLikeService.getLikedFormationIds().subscribe({
      next: (likedIds) => {
        this.likedFormationIds = new Set(likedIds);
        this.refreshVisibleFormations();
      },
      error: () => {
        this.refreshVisibleFormations();
      }
    });
  }

  private refreshVisibleFormations(): void {
    let scopedFormations = [...this.formations];
    if (this.showLikedOnly) {
      scopedFormations = scopedFormations.filter((formation) => this.likedFormationIds.has(formation.id));
    }
    if (this.selectedCategory !== 'ALL') {
      scopedFormations = scopedFormations.filter((formation) => this.getFormationCategory(formation) === this.selectedCategory);
    }
    if (this.advancedFilters.withVideo) {
      scopedFormations = scopedFormations.filter((formation) => this.hasFormationVideo(formation));
    }
    if (this.advancedFilters.withGuide) {
      scopedFormations = scopedFormations.filter((formation) => this.hasGuideAvailable(formation));
    }
    if (this.advancedFilters.withQuiz) {
      scopedFormations = scopedFormations.filter((formation) => this.hasFormationQuiz(formation));
    }
    if (this.advancedFilters.popularOnly) {
      scopedFormations = scopedFormations.filter((formation) => this.isPopularFormation(formation));
    }
    this.visibleFormations = [...scopedFormations];
  }

  private hasFormationVideo(formation: FormationSummaryDto): boolean {
    const flags = this.cardMediaFlags.get(formation.id);
    if (flags?.hasVideo) {
      return true;
    }

    const record = formation as unknown as Record<string, unknown>;
    const explicitVideoFlags = this.toBoolean(record['hasVideo'])
      || this.toBoolean(record['videoAvailable'])
      || this.toBoolean(record['containsVideo']);
    if (explicitVideoFlags) {
      return true;
    }

    const videoCount = this.toNonNegativeInteger(record['videosCount'] ?? record['videoCount'] ?? record['mediaVideosCount']);
    if (videoCount !== null && videoCount > 0) {
      return true;
    }

    const mediaList = Array.isArray(record['media']) ? record['media'] : Array.isArray(record['medias']) ? record['medias'] : [];
    const containsVideoMedia = mediaList.some((media) => {
      const mediaRecord = this.asLooseRecord(media);
      if (!mediaRecord) {
        return false;
      }

      const mediaType = this.safeText(mediaRecord['mediaType']).toUpperCase();
      const mimeType = this.safeText(mediaRecord['mimeType']).toLowerCase();
      const mediaUrl = this.safeText(mediaRecord['mediaUrl'] ?? mediaRecord['url']);
      return mediaType === 'VIDEO'
        || mimeType.startsWith('video/')
        || /\.(mp4|mov|m3u8|webm)(\?.*)?$/i.test(mediaUrl);
    });
    if (containsVideoMedia) {
      return true;
    }

    const explicitVideo = this.safeText(formation.coverVideoUrl)
      || this.safeText(formation.videoPrincipale)
      || this.safeText(formation.videoUrl);
    return explicitVideo.length > 0;
  }

  private hasFormationQuiz(formation: FormationSummaryDto): boolean {
    const directQuiz = Array.isArray(formation.quiz) ? formation.quiz.length : 0;
    if (directQuiz > 0) {
      return true;
    }

    const record = formation as unknown as Record<string, unknown>;
    const quizCount = this.toNonNegativeInteger(
      record['quizCount']
      ?? record['quizzesCount']
      ?? record['questionsCount']
      ?? record['questionCount']
      ?? record['totalQuestions']
    );
    if (quizCount !== null && quizCount > 0) {
      return true;
    }

    const quizArrayCandidates = [
      Array.isArray(record['quiz']) ? record['quiz'] : [],
      Array.isArray(record['quizzes']) ? record['quizzes'] : [],
      Array.isArray(record['questions']) ? record['questions'] : []
    ];
    if (quizArrayCandidates.some((entry) => entry.length > 0)) {
      return true;
    }

    const hasQuizFlag = this.toBoolean(record['hasQuiz'])
      || this.toBoolean(record['quizAvailable'])
      || this.toBoolean(record['hasQuestions']);
    return hasQuizFlag;
  }

  private isPopularFormation(formation: FormationSummaryDto): boolean {
    const record = formation as unknown as Record<string, unknown>;
    if (this.toBoolean(record['popular']) || this.toBoolean(record['isPopular'])) {
      return true;
    }

    const popularityScore = this.toNonNegativeInteger(record['popularityScore'] ?? record['scorePopularite']);
    if (popularityScore !== null && popularityScore >= 50) {
      return true;
    }

    const likes = this.getLikeCount(formation);
    const consultations = this.getConsultationCount(formation);
    return likes >= 2 || consultations >= 5;
  }

  private getFormationCategory(formation: FormationSummaryDto): FormationSidebarCategory {
    const record = formation as unknown as Record<string, unknown>;
    const explicitCategory = this.resolveCategoryFromRecord(record);
    if (explicitCategory) {
      return explicitCategory;
    }

    const textParts: string[] = [
      this.getTitle(formation),
      this.safeText(formation.description),
      this.safeText(formation.summary),
      this.safeText(formation.resume),
      this.safeText(formation.content),
      this.safeText(formation.contenu),
      ...this.normalizeOptionalStringArray(formation.objectives),
      ...this.normalizeOptionalStringArray(formation.objectifs),
      ...this.readLooseStringArrayField(record, 'tags'),
      ...this.readLooseStringArrayField(record, 'categories'),
      ...this.readLooseStringArrayField(record, 'themes'),
      ...this.readLooseStringArrayField(record, 'keywords')
    ];

    if (Array.isArray(formation.sections)) {
      formation.sections.forEach((section) => {
        const sectionRecord = this.asLooseRecord(section);
        if (!sectionRecord) {
          return;
        }
        textParts.push(this.safeText(sectionRecord['title']));
        textParts.push(this.safeText(sectionRecord['content']));
      });
    }

    const text = this.normalizeForMatch(textParts.join(' '));

    if (/(securite|risque|urgence|safe|danger|incendie|evacuation|premier secours|premiers secours)/i.test(text)) {
      return 'SAFETY';
    }
    if (/(survie|survival|orientation|boussole|secours|abri|ration|deshydratation|deshydratation)/i.test(text)) {
      return 'SURVIVAL';
    }
    if (/(tente|montage|piquet|arceau|campement|hauban|toile de tente)/i.test(text)) {
      return 'TENT_SETUP';
    }
    if (/(cuisine|cuisson|repas|feu|barbecue|alimentation|recette|hygiene alimentaire|conservation)/i.test(text)) {
      return 'CAMPING_COOKING';
    }

    return 'CAMPING_BEGINNER';
  }

  private resolveCategoryFromRecord(record: Record<string, unknown>): FormationSidebarCategory | null {
    const directCandidates = [
      this.safeText(record['category']),
      this.safeText(record['categorie']),
      this.safeText(record['formationCategory']),
      this.safeText(record['formationType']),
      this.safeText(record['theme']),
      this.safeText(record['categoryCode']),
      this.safeText(record['type'])
    ];

    for (const candidate of directCandidates) {
      const mapped = this.mapCategoryTokenToSidebarCategory(candidate);
      if (mapped) {
        return mapped;
      }
    }

    const arrayFields = ['categories', 'categoryLabels', 'tags', 'themes', 'keywords'];
    for (const fieldName of arrayFields) {
      const values = this.readLooseStringArrayField(record, fieldName);
      for (const value of values) {
        const mapped = this.mapCategoryTokenToSidebarCategory(value);
        if (mapped) {
          return mapped;
        }
      }
    }

    return null;
  }

  private mapCategoryTokenToSidebarCategory(rawToken: string): FormationSidebarCategory | null {
    const token = this.normalizeForMatch(rawToken).replace(/[_-]/g, ' ').trim();
    if (!token) {
      return null;
    }

    if (
      /(camping beginner|beginner|debutant|initiation|basics?|base|niveau 1)/i.test(token)
      || token === 'camping debutant'
    ) {
      return 'CAMPING_BEGINNER';
    }
    if (/(safety|securite|safe|securisation|risque|urgence)/i.test(token)) {
      return 'SAFETY';
    }
    if (/(survival|survie|orientation|boussole|autonomie)/i.test(token)) {
      return 'SURVIVAL';
    }
    if (/(tent setup|tente|montage tente|campement|abri)/i.test(token)) {
      return 'TENT_SETUP';
    }
    if (/(cooking|cuisine|cuisson|repas|barbecue|alimentation)/i.test(token)) {
      return 'CAMPING_COOKING';
    }

    return null;
  }

  private computeRecommendationScore(formation: FormationSummaryDto): number {
    let score = 0;
    const progress = this.getGuideProgressPercent(formation);
    const likes = this.getLikeCount(formation);
    const consultations = this.getConsultationCount(formation);

    if (progress > 0 && progress < 100) {
      score += 18;
    }
    if (this.recentConsultedByFormationId.has(formation.id)) {
      score += 10;
    }
    if (likes > 0) {
      score += Math.min(20, likes * 4);
    }
    if (consultations > 0) {
      score += Math.min(20, consultations * 2);
    }
    if (this.hasGuideAvailable(formation)) {
      score += 14;
    }
    if (this.hasFormationQuiz(formation)) {
      score += 8;
    }
    if (this.hasFormationVideo(formation)) {
      score += 10;
    }
    if (this.selectedLevel && (this.safeText(formation.level).toUpperCase() === this.selectedLevel)) {
      score += 12;
    }
    if (this.showLikedOnly && this.isLiked(formation)) {
      score += 10;
    }

    return score;
  }

  private loadRecentConsultedState(): void {
    const raw = localStorage.getItem(this.getRecentConsultedStorageKey());
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return;
      }

      parsed.forEach((entry) => {
        if (!entry || typeof entry !== 'object') {
          return;
        }
        const record = entry as { id?: unknown; ts?: unknown };
        const formationId = this.toNonNegativeInteger(record.id);
        const timestamp = typeof record.ts === 'number' && Number.isFinite(record.ts) ? record.ts : 0;
        if (formationId === null || formationId <= 0 || timestamp <= 0) {
          return;
        }
        this.recentConsultedByFormationId.set(formationId, timestamp);
      });
    } catch {
      // ignore malformed local storage entries
    }
  }

  private markRecentConsulted(formationId: number): void {
    if (!Number.isFinite(formationId) || formationId <= 0) {
      return;
    }

    this.recentConsultedByFormationId.set(formationId, Date.now());
    const serialized = Array.from(this.recentConsultedByFormationId.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 30)
      .map(([id, ts]) => ({ id, ts }));

    localStorage.setItem(this.getRecentConsultedStorageKey(), JSON.stringify(serialized));
  }

  private getRecentConsultedStorageKey(): string {
    const userId = this.authService.getUserId();
    if (Number.isFinite(userId) && userId > 0) {
      return `campconnect:formation:recent:id:${userId}`;
    }

    const email = this.authService.getUserEmail().trim().toLowerCase();
    return `campconnect:formation:recent:email:${email || 'anonymous'}`;
  }

  private applyRoleVisibilityFilter(formations: FormationSummaryDto[]): FormationSummaryDto[] {
    if (this.canManage) {
      return [...formations];
    }

    return formations.filter((formation) => this.isPublishedFormation(formation));
  }

  private isPublishedFormation(formation: FormationSummaryDto): boolean {
    const statusValue = this.safeText(formation.status) || this.safeText(formation.statut);
    return statusValue.toUpperCase() === 'PUBLISHED';
  }

  private hydrateLikeDataFromSummaries(formations: FormationSummaryDto[]): void {
    formations.forEach((formation) => {
      this.likeCountByFormation.set(formation.id, this.extractLikeCountFromSummary(formation));

      if (this.extractLikedStateFromSummary(formation)) {
        this.likedFormationIds.add(formation.id);
      }
    });
  }

  private hydrateConsultationDataFromSummaries(formations: FormationSummaryDto[]): void {
    this.consultationCountByFormation.clear();
    formations.forEach((formation) => {
      const backendOrSummaryCount = this.extractConsultationCountFromSummary(formation);
      const localCount = this.formationConsultationService.getConsultationCount(formation.id);
      this.consultationCountByFormation.set(formation.id, Math.max(backendOrSummaryCount, localCount));
    });
  }

  private applyLikeVisualState(formationId: number, liked: boolean, likesCount: number): void {
    if (liked) {
      this.likedFormationIds.add(formationId);
    } else {
      this.likedFormationIds.delete(formationId);
    }

    this.likeCountByFormation.set(formationId, Math.max(0, Math.floor(likesCount)));
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

  private refreshCardCovers(formations: FormationSummaryDto[] = this.formations): void {
    this.cardCoverByFormation.clear();

    formations.forEach((formation) => {
      const finalCover = this.resolveMainImageFromSummary(formation)
        || this.resolveFormationCover(formation)
        || this.resolveContextualCover(formation)
        || this.defaultCoverUrl;
      this.cardCoverByFormation.set(formation.id, finalCover);
    });
  }

  private loadMediaFlags(formationId: number): void {
    if (!Number.isFinite(formationId) || formationId <= 0) {
      return;
    }

    if (this.cardMediaFlags.has(formationId) || this.loadingMediaFlags.has(formationId)) {
      return;
    }

    this.loadingMediaFlags.add(formationId);
    this.formationMediaService.getFormationMedia(formationId).subscribe({
      next: (mediaList) => {
        const sortedMediaList = this.formationMediaService.sortByDisplayOrder(mediaList);
        const hasImage = sortedMediaList.some((media) => this.isImageMedia(media));
        const hasVideo = sortedMediaList.some((media) => this.isVideoMedia(media));
        const firstImage = sortedMediaList.find((media) => this.isValidPhotoCover(media))
          || sortedMediaList.find((media) => this.isImageMedia(media));
        const coverImageUrl = firstImage
          ? this.normalizeImageUrl(this.formationMediaService.resolveMediaUrl(firstImage.mediaUrl))
          : undefined;

        this.cardMediaFlags.set(formationId, { hasImage, hasVideo, coverImageUrl });
        this.loadingMediaFlags.delete(formationId);
        this.refreshCardCovers();
        this.refreshVisibleFormations();
      },
      error: () => {
        this.cardMediaFlags.set(formationId, { hasImage: false, hasVideo: false, coverImageUrl: undefined });
        this.loadingMediaFlags.delete(formationId);
        this.refreshCardCovers();
        this.refreshVisibleFormations();
      }
    });
  }

  private hasLocalSidebarFiltering(): boolean {
    return this.selectedCategory !== 'ALL'
      || this.advancedFilters.withVideo
      || this.advancedFilters.withGuide
      || this.advancedFilters.withQuiz
      || this.advancedFilters.popularOnly;
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

  private normalizeForMatch(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeOptionalStringArray(values: unknown): string[] {
    if (!Array.isArray(values)) {
      return [];
    }

    return values
      .map((entry) => this.safeText(entry))
      .filter((entry) => entry.length > 0);
  }

  private readLooseStringArrayField(record: Record<string, unknown>, fieldName: string): string[] {
    const rawValue = record[fieldName];
    if (!Array.isArray(rawValue)) {
      return [];
    }

    return rawValue
      .map((entry) => this.safeText(entry))
      .filter((entry) => entry.length > 0);
  }

  private asLooseRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' ? value as Record<string, unknown> : null;
  }

  private toNonNegativeInteger(value: unknown): number | null {
    const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return null;
    }

    return Math.floor(parsed);
  }

  private resolveFormationCover(formation: FormationSummaryDto): string {
    return this.safeText(this.cardMediaFlags.get(formation.id)?.coverImageUrl);
  }

  private resolveMainImageFromSummary(formation: FormationSummaryDto): string {
    const candidates = [
      this.safeText(formation.coverImageUrl),
      this.safeText(formation.imagePrincipale),
      this.safeText(formation.imageUrl),
      this.safeText(formation.photoUrl)
    ];

    for (const candidate of candidates) {
      const normalized = this.normalizeImageUrl(candidate);
      if (normalized) {
        return normalized;
      }
    }

    return '';
  }

  private resolveContextualCover(formation: FormationSummaryDto): string {
    const title = this.getTitle(formation);
    const description = this.safeText(formation.description);
    const summary = this.safeText(formation.summary) || this.safeText(formation.resume);
    const objectives = (Array.isArray(formation.objectives) ? formation.objectives : Array.isArray(formation.objectifs) ? formation.objectifs : [])
      .map((item) => this.safeText(item))
      .join(' ');
    const sections = Array.isArray(formation.sections)
      ? formation.sections.map((section) => {
        const record = section as unknown as Record<string, unknown>;
        return `${this.safeText(record['title'])} ${this.safeText(record['content'])}`;
      }).join(' ')
      : '';

    const contextText = `${title} ${description} ${summary} ${objectives} ${sections}`.toLowerCase();
    const pool = this.selectCoverPoolByContext(contextText);
    const index = this.toStableIndex(formation.id, pool.length);
    return pool[index] || this.defaultCoverUrl;
  }

  private selectCoverPoolByContext(contextText: string): string[] {
    if (/(tente|piquet|arceau|hauban|montage|campement)/i.test(contextText)) {
      return this.themedCoverPools.tent;
    }
    if (/(securite|s[eé]curit[eé]|risque|urgence|incendie|feu|evacuation|premier secours)/i.test(contextText)) {
      return this.themedCoverPools.safety;
    }
    if (/(cuisine|repas|bbq|barbecue|cuisson|aliment|glaciere|hygi[eè]ne)/i.test(contextText)) {
      return this.themedCoverPools.cooking;
    }
    if (/(survie|orientation|foret|for[eê]t|boussole|abri|randonn[eé]e|terrain)/i.test(contextText)) {
      return this.themedCoverPools.survival;
    }
    if (/(materiel|mat[eé]riel|equipement|[eé]quipement|sac|lampe|couchage|checklist)/i.test(contextText)) {
      return this.themedCoverPools.gear;
    }
    if (/(budget|r[eé]servation|choisir|site|compar|planifier|organisation)/i.test(contextText)) {
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

  private normalizeImageUrl(rawUrl: string): string {
    const cleaned = this.safeText(rawUrl);
    if (!cleaned) {
      return '';
    }

    if (/^https?:\/\//i.test(cleaned)) {
      return cleaned;
    }

    if (/^\/?assets\//i.test(cleaned)) {
      return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
    }

    const resolved = this.formationMediaService.resolveMediaUrl(cleaned);
    return /^https?:\/\//i.test(resolved) ? resolved : '';
  }

  private isValidPhotoCover(media: { mediaType?: string; mimeType?: string; fileSize?: number; fileName?: string }): boolean {
    const mediaType = this.safeText(media.mediaType).toUpperCase();
    const mimeType = this.safeText(media.mimeType).toLowerCase();
    const fileName = this.safeText(media.fileName).toLowerCase();
    const fileSize = typeof media.fileSize === 'number' && Number.isFinite(media.fileSize) ? media.fileSize : null;

    const isImage = mediaType === 'IMAGE' || mimeType.startsWith('image/');
    if (!isImage) {
      return false;
    }

    if (mimeType.includes('svg')) {
      return false;
    }

    if (fileName.includes('icon') || fileName.includes('logo') || fileName.includes('placeholder')) {
      return false;
    }

    if (fileSize !== null && fileSize > 0 && fileSize < 1024) {
      return false;
    }

    return true;
  }

  private isImageMedia(media: { mediaType?: string; mimeType?: string }): boolean {
    const mediaType = this.safeText(media.mediaType).toUpperCase();
    const mimeType = this.safeText(media.mimeType).toLowerCase();
    return mediaType === 'IMAGE' || mimeType.startsWith('image/');
  }

  private isVideoMedia(media: { mediaType?: string; mimeType?: string }): boolean {
    const mediaType = this.safeText(media.mediaType).toUpperCase();
    const mimeType = this.safeText(media.mimeType).toLowerCase();
    return mediaType === 'VIDEO' || mimeType.startsWith('video/');
  }

}
