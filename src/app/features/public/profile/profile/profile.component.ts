import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { NotificationService } from '../../../../core/services/notification.service';

import { CurrentUser } from '../models/current-user.model';
import { Profile } from '../models/profile.model';
import { NotificationUser } from '../../../../core/models/notification.model';
import {
  TwoFactorAuthService,
  TwoFactorSetupResponse,
  TwoFactorStatusResponse
} from '../../../../core/services/two-factor-auth.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  animations: [
    trigger('fadeSlideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(25px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeScale', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.96)' }),
        animate('350ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class ProfileComponent implements OnInit {
  user: CurrentUser | null = null;
  imagePreview: string | null = null;
  photoUrlInput = '';

  profile: Profile = {
    adresse: '',
    photo: '',
    biographie: ''
  };

  notifications: NotificationUser[] = [];
  showNotificationsPanel = false;

  loading = false;
  saving = false;
  notificationsLoading = false;

  successMessage = '';
  errorMessage = '';
  notificationErrorMessage = '';

  twoFactorEnabled = false;
  twoFactorVerified = false;
  isSettingUp2FA = false;

  twoFactorQrCode: string | null = null;
  twoFactorSecret: string | null = null;
  otpCode = '';

  twoFactorMessage = '';
  twoFactorError = '';

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private twoFactorAuthService: TwoFactorAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      this.errorMessage = 'Utilisateur non connecté';
      return;
    }

    this.loadCurrentUser();
    this.loadNotifications();
    this.loadTwoFactorStatus();
  }

   loadTwoFactorStatus(): void {
    this.twoFactorError = '';

    this.twoFactorAuthService.getStatus().subscribe({
      next: (status: TwoFactorStatusResponse) => {
        this.twoFactorEnabled = status.enabled;
        this.twoFactorVerified = status.verified;
      },
      error: () => {
        this.twoFactorError = 'Impossible de charger le statut de sécurité';
      }
    });
  }

  setupTwoFactor(): void {
    this.twoFactorMessage = '';
    this.twoFactorError = '';

    this.twoFactorAuthService.setup().subscribe({
      next: (response: TwoFactorSetupResponse) => {
        this.isSettingUp2FA = true;
        this.twoFactorQrCode = response.qrCodeBase64;
        this.twoFactorSecret = response.secret;
      },
      error: () => {
        this.twoFactorError = 'Erreur lors de l’initialisation du 2FA';
      }
    });
  }

  verifyTwoFactor(): void {
    if (!this.otpCode.trim()) {
      this.twoFactorError = 'Veuillez saisir le code OTP';
      return;
    }

    this.twoFactorMessage = '';
    this.twoFactorError = '';

    this.twoFactorAuthService.verify(this.otpCode).subscribe({
      next: (response) => {
        if (response.success) {
          this.twoFactorMessage = response.message;
          this.twoFactorEnabled = true;
          this.twoFactorVerified = true;
          this.isSettingUp2FA = false;
          this.otpCode = '';
          this.twoFactorQrCode = null;
          this.twoFactorSecret = null;
          this.loadTwoFactorStatus();
        } else {
          this.twoFactorError = response.message;
        }
      },
      error: () => {
        this.twoFactorError = 'Code invalide ou erreur serveur';
      }
    });
  }

    disableTwoFactor(): void {
    this.twoFactorMessage = '';
    this.twoFactorError = '';

    this.twoFactorAuthService.disable().subscribe({
      next: (response) => {
        this.twoFactorMessage = response.message;
        this.twoFactorEnabled = false;
        this.twoFactorVerified = false;
        this.isSettingUp2FA = false;
        this.twoFactorQrCode = null;
        this.twoFactorSecret = null;
        this.otpCode = '';
      },
      error: () => {
        this.twoFactorError = 'Erreur lors de la désactivation du 2FA';
      }
    });
  }

  loadCurrentUser(): void {
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.profileService.getCurrentUser().subscribe({
      next: (userData) => {
        this.user = userData;

        this.profileService.getMyProfile().subscribe({
          next: (profileData) => {
            this.profile = {
              adresse: profileData.adresse || '',
              photo: profileData.photo || '',
              biographie: profileData.biographie || ''
            };

            this.imagePreview =
              this.profile.photo && !this.profile.photo.startsWith('file:///')
                ? this.profile.photo
                : null;

            this.loading = false;
          },
          error: () => {
            this.errorMessage = 'Impossible de charger le profil';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les informations utilisateur';
        this.loading = false;
      }
    });
  }

  loadNotifications(): void {
    this.notificationsLoading = true;
    this.notificationErrorMessage = '';

    this.notificationService.getMyNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.notificationsLoading = false;
      },
      error: () => {
        this.notificationErrorMessage = 'Impossible de charger les notifications';
        this.notificationsLoading = false;
      }
    });
  }

  get unreadNotifications(): NotificationUser[] {
    return this.notifications.filter(notification => !notification.read);
  }

  get unreadNotificationsCount(): number {
    return this.unreadNotifications.length;
  }

  toggleNotificationsPanel(): void {
    this.showNotificationsPanel = !this.showNotificationsPanel;
  }

  markNotificationAsRead(notification: NotificationUser): void {
    if (notification.read) {
      return;
    }

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.map(n =>
          n.id === notification.id ? { ...n, read: true } : n
        );
      },
      error: () => {
        this.notificationErrorMessage = 'Erreur lors de la mise à jour de la notification';
      }
    });
  }

  markAllNotificationsAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map(notification => ({
          ...notification,
          read: true
        }));
      },
      error: () => {
        this.notificationErrorMessage = 'Erreur lors de la mise à jour des notifications';
      }
    });
  }

  goToNotificationsHistory(): void {
    this.router.navigate(['/public/notifications']);
  }

  applyPhotoUrl(): void {
    const url = this.photoUrlInput.trim();

    if (!url) {
      this.errorMessage = 'Veuillez saisir une URL d’image';
      return;
    }

    if (url.startsWith('file:///')) {
      this.errorMessage = 'Les chemins locaux ne sont pas autorisés';
      return;
    }

    this.profile.photo = url;
    this.imagePreview = url;
    this.photoUrlInput = '';
    this.errorMessage = '';
  }

  saveProfile(): void {
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.profileService.updateMyProfile(this.profile).subscribe({
      next: () => {
        this.successMessage = 'Profil mis à jour avec succès';
        this.saving = false;
        this.loadCurrentUser();
        this.loadNotifications();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la mise à jour du profil';
        this.saving = false;
      }
    });
  }

  getNotificationLabel(type: string): string {
    switch (type) {
      case 'WELCOME':
        return 'Bienvenue';
      case 'SECURITY':
        return 'Sécurité';
      case 'PASSWORD_RESET':
        return 'Mot de passe';
      case 'PROFILE_UPDATED':
        return 'Profil';
      case 'GOOGLE_LOGIN':
        return 'Google';
      default:
        return type;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/public']);
  }
}