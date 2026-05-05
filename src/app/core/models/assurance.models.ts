export enum TypeAssurance {
  ANNULATION = 'ANNULATION',
  ACCIDENT = 'ACCIDENT',
  RESPONSABILITE_CIVILE = 'RESPONSABILITE_CIVILE',
  VOL_EQUIPEMENT = 'VOL_EQUIPEMENT',
  DOMMAGE_MATERIEL = 'DOMMAGE_MATERIEL',
  ASSISTANCE_VOYAGE = 'ASSISTANCE_VOYAGE'
}

export enum StatutSouscription {
  EN_ATTENTE = 'EN_ATTENTE',
  ACTIVE = 'ACTIVE',
  EXPIREE = 'EXPIREE',
  ANNULEE = 'ANNULEE',
  SUSPENDUE = 'SUSPENDUE'
}

export enum TypeSinistre {
  ACCIDENT = 'ACCIDENT',
  ANNULATION = 'ANNULATION',
  VOL = 'VOL',
  DOMMAGE = 'DOMMAGE',
  BLESSURE = 'BLESSURE',
  AUTRE = 'AUTRE'
}

export enum StatutSinistre {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE',
  REMBOURSE = 'REMBOURSE'
}

export enum StatutRemboursement {
  EN_ATTENTE = 'EN_ATTENTE',
  EFFECTUE = 'EFFECTUE',
  REJETE = 'REJETE'
}

export enum TypeDocumentAssurance {
  CONTRAT = 'CONTRAT',
  CIN = 'CIN',
  JUSTIFICATIF = 'JUSTIFICATIF',
  PHOTO_DOMMAGE = 'PHOTO_DOMMAGE',
  FACTURE = 'FACTURE',
  RAPPORT_MEDICAL = 'RAPPORT_MEDICAL',
  AUTRE = 'AUTRE'
}

export interface UtilisateurLight {
  id?: number;
  nom?: string;
  email?: string;
  telephone?: string;
  role?: string;
}

export interface ReservationLight {
  id?: number;
  dateDebut?: string;
  dateFin?: string;
  statut?: string;
}

export interface PaiementLight {
  id?: number;
  montant?: number;
  methode?: string;
  datePaiement?: string;
}

export interface ReclamationLight {
  id?: number;
  description?: string;
  dateCreation?: string;
  statut?: string;
}

export interface Garantie {
  id?: number;
  nom: string;
  description: string;
  plafond: number;
  franchise: number;
  tauxRemboursement: number;
}

export interface Assurance {
  id?: number;
  titre: string;
  description: string;
  typeAssurance: TypeAssurance;
  montantCouverture: number;
  prime: number;
  dureeValidite: number;
  conditionsGenerales: string;
  active: boolean;
  garanties?: Garantie[];
}

export interface SouscriptionAssurance {
  id?: number;
  numeroContrat: string;
  dateSouscription?: string;
  dateDebut: string;
  dateFin: string;
  statut: StatutSouscription;
  montantPaye: number;
  beneficiaireNom: string;
  beneficiaireTelephone: string;

  assurance?: Assurance;
  utilisateur?: UtilisateurLight;
  reservation?: ReservationLight | null;
  inscriptionSite?: InscriptionSiteLight | null;
}

export interface Sinistre {
  id?: number;
  dateDeclaration?: string;
  typeSinistre: TypeSinistre;
  description: string;
  lieuIncident: string;
  montantEstime: number;
  montantRembourse?: number;
  statut: StatutSinistre;

  souscriptionAssurance?: SouscriptionAssurance;
reclamation?: ReclamationLight | null;
  documents?: DocumentAssurance[];
  remboursements?: Remboursement[];
}

export interface DocumentAssurance {
  id?: number;
  nomFichier: string;
  typeDocument: TypeDocumentAssurance;
  url: string;
  dateAjout?: string;
}

export interface Remboursement {
  id?: number;
  dateRemboursement?: string;
  montant: number;
  statut: StatutRemboursement;
  motif: string;
  sinistre?: Sinistre;
}

