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
  styleUrls: ['./notification-history.component.scss']
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
      error: (error) => {
        console.error('Error loading notification history', error);
        this.errorMessage = 'Unable to load notification history. Please try again later.';
        this.loading = false;
      }
    });
  }

  markAsRead(notification: NotificationUser): void {
    if (notification.read) return;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) =>
          n.id === notification.id ? { ...n, read: true } : n
        );
      },
      error: (error) => {
        console.error('Error marking notification as read', error);
      }
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((notification) => ({
          ...notification,
          read: true
        }));
      },
      error: (error) => {
        console.error('Error marking all notifications as read', error);
      }
    });
  }

  get unreadCount(): number {
    return this.notifications.filter((notification) => !notification.read).length;
  }

  get readCount(): number {
    return this.notifications.filter((notification) => notification.read).length;
  }

  get totalCount(): number {
    return this.notifications.length;
  }

  trackByNotificationId(index: number, notification: NotificationUser): number {
    return notification.id;
  }

  getNotificationLabel(type: string): string {
    switch (type) {
      case 'WELCOME':
        return 'Welcome';

      case 'SECURITY':
        return 'Security';

      case 'PASSWORD_RESET':
        return 'Password';

      case 'PROFILE_UPDATED':
        return 'Profile';

      case 'GOOGLE_LOGIN':
        return 'Google Login';

      case 'ASSURANCE_REMBOURSEMENT':
        return 'Insurance Refund';

      case 'ASSURANCE_SOUSCRIPTION_ACCEPTEE':
        return 'Subscription';

      case 'ASSURANCE_EXPIRATION':
        return 'Expiration';

      case 'ASSURANCE_SINISTRE_EN_COURS':
        return 'Claim';

      default:
        return type;
    }
  }
}