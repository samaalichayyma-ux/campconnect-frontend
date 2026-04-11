import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';
import { NotificationUser } from '../../../../core/models/notification.model';

@Component({
  selector: 'app-notification-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notification-history.component.html',
  styleUrl: './notification-history.component.css'
})
export class NotificationHistoryComponent implements OnInit {
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
      error: () => {
        this.errorMessage = 'Impossible de charger l’historique des notifications';
        this.loading = false;
      }
    });
  }

  markAsRead(notification: NotificationUser): void {
    if (notification.read) return;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.map(n =>
          n.id === notification.id ? { ...n, read: true } : n
        );
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
}