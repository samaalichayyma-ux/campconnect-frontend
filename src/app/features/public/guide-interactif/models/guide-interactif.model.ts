export type GuidePageKey = 'formation-list' | 'formation-create' | 'formation-detail' | 'formation-edit';

export interface GuideStep {
  id: number;
  title: string;
  description: string;
  actionHint: string;
  actionKey?: string;
  mediaType?: 'IMAGE' | 'VIDEO';
  mediaUrl?: string;
  tutorial?: string;
  checklist?: string[];
}

export interface GuideDefinition {
  page: GuidePageKey;
  title: string;
  steps: GuideStep[];
}

export interface GuideProgressState {
  page: GuidePageKey;
  activeStep: number;
  completedStepIds: number[];
  closed: boolean;
  updatedAt: string;
  backendProgressId?: number;
}

export interface GuideProgressPayload {
  page: GuidePageKey;
  activeStep: number;
  completedStepIds: number[];
  closed: boolean;
}

export interface GuideRewardTemplate {
  title: string;
  description: string;
  objectives: string[];
  content: string;
  summary: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedDuration: string;
  quiz: Array<{
    question: string;
    choices: string[];
    correctAnswer: string;
  }>;
}

export interface GuideRewardState {
  badgeExpertFormationUnlocked: boolean;
  templateUnlocked: boolean;
  totalPoints: number;
  rewardedPages: GuidePageKey[];
  lastUnlockedAt: string;
  badgeName?: string;
  lastAwardedPoints?: number;
  rewardSource?: 'backend' | 'local';
}

export type GuideMediaType = 'IMAGE' | 'VIDEO';

export interface GuideMediaLink {
  id: string;
  page: GuidePageKey;
  stepId?: number;
  type: GuideMediaType;
  url: string;
  label: string;
  createdAt: string;
}

export interface FormationGuideStep {
  id: string;
  formationId?: number;
  order: number;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface FormationGuideProgressState {
  formationId: number;
  guideId?: number;
  userId?: number;
  activeStepOrder: number;
  completedStepOrders: number[];
  progressPercent: number;
  completedAt?: string;
  backendProgressId?: number;
}
