import { AdminUser } from "../../users/models/user.model";

export interface Commande {
  idCommande: number;
  dateCommande: string;
  statut: string;
  etatLivraison:string;
  totalCommande: number;
  utilisateur?: AdminUser;
}