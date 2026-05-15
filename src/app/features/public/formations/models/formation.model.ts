import { FormationQuizItemDto, FormationSectionDto } from './ai-response.model';

export type FormationLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type FormationStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface FormationAuthorRef {
  id?: number;
  nom?: string;
  email?: string;
  role?: string;
}

export interface FormationSummaryDto {
  id: number;
  titre?: string;
  title?: string;
  nom?: string;
  description?: string;
  coverImageUrl?: string;
  imagePrincipale?: string;
  imageUrl?: string;
  photoUrl?: string;
  coverVideoUrl?: string;
  videoPrincipale?: string;
  videoUrl?: string;
  objectifs?: string[];
  objectives?: string[];
  contenu?: string;
  content?: string;
  sections?: FormationSectionDto[];
  resume?: string;
  summary?: string;
  level?: FormationLevel | string;
  role?: string;
  targetUser?: string;
  estimatedDuration?: string;
  duration?: number;
  statut?: FormationStatus | string;
  status?: FormationStatus | string;
  quiz?: FormationQuizItemDto[];
  dateCreation?: string;
  createdAt?: string;
  dateModification?: string;
  updatedAt?: string;
  // Link to GuideInteractif (separate entity), not the formation author.
  guideId?: number;
  guideInteractifId?: number;
  createdBy?: FormationAuthorRef;
  createdById?: number;
  createdByNom?: string;
  createdByEmail?: string;
  auteur?: FormationAuthorRef;
  auteurId?: number;
  auteurEmail?: string;
  auteurNom?: string;
  generatedByAi?: boolean;
  aiGenerated?: boolean;
  guideProgressPercent?: number;
  likesCount?: number;
  favoriteCount?: number;
  likedByCurrentUser?: boolean;
  isFavorite?: boolean;
}

export interface FormationListResult {
  items: FormationSummaryDto[];
  totalElements: number;
  page: number;
  size: number;
}

export interface FormationListQuery {
  page?: number;
  size?: number;
  search?: string;
  level?: FormationLevel | '';
  status?: FormationStatus | '';
}

export interface FormationUpsertPayload {
  titre: string;
  description: string;
  content?: string;
  objectives?: string[];
  sections?: FormationSectionDto[];
  summary?: string;
  level?: FormationLevel;
  estimatedDuration?: string;
  duration?: number;
  quiz?: FormationQuizItemDto[];
  status?: FormationStatus;
  generatedByAi?: boolean;
  aiGenerated?: boolean;
}
