import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProfileService } from '../../../../core/services/profile.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CurrentUser } from '../../../public/profile/models/current-user.model';
import { Profile } from '../../../public/profile/models/profile.model';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-profile.component.html',
  styleUrl: './admin-profile.component.css'
})
export class AdminProfileComponent implements OnInit {
  user: CurrentUser | null = null;

  profile: Profile = {
    adresse: '',
    photo: '',
    biographie: ''
  };

  loading = false;
  saving = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.loading = true;
    this.errorMessage = '';

    this.profileService.getCurrentUser().subscribe({
      next: (data) => {
        this.user = data;
        this.profile = {
          adresse: data.adresse || '',
          photo: data.photo || '',
          biographie: data.biographie || ''
        };
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger le profil admin';
        this.loading = false;
      }
    });
  }

  saveProfile(): void {
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.profileService.updateMyProfile(this.profile).subscribe({
      next: () => {
        this.successMessage = 'Profil mis à jour avec succès';
        this.saving = false;
        this.loadCurrentUser();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la mise à jour du profil';
        this.saving = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/public']);
  }
}