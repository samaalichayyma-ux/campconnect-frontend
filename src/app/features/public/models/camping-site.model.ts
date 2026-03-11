export interface CampingSite {
  idSite: number;
  nom: string;
  localisation: string;
  capacite: number;
  prixParNuit: number;
  image:string;
  description: string;
  statutDispo: 'AVAILABLE' | 'FULL' | 'CLOSED';
}