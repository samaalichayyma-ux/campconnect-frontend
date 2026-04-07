export enum StatutCommandeRepas {
  EN_ATTENTE = 'EN_ATTENTE',
  CONFIRMEE = 'CONFIRMEE',
  EN_PREPARATION = 'EN_PREPARATION',
  LIVREE = 'LIVREE'
}

export interface LigneCommandeRepas {
  id: number;
  quantite: number;
  prixUnitaire: number;
  repasNom?: string;
}

export interface CommandeRepas {
  id: number;
  dateCommande: string;
  montantTotal: number;
  statut: StatutCommandeRepas;
  clientNom?: string;
  lignes?: LigneCommandeRepas[];
}