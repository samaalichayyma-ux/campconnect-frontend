export interface CampingSite {
  idSite: number;
  nom: string;
  localisation: string;
  capacite: number;
  remainingCapacity?: number;
  prixParNuit: number;
  imageUrl?:string;
  description?: string;
  statutDispo: 'AVAILABLE' | 'FULL' | 'CLOSED';
  ownerId?: number;
  ownerEmail?: string;
}