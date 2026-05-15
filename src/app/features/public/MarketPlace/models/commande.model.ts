export interface Commande {
  idCommande: number;
  dateCommande: string;

  statut:
    | 'EN_ATTENTE'
    | 'VALIDEE'
    | 'PAYEE'
    | 'LIVREE'
    | 'EN_COURS'
    | 'ANNULEE';

  etatLivraison:
    | 'EN_ATTENTE'
    | 'EN_PREPARATION'
    | 'EN_COURS'
    | 'LIVREE'
    | 'ANNULEE';

  totalCommande: number;
}