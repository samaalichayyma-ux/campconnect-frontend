import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-camping-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './camping-navbar.component.html',
  styleUrl: './camping-navbar.component.css'
})
export class CampingNavbarComponent {

  constructor(public authService: AuthService) {}

  isGuide(): boolean {
    return this.authService.getRole() === 'GUIDE';
  }
}
