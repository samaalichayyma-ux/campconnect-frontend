import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
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

}
