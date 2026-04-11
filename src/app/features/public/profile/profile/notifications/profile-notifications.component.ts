import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationUser } from '../../../../../core/models/notification.model';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  selector: 'app-profile-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-notifications.component.html',
  styleUrls: ['./profile-notifications.component.css']
})
export class ProfileNotificationsComponent implements OnInit {
  notifications: NotificationUser[] = [];
  loading = false;
  errorMessage = '';

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.errorMessage = '';

    this.notificationService.getMyNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement notifications', error);
        this.errorMessage = 'Impossible de charger les notifications';
        this.loading = false;
      }
    });
  }

  markAsRead(notification: NotificationUser): void {
    if (notification.read) return;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: (updatedNotification) => {
        const index = this.notifications.findIndex(n => n.id === updatedNotification.id);
        if (index !== -1) {
          this.notifications[index] = updatedNotification;
        }
      },
      error: (error) => {
        console.error('Erreur markAsRead', error);
      }
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map(notification => ({
          ...notification,
          read: true
        }));
      },
      error: (error) => {
        console.error('Erreur markAllAsRead', error);
      }
    });
  }

  get unreadCount(): number {
    return this.notifications.filter(notification => !notification.read).length;
  }

  trackByNotificationId(index: number, notification: NotificationUser): number {
    return notification.id;
  }

  getTypeLabel(type: string): string {
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
}