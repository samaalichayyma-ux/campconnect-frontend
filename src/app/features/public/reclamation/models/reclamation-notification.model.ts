export type StatutReclamation =

  | 'EN_COURS'
  | 'RESOLUE'
  | 'REJETEE';

export interface ReclamationNotification {
  id: number;
  reclamationId: number;
  message: string;
  oldStatut: StatutReclamation;
  newStatut: StatutReclamation;
  dateCreation: string;
  read: boolean;
  readAt?: string;
}

export interface ReclamationUnreadCount {
  unreadCount: number;
}
