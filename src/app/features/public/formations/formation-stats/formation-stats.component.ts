import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminIconComponent } from '../../../../core/components/admin-icon/admin-icon.component';
import { AuthService } from '../../../../core/services/auth.service';
import {
  FormationSingleStatsDto,
  FormationStatsBarItemDto,
  FormationStatsLinePointDto,
  FormationStatsOverviewDto
} from '../models/formation-stats.model';
import { FormationSummaryDto } from '../models/formation.model';
import { FormationConsultationService } from '../services/formation-consultation.service';
import { FormationService } from '../services/formation.service';
import { Observable, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-formation-stats',
  standalone: true,
  imports: [CommonModule, AdminIconComponent],
  templateUrl: './formation-stats.component.html',
  styleUrl: './formation-stats.component.css'
})
export class FormationStatsComponent implements OnInit {
  stats: FormationStatsOverviewDto | null = null;
  selectedFormationStats: FormationSingleStatsDto | null = null;

  isLoading = false;
  isLoadingFormationDetail = false;
  errorMessage = '';
  formationDetailMessage = '';

  constructor(
    private formationService: FormationService,
    private formationConsultationService: FormationConsultationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.canAccessStats()) {
      this.errorMessage = '403: Acces reserve a l administrateur ou au guide.';
      return;
    }
    this.loadStats();
  }

  get hasNoData(): boolean {
    if (!this.stats) {
      return false;
    }

    return this.stats.kpi.totalFormations === 0
      && this.stats.topViewed.length === 0
      && this.stats.topLiked.length === 0
      && this.totalGuideProgress === 0;
  }

  get totalGuideProgress(): number {
    if (!this.stats) {
      return 0;
    }

    return this.stats.guideProgress.completed
      + this.stats.guideProgress.inProgress
      + this.stats.guideProgress.notStarted;
  }

  get guideCompletedCount(): number {
    return this.stats?.guideProgress.completed ?? 0;
  }

  get guideStartedCount(): number {
    if (!this.stats) {
      return 0;
    }

    return (this.stats.guideProgress.completed ?? 0) + (this.stats.guideProgress.inProgress ?? 0);
  }

  get guideAverageProgressPercent(): number {
    if (!this.stats) {
      return 0;
    }

    const total = this.totalGuideProgress;
    if (total <= 0) {
      return 0;
    }

    const weightedScore = (this.stats.guideProgress.completed * 100)
      + (this.stats.guideProgress.inProgress * 50);
    return Math.round(weightedScore / total);
  }

  get guideCompletedPercent(): number {
    return this.computePercent(this.stats?.guideProgress.completed ?? 0, this.totalGuideProgress);
  }

  get guideInProgressPercent(): number {
    return this.computePercent(this.stats?.guideProgress.inProgress ?? 0, this.totalGuideProgress);
  }

  get guideNotStartedPercent(): number {
    return this.computePercent(this.stats?.guideProgress.notStarted ?? 0, this.totalGuideProgress);
  }

  get mostConsultedFormation(): FormationStatsBarItemDto | null {
    const topViewed = this.stats?.topViewed ?? [];
    return topViewed.length > 0 ? topViewed[0] : null;
  }

  get mostLikedFormation(): FormationStatsBarItemDto | null {
    const topLiked = this.stats?.topLiked ?? [];
    return topLiked.length > 0 ? topLiked[0] : null;
  }

  getPieBackground(): string {
    const completed = this.guideCompletedPercent;
    const inProgress = this.guideInProgressPercent;
    const startInProgress = completed;
    const startNotStarted = completed + inProgress;

    return `conic-gradient(
      #4f8f6c 0% ${completed}%,
      #c28e2c ${startInProgress}% ${startNotStarted}%,
      #9ca8b4 ${startNotStarted}% 100%
    )`;
  }

  getTopViewedMax(): number {
    return this.getBarMax(this.stats?.topViewed ?? []);
  }

  getTopLikedMax(): number {
    return this.getBarMax(this.stats?.topLiked ?? []);
  }

  getBarWidth(item: FormationStatsBarItemDto, maxValue: number): string {
    if (maxValue <= 0) {
      return '0%';
    }
    return `${Math.max(4, Math.round((item.value / maxValue) * 100))}%`;
  }

  getLinePoints(): string {
    const points = this.stats?.viewsTimeline ?? [];
    if (points.length === 0) {
      return '';
    }

    const maxValue = Math.max(...points.map((point) => point.value), 1);
    const width = 100;
    const height = 40;
    const stepX = points.length > 1 ? width / (points.length - 1) : width;

    return points.map((point, index) => {
      const x = Number((index * stepX).toFixed(2));
      const y = Number((height - ((point.value / maxValue) * height)).toFixed(2));
      return `${x},${y}`;
    }).join(' ');
  }

  getLineDots(): Array<{ x: number; y: number; label: string; value: number }> {
    const points = this.stats?.viewsTimeline ?? [];
    if (points.length === 0) {
      return [];
    }

    const maxValue = Math.max(...points.map((point) => point.value), 1);
    const width = 100;
    const height = 40;
    const stepX = points.length > 1 ? width / (points.length - 1) : width;

    return points.map((point, index) => ({
      x: Number((index * stepX).toFixed(2)),
      y: Number((height - ((point.value / maxValue) * height)).toFixed(2)),
      label: point.label,
      value: point.value
    }));
  }

  getDetailLinePoints(): string {
    const points = this.selectedFormationStats?.viewsEvolution ?? [];
    if (points.length === 0) {
      return '';
    }

    const maxValue = Math.max(...points.map((point) => point.value), 1);
    const width = 100;
    const height = 40;
    const stepX = points.length > 1 ? width / (points.length - 1) : width;

    return points.map((point, index) => {
      const x = Number((index * stepX).toFixed(2));
      const y = Number((height - ((point.value / maxValue) * height)).toFixed(2));
      return `${x},${y}`;
    }).join(' ');
  }

  getDetailLineDots(): Array<{ x: number; y: number; label: string; value: number }> {
    const points = this.selectedFormationStats?.viewsEvolution ?? [];
    if (points.length === 0) {
      return [];
    }

    const maxValue = Math.max(...points.map((point) => point.value), 1);
    const width = 100;
    const height = 40;
    const stepX = points.length > 1 ? width / (points.length - 1) : width;

    return points.map((point, index) => ({
      x: Number((index * stepX).toFixed(2)),
      y: Number((height - ((point.value / maxValue) * height)).toFixed(2)),
      label: point.label,
      value: point.value
    }));
  }

  trackByBarItem(_index: number, item: FormationStatsBarItemDto): number {
    return item.formationId;
  }

  trackByLinePoint(_index: number, item: FormationStatsLinePointDto): string {
    return `${item.label}-${item.value}`;
  }

  selectFormation(item: FormationStatsBarItemDto): void {
    if (!item.formationId || this.isLoadingFormationDetail) {
      return;
    }

    this.selectedFormationStats = null;
    this.formationDetailMessage = '';
    this.isLoadingFormationDetail = true;

    this.formationService.getFormationStatsById(item.formationId).subscribe({
      next: (details) => {
        this.selectedFormationStats = details;
        this.isLoadingFormationDetail = false;
      },
      error: (error: HttpErrorResponse) => {
        this.selectedFormationStats = null;
        this.isLoadingFormationDetail = false;
        this.formationDetailMessage = this.getErrorMessage(error.status, error.error);
      }
    });
  }

  goBackToFormationList(): void {
    const isAdmin = this.authService.canAccessAdminPanel(this.authService.getRole());
    this.router.navigate(isAdmin ? ['/admin/formations'] : ['/public/formations']);
  }

  reload(): void {
    this.loadStats();
  }

  private loadStats(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.formationDetailMessage = '';
    this.selectedFormationStats = null;

    this.formationService.getFormationsStats().subscribe({
      next: (stats) => {
        const localHoverTopViewed = this.formationConsultationService.getTopConsulted(10);
        this.stats = {
          ...stats,
          topViewed: localHoverTopViewed.length > 0 ? localHoverTopViewed : stats.topViewed
        };
        this.isLoading = false;
        this.refreshTotalLikesFromFormations();
      },
      error: (error: HttpErrorResponse) => {
        this.stats = null;
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(error.status, error.error);
      }
    });
  }

  private refreshTotalLikesFromFormations(): void {
    this.loadTotalLikesFromAllFormations().subscribe({
      next: (totalLikes) => {
        if (!this.stats) {
          return;
        }
        if (!Number.isFinite(totalLikes) || totalLikes < 0) {
          return;
        }
        if (this.stats.kpi.totalLikes === totalLikes) {
          return;
        }

        this.stats = {
          ...this.stats,
          kpi: {
            ...this.stats.kpi,
            totalLikes
          }
        };
      },
      error: () => {
        // Keep backend KPI value as fallback when aggregation fails.
      }
    });
  }

  private loadTotalLikesFromAllFormations(
    page = 0,
    totalLikesAccumulator = 0
  ): Observable<number> {
    const pageSize = 100;

    return this.formationService.listFormations({
      page,
      size: pageSize
    }).pipe(
      switchMap((result) => {
        const pageLikes = result.items.reduce(
          (sum, formation) => sum + this.extractLikeCountFromSummary(formation),
          0
        );
        const nextAccumulator = totalLikesAccumulator + pageLikes;

        const currentPage = Math.max(0, page);
        const currentSize = pageSize;
        const totalElements = Math.max(0, Number(result.totalElements ?? 0));
        const reachedLastPage = result.items.length === 0
          || result.items.length < currentSize
          || ((currentPage + 1) * currentSize >= totalElements);

        if (reachedLastPage) {
          return of(nextAccumulator);
        }

        return this.loadTotalLikesFromAllFormations(page + 1, nextAccumulator);
      })
    );
  }

  private extractLikeCountFromSummary(formation: FormationSummaryDto): number {
    const record = formation as unknown as Record<string, unknown>;
    const candidates = [
      formation.likesCount,
      formation.favoriteCount,
      record['likeCount'],
      record['likes'],
      record['favoritesCount'],
      record['totalLikes'],
      record['totalFavorites']
    ];

    for (const candidate of candidates) {
      const parsed = this.toNonNegativeInteger(candidate);
      if (parsed !== null) {
        return parsed;
      }
    }

    return 0;
  }

  private toNonNegativeInteger(value: unknown): number | null {
    const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return null;
    }

    return Math.floor(parsed);
  }

  private canAccessStats(): boolean {
    return this.authService.canManageFormations();
  }

  private getBarMax(items: FormationStatsBarItemDto[]): number {
    if (items.length === 0) {
      return 0;
    }
    return Math.max(...items.map((item) => item.value), 0);
  }

  private computePercent(value: number, total: number): number {
    if (!Number.isFinite(value) || value < 0 || total <= 0) {
      return 0;
    }
    return Math.round((value / total) * 100);
  }

  private getErrorMessage(status: number, errorBody?: unknown): string {
    const backendMessage = this.resolveBackendMessage(errorBody);
    if (backendMessage) {
      return backendMessage;
    }

    switch (status) {
      case 401:
        return '401: Utilisateur non connecte.';
      case 403:
        return '403: Acces reserve a l administrateur ou au guide.';
      case 500:
        return '500: Erreur serveur pendant le chargement des statistiques.';
      default:
        return 'Impossible de charger les statistiques.';
    }
  }

  private resolveBackendMessage(errorBody: unknown): string {
    if (typeof errorBody === 'string' && errorBody.trim()) {
      return errorBody.trim();
    }

    if (!errorBody || typeof errorBody !== 'object') {
      return '';
    }

    const candidate = errorBody as { message?: unknown; error?: unknown; details?: unknown };
    return (typeof candidate.message === 'string' && candidate.message.trim())
      || (typeof candidate.error === 'string' && candidate.error.trim())
      || (typeof candidate.details === 'string' && candidate.details.trim())
      || '';
  }
}
