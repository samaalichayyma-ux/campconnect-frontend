export interface NotificationUser {
  id: number;
  titre: string;
  message: string;
  type: 'WELCOME' | 'SECURITY' | 'PASSWORD_RESET' | 'PROFILE_UPDATED' | 'GOOGLE_LOGIN';
  read: boolean;
  createdAt: string;
}