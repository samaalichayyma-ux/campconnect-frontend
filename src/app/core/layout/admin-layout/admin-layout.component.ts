import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminIconComponent } from '../../components/admin-icon/admin-icon.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, AdminIconComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {
   adminName = '';
  adminRole = '';

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.adminName = this.authService.getUserName() || 'Admin CampConnect';
    this.adminRole = this.authService.getRole() || 'ADMINISTRATEUR';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isAdmin(): boolean {
    return this.adminRole === 'ADMINISTRATEUR';
  }

  isGuide(): boolean {
    return this.adminRole === 'GUIDE';
  }

  isLivreur(): boolean {
  return this.adminRole === 'LIVREUR';
}

  canAccessCampingManagement(): boolean {
    return this.isAdmin() || this.isGuide();
  }

  getDashboardRoute(): string {
  if (this.isGuide()) {
    return '/admin/owner-dashboard';
  }

  if (this.isLivreur()) {
    return '/admin/livraison/dashboard';
  }

  return '/admin/dashboard';
}

getDashboardLabel(): string {
  if (this.isGuide()) {
    return 'My Dashboard';
  }

  if (this.isLivreur()) {
    return 'Delivery Dashboard';
  }

  return 'Dashboard';
}

getPageTitle(): string {
  if (this.isGuide()) {
    return 'Camp Host Panel';
  }

  if (this.isLivreur()) {
    return 'Delivery Panel';
  }

  return 'Administration';
}

getPageSubtitle(): string {
  if (this.isGuide()) {
    return 'Manage your camping sites, bookings, and guest reviews.';
  }

  if (this.isLivreur()) {
    return 'Manage your assigned deliveries and update delivery progress.';
  }

  return 'Manage your platform with clarity and control.';
}

}
