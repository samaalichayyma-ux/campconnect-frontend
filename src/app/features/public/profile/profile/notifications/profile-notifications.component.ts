import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationUser } from '../../../../../core/models/notification.model';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  selector: 'app-profile-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-notifications.component.html',
  styleUrls: ['./profile-notifications.component.scss']
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
        console.error('Error loading notifications', error);
        this.errorMessage = 'Unable to load notifications. Please try again later.';
        this.loading = false;
      }
    });
  }

  markAsRead(notification: NotificationUser): void {
    if (notification.read) return;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: (updatedNotification) => {
        const index = this.notifications.findIndex(
          (n) => n.id === updatedNotification.id
        );

        if (index !== -1) {
          this.notifications[index] = updatedNotification;
        }
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

  trackByNotificationId(index: number, notification: NotificationUser): number {
    return notification.id;
  }

  getTypeLabel(type: string): string {
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
        return 'Insurance';
      default:
        return type;
    }
  }
}