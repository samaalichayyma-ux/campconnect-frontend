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

  imagePreview: string | null = null;
  photoUrlInput = '';

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
    this.successMessage = '';

    this.profileService.getCurrentUser().subscribe({
      next: (userData) => {
        this.user = userData;

        this.profileService.getMyProfile().subscribe({
          next: (profileData) => {
            this.profile = {
              adresse: profileData.adresse || '',
              photo: profileData.photo || '',
              biographie: profileData.biographie || ''
            };

            this.imagePreview =
              this.profile.photo && !this.profile.photo.startsWith('file:///')
                ? this.profile.photo
                : null;

            this.loading = false;
          },
          error: () => {
            this.errorMessage = 'Impossible de charger le profil';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.errorMessage = 'Impossible de charger le profil admin';
        this.loading = false;
      }
    });
  }

  applyPhotoUrl(): void {
    const url = this.photoUrlInput.trim();

    if (!url) {
      this.errorMessage = 'Veuillez saisir une URL d’image';
      return;
    }

    if (url.startsWith('file:///')) {
      this.errorMessage = 'Les chemins locaux ne sont pas autorisés';
      return;
    }

    this.profile.photo = url;
    this.imagePreview = url;
    this.photoUrlInput = '';
    this.errorMessage = '';
  }

  saveProfile(): void {
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.profileService.updateMyProfile(this.profile).subscribe({
      next: (updatedProfile) => {
        this.profile = {
          adresse: updatedProfile.adresse || '',
          photo: updatedProfile.photo || '',
          biographie: updatedProfile.biographie || ''
        };

        this.imagePreview =
          this.profile.photo && !this.profile.photo.startsWith('file:///')
            ? this.profile.photo
            : null;

        this.successMessage = 'Profil mis à jour avec succès';
        this.saving = false;
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