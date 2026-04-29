export type TypeCommandeLivraison = 'CLASSIQUE' | 'REPAS';

export type StatutLivraison =
  | 'PLANIFIEE'
  | 'EN_COURS'
  | 'LIVREE'
  | 'ECHOUEE'
  | 'RETOURNEE'
  | 'ANNULEE';

export interface LivraisonCreateRequest {
  commandeId: number;
  typeCommande: TypeCommandeLivraison;
  adresseLivraison: string;
  commentaire?: string;
}

export interface AssignLivreurRequest {
  livreurId: number;
}

export interface LivraisonStatusUpdateRequest {
  statut: StatutLivraison;
  preuveLivraison?: string;
  commentaire?: string;
  currentLatitude?: number;
  currentLongitude?: number;
}

export interface LivraisonResponse {
  idLivraison: number;
  dateDepart: string | null;
  dateLivraisonEffective: string | null;
  adresseLivraison: string;
  statut: StatutLivraison;
  preuveLivraison: string | null;
  commentaire: string | null;

  livreurId: number | null;
  livreurNom: string | null;
  livreurPrenom: string | null;
  livreurEmail: string | null;

  latitudeLivraison?: number;
  longitudeLivraison?: number;

  commandeId: number | null;
  typeCommande: TypeCommandeLivraison | null;
}

export interface LivraisonStatsResponse {
  totalAssigned: number;
  planned: number;
  inProgress: number;
  delivered: number;
  failed: number;
  returnedCount: number;
}

export interface AvailableOrderForLivraisonResponse {
  commandeId: number;
  typeCommande: TypeCommandeLivraison;
  dateCommande: string | null;
  statut: string | null;
  total: number;

  clientId: number | null;
  clientEmail: string | null;
  clientNom: string | null;
  clientTelephone: string | null;
}

export interface LivreurResponse {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
}