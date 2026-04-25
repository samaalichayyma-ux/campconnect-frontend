export enum StatutReclamation {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  RESOLUE = 'RESOLUE',
  REJETEE = 'REJETEE'
}

export interface Reclamation {
  id: number;
  description: string;
  dateCreation: string;
  statut: StatutReclamation;
  utilisateurNom?: string;
}