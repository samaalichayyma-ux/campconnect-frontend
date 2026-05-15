export interface FormationSummaryDto {
  id: number;
  titre?: string;
  title?: string;
  nom?: string;
  description?: string;
  level?: string;
  role?: string;
  targetUser?: string;
  estimatedDuration?: string;
  dateCreation?: string;
  createdAt?: string;
  guideId?: number;
  guideInteractifId?: number;
  createdById?: number;
  createdByNom?: string;
  createdByEmail?: string;
  auteurId?: number;
  auteurNom?: string;
  auteurEmail?: string;
}

export interface FormationListResult {
  items: FormationSummaryDto[];
  totalElements: number;
  page: number;
  size: number;
}
