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

  canAccessCampingManagement(): boolean {
    return this.isAdmin() || this.isGuide();
  }

  getDashboardRoute(): string {
  return this.isGuide() ? '/admin/owner-dashboard' : '/admin/dashboard';
}

getDashboardLabel(): string {
  return this.isGuide() ? 'My Dashboard' : 'Dashboard';
}

getPageTitle(): string {
  if (this.isGuide()) {
    return 'Camp Host Panel';
  }
  return 'Administration';
}

getPageSubtitle(): string {
  if (this.isGuide()) {
    return 'Manage your camping sites, bookings, and guest reviews.';
  }
  return 'Manage your platform with clarity and control.';
}
}
