import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../../../core/services/profile.service';
import { CurrentUser } from '../models/current-user.model';
import { Profile } from '../models/profile.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {

  user: CurrentUser | null = null;
  imagePreview: string | null = null;
  photoUrlInput = '';

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
    const token = localStorage.getItem('token');

    if (!token) {
      this.errorMessage = 'Utilisateur non connecté';
      return;
    }

    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
  this.loading = true;
  this.successMessage = '';
  this.errorMessage = '';

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
      this.errorMessage = 'Impossible de charger les informations utilisateur';
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