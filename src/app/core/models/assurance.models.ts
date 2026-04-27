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
  DECLARE = 'DECLARE',
  EN_COURS = 'EN_COURS',
  ACCEPTE = 'ACCEPTE',
  REJETE = 'REJETE',
  INDEMNISE = 'INDEMNISE'
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
  paiements?: PaiementLight[];
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
  reclamations?: ReclamationLight[];
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
  [StatutSinistre.DECLARE]: 'Déclaré',
  [StatutSinistre.EN_COURS]: 'En cours',
  [StatutSinistre.ACCEPTE]: 'Accepté',
  [StatutSinistre.REJETE]: 'Rejeté',
  [StatutSinistre.INDEMNISE]: 'Indemnisé'
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