export interface FormationStatsKpiDto {
  totalFormations: number;
  totalUsers: number;
  totalLikes: number;
  publishedFormations: number;
  draftFormations: number;
}

export interface FormationStatsBarItemDto {
  formationId: number;
  title: string;
  value: number;
}

export interface FormationGuideProgressBreakdownDto {
  completed: number;
  inProgress: number;
  notStarted: number;
}

export interface FormationStatsLinePointDto {
  label: string;
  value: number;
}

export interface FormationStatsOverviewDto {
  kpi: FormationStatsKpiDto;
  topViewed: FormationStatsBarItemDto[];
  topLiked: FormationStatsBarItemDto[];
  guideProgress: FormationGuideProgressBreakdownDto;
  viewsTimeline: FormationStatsLinePointDto[];
}

export interface FormationSingleStatsDto {
  formationId: number;
  title: string;
  viewsCount: number;
  likesCount: number;
  completionRate: number;
  averageProgress: number;
  averageQuizScore: number;
  viewsEvolution: FormationStatsLinePointDto[];
}
