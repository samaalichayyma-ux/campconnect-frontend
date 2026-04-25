import { CampingSite } from './camping-site.model';

export interface UpdateSiteBooking {
  idInscription?: number;
  dateDebut: string;
  dateFin: string;
  numberOfGuests: number;
  statut: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  siteCamping: CampingSite;
}

export interface SiteBooking {
  idInscription?: number;
  dateDebut: string;
  dateFin: string;
  numberOfGuests: number;
  siteId: number;
}