export interface InscriptionSiteLight {
  idInscription?: number;
  dateDebut?: string;
  dateFin?: string;
  numberOfGuests?: number;
  statut?: string;
}
export const TYPE_ASSURANCE_LABELS: Record<TypeAssurance, string> = {
  [TypeAssurance.ANNULATION]: 'Annulation',
  [TypeAssurance.ACCIDENT]: 'Accident',
  [TypeAssurance.RESPONSABILITE_CIVILE]: 'Responsabilité civile',
  [TypeAssurance.VOL_EQUIPEMENT]: 'Vol équipement',
  [TypeAssurance.DOMMAGE_MATERIEL]: 'Dommage matériel',
  [TypeAssurance.ASSISTANCE_VOYAGE]: 'Assistance voyage'
};

export const STATUT_SOUSCRIPTION_LABELS: Record<StatutSouscription, string> = {
  [StatutSouscription.EN_ATTENTE]: 'En attente',
  [StatutSouscription.ACTIVE]: 'Active',
  [StatutSouscription.EXPIREE]: 'Expirée',
  [StatutSouscription.ANNULEE]: 'Annulée',
  [StatutSouscription.SUSPENDUE]: 'Suspendue'
};

export const TYPE_SINISTRE_LABELS: Record<TypeSinistre, string> = {
  [TypeSinistre.ACCIDENT]: 'Accident',
  [TypeSinistre.ANNULATION]: 'Annulation',
  [TypeSinistre.VOL]: 'Vol',
  [TypeSinistre.DOMMAGE]: 'Dommage',
  [TypeSinistre.BLESSURE]: 'Blessure',
  [TypeSinistre.AUTRE]: 'Autre'
};

export const STATUT_SINISTRE_LABELS: Record<StatutSinistre, string> = {
  [StatutSinistre.EN_ATTENTE]: 'En attente',
  [StatutSinistre.EN_COURS]: 'En cours',
  [StatutSinistre.ACCEPTE]: 'Accepté',
  [StatutSinistre.REFUSE]: 'Refusé',
  [StatutSinistre.REMBOURSE]: 'Remboursé'
};

export const STATUT_REMBOURSEMENT_LABELS: Record<StatutRemboursement, string> = {
  [StatutRemboursement.EN_ATTENTE]: 'En attente',
  [StatutRemboursement.EFFECTUE]: 'Effectué',
  [StatutRemboursement.REJETE]: 'Rejeté'
};

export const TYPE_DOCUMENT_ASSURANCE_LABELS: Record<TypeDocumentAssurance, string> = {
  [TypeDocumentAssurance.CONTRAT]: 'Contrat',
  [TypeDocumentAssurance.CIN]: 'CIN',
  [TypeDocumentAssurance.JUSTIFICATIF]: 'Justificatif',
  [TypeDocumentAssurance.PHOTO_DOMMAGE]: 'Photo dommage',
  [TypeDocumentAssurance.FACTURE]: 'Facture',
  [TypeDocumentAssurance.RAPPORT_MEDICAL]: 'Rapport médical',
  [TypeDocumentAssurance.AUTRE]: 'Autre'
};

export interface WeatherVerificationRequest {
  lieu: string;
  date: string;
  description: string;
}

export interface WeatherVerificationResponse {
  lieu: string;
  date: string;
  condition: string;
  temperatureMoyenne: number;
  ventMaxKph: number;
  precipitationMm: number;
  meteoCompatible: boolean;
  niveauRisqueMeteo: 'FAIBLE' | 'MOYEN' | 'ELEVE';
  conclusion: string;
}

export interface CurrentWeatherResponse {
  ville: string;
  pays: string;
  localtime: string;
  condition: string;
  icon: string;
  temperatureC: number;
  feelsLikeC: number;
  windKph: number;
  humidity: number;
  precipitationMm: number;
  conseilAssurance: string;
}