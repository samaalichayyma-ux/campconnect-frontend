export interface NotificationUser {
  id: number;
  titre: string;
  message: string;
  type:
  | 'WELCOME'
  | 'SECURITY'
  | 'PASSWORD_RESET'
  | 'PROFILE_UPDATED'
  | 'GOOGLE_LOGIN'
  | 'ASSURANCE_SOUSCRIPTION_ACCEPTEE'
  | 'ASSURANCE_EXPIRATION'
  | 'ASSURANCE_SINISTRE_EN_COURS'
  | 'ASSURANCE_REMBOURSEMENT';
  read: boolean;
  createdAt: string;
}