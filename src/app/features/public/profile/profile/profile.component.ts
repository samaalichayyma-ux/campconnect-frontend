import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {

  role = '';
  name = '';
  email = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.role = this.authService.getRole();
    this.name = this.authService.getUserName();
    this.email = this.authService.getUserEmail();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/public']);
  }

}
