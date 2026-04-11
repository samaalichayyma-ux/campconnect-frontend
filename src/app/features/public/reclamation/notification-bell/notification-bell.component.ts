import {
  Component, OnInit, OnDestroy, HostListener, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../../../core/services/auth.service';
import {
  ReclamationNotification,
  ReclamationUnreadCount
} from '../models/reclamation-notification.model';

import { ReclamationService } from '../reclamation.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css']
})
export class NotificationBellComponent implements OnInit, OnDestroy {

  private readonly authService = inject(AuthService);
  private readonly notifService = inject(ReclamationService);
  private readonly router = inject(Router);

  unreadCount = 0;
  notifications: ReclamationNotification[] = [];
  isPanelOpen = false;
  isLoading = false;

  private pollSub?: Subscription;
  private readonly POLL_MS = 30000;

  ngOnInit(): void {
    this.fetchUnreadCount();

    this.pollSub = interval(this.POLL_MS)
      .pipe(filter(() => this.authService.isLoggedIn()))
      .subscribe(() => this.fetchUnreadCount());
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  private fetchUnreadCount(): void {
    if (!this.authService.isLoggedIn()) return;

    this.notifService.getUnreadCount().subscribe({
      next: (res: ReclamationUnreadCount) => {
        this.unreadCount = res.unreadCount;
      },
      error: () => {}
    });
  }

  togglePanel(): void {
    this.isPanelOpen = !this.isPanelOpen;
    if (this.isPanelOpen) this.loadNotifications();
  }

  private loadNotifications(): void {
    this.isLoading = true;

    this.notifService.getMyNotifications().subscribe({
      next: (list: ReclamationNotification[]) => {
        this.notifications = list.sort(
          (a, b) =>
            new Date(b.dateCreation).getTime() -
            new Date(a.dateCreation).getTime()
        );
        this.isLoading = false;
      },
      error: () => (this.isLoading = false)
    });
  }

  openNotification(n: ReclamationNotification): void {
    if (!n.read) {
      this.notifService.markAsRead(n.id).subscribe({
        next: () => {
          n.read = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        },
        error: () => {}
      });
    }

    this.isPanelOpen = false;
    this.router.navigate(['/public/reclamations']);
  }

  markAllRead(): void {
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.read = true);
        this.unreadCount = 0;
      },
      error: () => {}
    });
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest('.nb-wrapper')) {
      this.isPanelOpen = false;
    }
  }

  getStatutLabel(s: string): string {
    return {
   
      EN_COURS: '🔵 In Progress',
      RESOLUE: '✅ Resolved',
      REJETEE: '❌ Rejected'
    }[s] ?? s;
  }

  getStatutClass(s: string): string {
    return {
      EN_COURS: 'nb-progress',
      RESOLUE: 'nb-resolved',
      REJETEE: 'nb-rejected'
    }[s] ?? '';
  }
}